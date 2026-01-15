import { streamText } from "ai";
import { geminiModel, parseActions, removeActionTags } from "@/lib/ai";
import { supabase } from "@/lib/supabase";
import { nanoid } from "nanoid";
import type { Question, QuestionType } from "@/types/database";


const db = supabase as any;

interface SurveyState {
  id?: string;
  title?: string;
  description?: string;
  questions: Question[];
  creator_code: string;
  isFinalized: boolean;
}

const CREATOR_SYSTEM_PROMPT = `You are a helpful survey creation assistant. You generate complete surveys from topics.

## Flow:
1. When user describes a topic (e.g., "customer satisfaction for a coffee shop"), generate:
   - An appropriate survey title
   - A brief description
   - 5-8 relevant questions with appropriate types
2. Present all generated content to the user for review
3. Let them remove questions, add questions, or finalize

## Question Types:
- text: Open-ended text response
- multiple_choice: Select from options (include 3-5 relevant options)
- rating: 1-5 scale rating
- yes_no: Yes/No question
- number: Numeric input
- date: Date selection

## IMPORTANT: Include ACTION tags at the END of your message. The user won't see them.

## Action Formats:
- Set title and description: <ACTION>{"type": "set_title", "title": "Survey Title"}</ACTION><ACTION>{"type": "set_description", "description": "Description text"}</ACTION>
- Set all questions at once: <ACTION>{"type": "set_questions", "questions": [{"type": "multiple_choice", "text": "Question?", "required": true, "options": ["A", "B", "C"]}, {"type": "rating", "text": "Rate X?", "required": true}]}</ACTION>
- Add one question: <ACTION>{"type": "add_question", "question": {"type": "text", "text": "Question?", "required": true}}</ACTION>
- Remove question by number: <ACTION>{"type": "remove_question", "index": 1}</ACTION>
- Finalize survey: <ACTION>{"type": "finalize"}</ACTION>

## Guidelines:
- When generating questions, use set_questions to set them all at once (not add_question for each)
- Mix question types appropriately for the topic
- Make most questions required, but leave 1-2 optional for open feedback
- When presenting questions, number them (1, 2, 3...) so user can reference by number
- When user wants to remove a question, use remove_question with the 0-based index
- Be conversational and helpful`;

export async function POST(request: Request) {
  try {
    const { messages, surveyState: incomingState } = await request.json();

    // Initialize or use existing state
    const surveyState: SurveyState = incomingState || {
      questions: [],
      creator_code: nanoid(12),
      isFinalized: false,
    };

    // Build context about current survey state
    let stateContext = "\n\nCurrent survey state:\n";
    if (surveyState.title) {
      stateContext += `- Title: ${surveyState.title}\n`;
    }
    if (surveyState.description) {
      stateContext += `- Description: ${surveyState.description}\n`;
    }
    if (surveyState.questions.length > 0) {
      stateContext += `- Questions (${surveyState.questions.length}):\n`;
      surveyState.questions.forEach((q, i) => {
        stateContext += `  ${i + 1}. [${q.type}${q.required ? ", required" : ""}] ${q.text}\n`;
      });
    }
    if (!surveyState.title) {
      stateContext += "- No title yet (ask for title first)\n";
    } else if (!surveyState.description) {
      stateContext += "- No description yet (ask for description next)\n";
    } else if (surveyState.questions.length === 0) {
      stateContext += "- No questions yet (start adding questions)\n";
    }

    const result = streamText({
      model: geminiModel,
      system: CREATOR_SYSTEM_PROMPT + stateContext,
      messages,
    });

    // Process the stream and extract actions
    let fullResponse = "";
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            fullResponse += chunk;
            // Stream the text without action tags
            const cleanChunk = removeActionTags(chunk);
            if (cleanChunk) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: cleanChunk })}\n\n`)
              );
            }
          }

          // Parse actions from complete response
          const actions = parseActions(fullResponse);
          const updatedState = { ...surveyState };

          for (const action of actions) {
            switch (action.type) {
              case "set_title":
                updatedState.title = action.title;
                break;
              case "set_description":
                updatedState.description = action.description;
                break;
              case "add_question": {
                const questionData = action.question || {};
                const newQuestion: Question = {
                  id: nanoid(8),
                  type: (questionData.type as QuestionType) || "text",
                  text: questionData.text || "",
                  required: questionData.required ?? true,
                  options: questionData.options,
                  validation: questionData.validation,
                };
                updatedState.questions = [...updatedState.questions, newQuestion];
                break;
              }
              case "set_questions": {
                // Replace all questions at once
                const questionsData = action.questions || [];
                updatedState.questions = questionsData.map((q: Partial<Question>) => ({
                  id: nanoid(8),
                  type: (q.type as QuestionType) || "text",
                  text: q.text || "",
                  required: q.required ?? true,
                  options: q.options,
                  validation: q.validation,
                }));
                break;
              }
              case "remove_question": {
                // Remove question by index (0-based)
                const index = typeof action.index === "number" ? action.index : parseInt(action.index, 10);
                if (!isNaN(index) && index >= 0 && index < updatedState.questions.length) {
                  updatedState.questions = updatedState.questions.filter((_, i) => i !== index);
                }
                break;
              }
              case "finalize":
                // Create survey in database
                if (updatedState.title) {
                  const { data: survey } = await db
                    .from("surveys")
                    .insert({
                      title: updatedState.title,
                      description: updatedState.description || null,
                      questions: updatedState.questions,
                      creator_code: updatedState.creator_code,
                      settings: {},
                      status: "active",
                    })
                    .select()
                    .single();

                  if (survey) {
                    updatedState.id = survey.id;
                    updatedState.isFinalized = true;
                  }
                }
                break;
            }
          }

          // Send final state update
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, surveyState: updatedState })}\n\n`
            )
          );
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Creator chat error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

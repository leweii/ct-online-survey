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

const CREATOR_SYSTEM_PROMPT = `You are a helpful survey creation assistant. Guide the user through creating a survey step by step.

Your responsibilities:
1. First, ask for the survey title
2. Then ask for a brief description
3. Help add questions one at a time
4. For each question, determine:
   - The question text
   - The question type (text, multiple_choice, rating, yes_no, date, number)
   - Whether it's required
   - For multiple_choice: the options
   - For text: optional min/max length
   - For number/rating: optional min/max values
5. Ask if they want to add more questions or finish
6. When done, finalize the survey

IMPORTANT: When you need to perform an action, include an ACTION tag at the END of your message.
The user won't see the ACTION tags.

Action formats:
- Set title: <ACTION>{"type": "set_title", "title": "Survey Title"}</ACTION>
- Set description: <ACTION>{"type": "set_description", "description": "Description text"}</ACTION>
- Add question: <ACTION>{"type": "add_question", "question": {"type": "text|multiple_choice|rating|yes_no|date|number", "text": "Question text", "required": true, "options": ["opt1", "opt2"], "validation": {"min": 1, "max": 5}}}</ACTION>
- Finalize survey: <ACTION>{"type": "finalize"}</ACTION>

Be conversational and friendly. Ask one thing at a time. Confirm each step before moving on.`;

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

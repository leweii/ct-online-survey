import { streamText } from "ai";
import { geminiPro, parseActions, removeActionTags } from "@/lib/ai";
import { supabase } from "@/lib/supabase";
import { nanoid } from "nanoid";
import type { Question, QuestionType } from "@/types/database";
import {
  generateUniqueShortCode,
  generateUniqueCreatorName,
} from "@/lib/identifiers";

const db = supabase as any;

interface SurveyState {
  id?: string;
  short_code?: string;  // User-facing survey code
  title?: string;
  description?: string;
  questions: Question[];
  creator_code: string;  // Legacy, kept for backward compatibility
  creator_name?: string;  // Fun pet name for creator
  isFinalized: boolean;
  language?: string; // Auto-detected from user input
}

const CREATOR_SYSTEM_PROMPT = `You are a professional survey design expert. You create comprehensive, high-quality, scientifically rigorous surveys.

## IMPORTANT: Language Detection
- Detect the language the user is using (e.g., Chinese, English, Spanish, etc.)
- ALWAYS respond in the SAME language as the user
- Generate survey title, description, and questions in the user's language
- Include set_language action with the detected language code (e.g., "zh" for Chinese, "en" for English, "es" for Spanish)

## Professional Survey Design Principles:
1. **Question Clarity**: Each question should be clear, unambiguous, and ask only one thing
2. **Question Order**: Start with easy, engaging questions; place sensitive questions later
3. **Response Options**: Provide balanced, mutually exclusive options that cover all possibilities
4. **Avoid Bias**: Use neutral language; don't lead respondents toward certain answers
5. **Logical Flow**: Group related questions together; use smooth transitions
6. **Comprehensive Coverage**: Cover all relevant aspects of the topic thoroughly

## CRITICAL: Question Quantity
- **ALWAYS generate 21-28 questions initially** - this is mandatory
- Users will review and remove questions they don't need
- It's better to provide more questions for users to select from
- Cover the topic from multiple angles: demographics, behaviors, attitudes, preferences, satisfaction, suggestions, etc.
- Group questions into logical sections (e.g., 基本信息、使用体验、满意度评价、改进建议)

## Flow:
1. When user describes a topic, detect their language first
2. Analyze the survey goal and target audience thoroughly
3. Generate in the SAME language:
   - A professional, descriptive survey title
   - A clear description explaining the survey's purpose
   - **21-28 comprehensive questions** covering all aspects of the topic
4. Present all generated content to the user for review (in their language)
5. Tell user they can remove questions by specifying the question numbers (e.g., "删除问题 3, 7, 15")
6. Let them modify, add, remove questions, or finalize

## Question Types (use appropriately):
- text: Open-ended responses (for qualitative insights, feedback)
- multiple_choice: Single selection from 3-5 balanced options (for categorical data)
- rating: 1-5 scale (for measuring satisfaction, agreement, frequency)
- yes_no: Binary questions (for clear yes/no scenarios only)
- number: Numeric input (for age, quantity, frequency counts)
- date: Date selection (for time-related data)

## IMPORTANT: Include ACTION tags at the END of your message. The user won't see them.

## Action Formats:
- Set language (ALWAYS include first): <ACTION>{"type": "set_language", "language": "zh"}</ACTION>
- Set title and description: <ACTION>{"type": "set_title", "title": "Survey Title"}</ACTION><ACTION>{"type": "set_description", "description": "Description text"}</ACTION>
- Set all questions at once: <ACTION>{"type": "set_questions", "questions": [{"type": "multiple_choice", "text": "Question?", "required": true, "options": ["A", "B", "C"]}, {"type": "rating", "text": "Rate X?", "required": true}]}</ACTION>
- Add one question: <ACTION>{"type": "add_question", "question": {"type": "text", "text": "Question?", "required": true}}</ACTION>
- Remove question by number: <ACTION>{"type": "remove_question", "index": 1}</ACTION>
- Finalize survey: <ACTION>{"type": "finalize"}</ACTION>

## Professional Guidelines:
- ALWAYS detect language and include set_language action in your FIRST response
- **MUST generate 21-28 questions on first response** - no fewer than 21 questions
- Design questions that yield actionable insights
- Use set_questions to set all questions at once (not add_question for each)
- Mix question types strategically: use rating for satisfaction, multiple_choice for preferences, text for feedback
- Make most questions required; leave 2-3 optional for open feedback
- For multiple choice: provide balanced, comprehensive options with an "其他/Other" option when appropriate
- For rating questions: clearly define what the scale means (e.g., 1=非常不满意, 5=非常满意)
- Number questions (1, 2, 3...) so user can reference them for removal
- When user wants to remove questions (e.g., "删除 3, 5, 8"), use multiple remove_question actions with 0-based indices
- After user removes questions, show the updated list with new numbering
- Be professional yet conversational - IN THE USER'S LANGUAGE`;

export async function POST(request: Request) {
  try {
    const { messages, surveyState: incomingState, customCreatorName } = await request.json();

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
      model: geminiPro,
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
              case "set_language":
                updatedState.language = action.language;
                break;
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
                  // Generate new identifiers
                  const shortCode = await generateUniqueShortCode(db);
                  const language = updatedState.language || "zh";
                  // Use custom creator name if provided, otherwise generate a random one
                  const creatorName = customCreatorName?.trim() || await generateUniqueCreatorName(db, language);

                  const { data: survey } = await db
                    .from("surveys")
                    .insert({
                      title: updatedState.title,
                      description: updatedState.description || null,
                      questions: updatedState.questions,
                      short_code: shortCode,
                      creator_code: updatedState.creator_code,
                      creator_name: creatorName,
                      settings: {
                        language: language,
                      },
                      status: "active",
                    })
                    .select()
                    .single();

                  if (survey) {
                    updatedState.id = survey.id;
                    updatedState.short_code = survey.short_code;
                    updatedState.creator_name = survey.creator_name;
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

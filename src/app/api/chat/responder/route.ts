import { streamText } from "ai";
import { geminiModel, parseActions, StreamActionBuffer } from "@/lib/ai";
import { supabase } from "@/lib/supabase";
import type { Question, Survey } from "@/types/database";
import { isUUID, isShortCode } from "@/lib/identifiers";

const db = supabase as any;

interface ResponseState {
  responseId: string;
  surveyId: string;
  currentQuestionIndex: number;
  answers: Record<string, unknown>;
  isCompleted: boolean;
}

function buildResponderPrompt(
  survey: Survey,
  currentQuestion: Question,
  questionIndex: number,
  totalQuestions: number,
  previousAnswers: Record<string, unknown>,
  questions: Question[]
): string {
  const surveyLanguage = survey.settings?.language || "en";

  let prompt = `You are a friendly survey assistant helping someone complete the survey "${survey.title}".

## IMPORTANT: Language Handling
- Survey language: ${surveyLanguage}
- Default: Respond in the survey's language (${surveyLanguage})
- If the user types in a DIFFERENT language, adapt your responses to THEIR language
- However, ALWAYS keep the question text in the original survey language
- Example: If survey is in Chinese but user types in English, explain in English but show the Chinese question text

Current question (${questionIndex + 1} of ${totalQuestions}):
- Question: ${currentQuestion.text}
- Type: ${currentQuestion.type}
- Required: ${currentQuestion.required ? "Yes" : "No"}`;

  if (currentQuestion.type === "multiple_choice" && currentQuestion.options) {
    prompt += `\n- Options: ${currentQuestion.options.map((o, i) => `${i + 1}. ${o}`).join(", ")}`;
  }
  if (currentQuestion.type === "multi_select" && currentQuestion.options) {
    prompt += `\n- Options (can select multiple): ${currentQuestion.options.map((o, i) => `${i + 1}. ${o}`).join(", ")}`;
  }
  if (currentQuestion.type === "dropdown" && currentQuestion.options) {
    prompt += `\n- Options: ${currentQuestion.options.join(", ")}`;
  }
  if (currentQuestion.type === "rating") {
    const min = currentQuestion.validation?.min ?? 1;
    const max = currentQuestion.validation?.max ?? 5;
    prompt += `\n- Scale: ${min} to ${max}`;
  }
  if (currentQuestion.type === "slider") {
    const min = currentQuestion.validation?.min ?? 0;
    const max = currentQuestion.validation?.max ?? 100;
    prompt += `\n- Slider range: ${min} to ${max}`;
  }
  if (currentQuestion.type === "number" && currentQuestion.validation) {
    if (currentQuestion.validation.min !== undefined) {
      prompt += `\n- Minimum value: ${currentQuestion.validation.min}`;
    }
    if (currentQuestion.validation.max !== undefined) {
      prompt += `\n- Maximum value: ${currentQuestion.validation.max}`;
    }
  }
  if (currentQuestion.type === "email") {
    prompt += `\n- Format: Valid email address`;
  }
  if (currentQuestion.type === "phone") {
    prompt += `\n- Format: Phone number`;
  }

  // Add next question info for auto-advance
  const isLastQuestion = questionIndex === totalQuestions - 1;
  let nextQuestionInfo = "";
  if (!isLastQuestion) {
    const nextQ = questions[questionIndex + 1];
    nextQuestionInfo = `\n\nNext question (${questionIndex + 2} of ${totalQuestions}):
- Question: ${nextQ.text}
- Type: ${nextQ.type}`;
    if (nextQ.type === "multiple_choice" && nextQ.options) {
      nextQuestionInfo += `\n- Options: ${nextQ.options.join(", ")}`;
    }
    if (nextQ.type === "rating") {
      nextQuestionInfo += `\n- Scale: ${nextQ.validation?.min ?? 1} to ${nextQ.validation?.max ?? 5}`;
    }
  }

  prompt += `

Your responsibilities:
1. Validate the user's response based on the question type
2. If valid, acknowledge briefly and IMMEDIATELY present the next question
3. If they ask for clarification, explain the question differently
4. If they want to go back, allow it
5. Keep responses concise - no unnecessary chatter

IMPORTANT AUTO-ADVANCE: After saving a valid answer, you MUST immediately present the next question in the SAME response. Do NOT wait for the user to ask for it. Keep acknowledgments brief (e.g., "Great!" or "Got it!") then move on.
${nextQuestionInfo}

IMPORTANT: Include ACTION tags at the END of your message.

Action formats:
- Save answer: <ACTION>{"type": "save_answer", "questionId": "${currentQuestion.id}", "value": "the answer"}</ACTION>
- Go back: <ACTION>{"type": "go_back"}</ACTION>
- Complete survey (only on last question): <ACTION>{"type": "complete"}</ACTION>

Value formats:
- multiple_choice: save the actual option text, not the number
- multi_select: save as JSON array of selected option texts, e.g., ["Option A", "Option C"]
- dropdown: save the actual option text
- yes_no: save "yes" or "no"
- rating: save the number
- slider: save the number
- date: save in YYYY-MM-DD format
- email: save the email address
- phone: save the phone number

Previous answers: ${Object.keys(previousAnswers).length} of ${totalQuestions} completed.
${isLastQuestion ? "This is the LAST question. After a valid answer, include both save_answer AND complete actions." : ""}`;

  return prompt;
}

export async function POST(request: Request) {
  try {
    const { messages, responseState: incomingState, surveyId } = await request.json();

    // Get survey - support both UUID and short_code
    let query = db.from("surveys").select("*");

    if (isUUID(surveyId)) {
      query = query.eq("id", surveyId);
    } else if (isShortCode(surveyId)) {
      query = query.ilike("short_code", surveyId);
    } else {
      query = query.or(`id.eq.${surveyId},short_code.ilike.${surveyId}`);
    }

    const { data: survey } = await query.single();

    if (!survey) {
      return new Response(JSON.stringify({ error: "Survey not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use actual UUID for database operations
    const actualSurveyId = survey.id;

    const questions = survey.questions as Question[];
    if (questions.length === 0) {
      return new Response(JSON.stringify({ error: "Survey has no questions" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize or use existing state
    let responseState: ResponseState = incomingState || {
      responseId: "",
      surveyId: actualSurveyId,
      currentQuestionIndex: 0,
      answers: {},
      isCompleted: false,
    };

    // Create response record if new
    if (!responseState.responseId) {
      const { data: newResponse } = await db
        .from("responses")
        .insert({
          survey_id: actualSurveyId,
          answers: {},
          status: "in_progress",
          current_question_index: 0,
        })
        .select()
        .single();

      if (newResponse) {
        responseState.responseId = newResponse.id;
      }
    }

    const currentQuestion = questions[responseState.currentQuestionIndex];
    const systemPrompt = buildResponderPrompt(
      survey as Survey,
      currentQuestion,
      responseState.currentQuestionIndex,
      questions.length,
      responseState.answers,
      questions
    );

    const result = streamText({
      model: geminiModel,
      system: systemPrompt,
      messages,
    });

    let fullResponse = "";
    const encoder = new TextEncoder();
    const actionBuffer = new StreamActionBuffer();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            fullResponse += chunk;
            // Buffer the chunk and get safe text to emit
            const { text: safeText } = actionBuffer.push(chunk);
            if (safeText) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: safeText })}\n\n`)
              );
            }
          }

          // Flush any remaining buffered content
          const { text: remaining } = actionBuffer.flush();
          if (remaining) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: remaining })}\n\n`)
            );
          }

          // Parse actions from complete response
          const actions = parseActions(fullResponse);
          const updatedState = { ...responseState };

          for (const action of actions) {
            switch (action.type) {
              case "save_answer": {
                const questionId = action.questionId;
                const value = action.value;
                updatedState.answers = { ...updatedState.answers, [questionId]: value };

                // Move to next question if not the last
                if (updatedState.currentQuestionIndex < questions.length - 1) {
                  updatedState.currentQuestionIndex++;
                }

                // Save progress to database
                await db
                  .from("responses")
                  .update({
                    answers: updatedState.answers,
                    current_question_index: updatedState.currentQuestionIndex,
                  })
                  .eq("id", updatedState.responseId);
                break;
              }
              case "go_back":
                if (updatedState.currentQuestionIndex > 0) {
                  updatedState.currentQuestionIndex--;
                  await db
                    .from("responses")
                    .update({
                      current_question_index: updatedState.currentQuestionIndex,
                    })
                    .eq("id", updatedState.responseId);
                }
                break;
              case "complete":
                updatedState.isCompleted = true;
                await db
                  .from("responses")
                  .update({
                    answers: updatedState.answers,
                    status: "completed",
                    completed_at: new Date().toISOString(),
                  })
                  .eq("id", updatedState.responseId);
                break;
            }
          }

          // Send final state update
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, responseState: updatedState })}\n\n`
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
    console.error("Responder chat error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

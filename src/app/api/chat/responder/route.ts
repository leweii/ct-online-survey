import { streamText } from "ai";
import { geminiModel, parseActions, removeActionTags } from "@/lib/ai";
import { supabase } from "@/lib/supabase";
import type { Question, Survey } from "@/types/database";


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
  previousAnswers: Record<string, unknown>
): string {
  let prompt = `You are a friendly survey assistant helping someone complete the survey "${survey.title}".

Current question (${questionIndex + 1} of ${totalQuestions}):
- Question: ${currentQuestion.text}
- Type: ${currentQuestion.type}
- Required: ${currentQuestion.required ? "Yes" : "No"}`;

  if (currentQuestion.type === "multiple_choice" && currentQuestion.options) {
    prompt += `\n- Options: ${currentQuestion.options.map((o, i) => `${i + 1}. ${o}`).join(", ")}`;
  }
  if (currentQuestion.type === "rating") {
    const min = currentQuestion.validation?.min ?? 1;
    const max = currentQuestion.validation?.max ?? 5;
    prompt += `\n- Scale: ${min} to ${max}`;
  }
  if (currentQuestion.type === "number" && currentQuestion.validation) {
    if (currentQuestion.validation.min !== undefined) {
      prompt += `\n- Minimum value: ${currentQuestion.validation.min}`;
    }
    if (currentQuestion.validation.max !== undefined) {
      prompt += `\n- Maximum value: ${currentQuestion.validation.max}`;
    }
  }

  prompt += `

Your responsibilities:
1. Present the current question conversationally
2. Validate the user's response based on the question type
3. If they ask for clarification, explain the question differently
4. If they want to go back, allow it
5. Be encouraging and friendly

IMPORTANT: When processing a valid answer or action, include an ACTION tag at the END of your message.

Action formats:
- Save answer: <ACTION>{"type": "save_answer", "questionId": "${currentQuestion.id}", "value": "the answer"}</ACTION>
- Go back: <ACTION>{"type": "go_back"}</ACTION>
- Complete survey (only when on last question and answer is valid): <ACTION>{"type": "complete"}</ACTION>

For multiple choice, save the actual option text, not the number.
For yes/no, save "yes" or "no".
For rating, save the number.
For date, save in YYYY-MM-DD format.

Previous answers in this session: ${Object.keys(previousAnswers).length} questions answered.
${questionIndex === totalQuestions - 1 ? "This is the LAST question. After a valid answer, complete the survey." : ""}`;

  return prompt;
}

export async function POST(request: Request) {
  try {
    const { messages, responseState: incomingState, surveyId } = await request.json();

    // Get survey
    const { data: survey } = await db
      .from("surveys")
      .select("*")
      .eq("id", surveyId)
      .single();

    if (!survey) {
      return new Response(JSON.stringify({ error: "Survey not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

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
      surveyId,
      currentQuestionIndex: 0,
      answers: {},
      isCompleted: false,
    };

    // Create response record if new
    if (!responseState.responseId) {
      const { data: newResponse } = await db
        .from("responses")
        .insert({
          survey_id: surveyId,
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
      responseState.answers
    );

    const result = streamText({
      model: geminiModel,
      system: systemPrompt,
      messages,
    });

    let fullResponse = "";
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            fullResponse += chunk;
            const cleanChunk = removeActionTags(chunk);
            if (cleanChunk) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: cleanChunk })}\n\n`)
              );
            }
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

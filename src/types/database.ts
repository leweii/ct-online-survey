export type QuestionType = "text" | "multiple_choice" | "rating" | "yes_no" | "date" | "number";

export interface QuestionValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: string[];
  validation?: QuestionValidation;
}

export interface SurveySettings {
  allowAnonymous?: boolean;
  showProgress?: boolean;
  language?: string; // Language code (e.g., "en", "zh", "es") - auto-detected from creator input
}

export type SurveyStatus = "draft" | "active" | "closed";
export type ResponseStatus = "in_progress" | "partial" | "completed";

export interface Survey {
  id: string;
  short_code: string;  // User-facing survey code (4-8 chars)
  creator_code: string;  // Legacy, kept for backward compatibility
  creator_name: string;  // Fun pet name for creator
  title: string;
  description: string | null;
  questions: Question[];
  settings: SurveySettings;
  status: SurveyStatus;
  created_at: string;
  updated_at: string;
}

export interface Response {
  id: string;
  survey_id: string;
  respondent_id: string | null;
  answers: Record<string, unknown>;
  status: ResponseStatus;
  started_at: string;
  completed_at: string | null;
  current_question_index: number;
}

export interface Database {
  public: {
    Tables: {
      surveys: {
        Row: Survey;
        Insert: Omit<Survey, "id" | "short_code" | "creator_name" | "created_at" | "updated_at"> & {
          id?: string;
          short_code?: string;
          creator_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Survey, "id">>;
      };
      responses: {
        Row: Response;
        Insert: Omit<Response, "id" | "started_at"> & {
          id?: string;
          started_at?: string;
        };
        Update: Partial<Omit<Response, "id">>;
      };
    };
  };
}

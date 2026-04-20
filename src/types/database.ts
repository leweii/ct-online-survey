export type QuestionType =
  | "text"
  | "multiple_choice"
  | "multi_select"
  | "dropdown"
  | "rating"
  | "slider"
  | "yes_no"
  | "date"
  | "number"
  | "email"
  | "phone";

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
  language?: string;
}

export type SurveyStatus = "draft" | "active" | "closed";
export type ResponseStatus = "in_progress" | "partial" | "completed";

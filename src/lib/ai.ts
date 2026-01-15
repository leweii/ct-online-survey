import { google } from "@ai-sdk/google";

export const geminiModel = google("gemini-2.0-flash");


export function parseActions(text: string): Array<Record<string, any>> {

  const actions: Array<Record<string, any>> = [];
  const actionRegex = /<ACTION>([\s\S]*?)<\/ACTION>/g;
  let match;

  while ((match = actionRegex.exec(text)) !== null) {
    try {
      const actionData = JSON.parse(match[1]);
      actions.push(actionData);
    } catch {
      console.error("Failed to parse action:", match[1]);
    }
  }

  return actions;
}

export function removeActionTags(text: string): string {
  return text.replace(/<ACTION>[\s\S]*?<\/ACTION>/g, "").trim();
}

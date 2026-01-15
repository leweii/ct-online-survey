import { google } from "@ai-sdk/google";

// Flash 模型 - 用于 Responder 和 Analytics（快速响应）
export const geminiFlash = google("gemini-2.0-flash");

// Pro 模型 - 用于 Creator 生成专业问卷（高质量输出）
export const geminiPro = google("gemini-2.5-pro");

// Legacy export for backward compatibility
export const geminiModel = geminiFlash;


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

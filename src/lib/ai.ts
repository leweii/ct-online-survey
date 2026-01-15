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

/**
 * Buffer for streaming text that may contain ACTION tags.
 * Holds back potential partial tags until we're sure they're complete or not tags.
 */
export class StreamActionBuffer {
  private buffer = "";

  /**
   * Add a chunk to the buffer and return safe text to emit.
   * Safe text is everything before any potential partial ACTION tag.
   */
  push(chunk: string): string {
    this.buffer += chunk;

    // Remove any complete ACTION tags first
    this.buffer = this.buffer.replace(/<ACTION>[\s\S]*?<\/ACTION>/g, "");

    // Find the last '<' that might be starting a tag
    const lastAngle = this.buffer.lastIndexOf("<");

    if (lastAngle === -1) {
      // No '<' found, safe to emit everything
      const result = this.buffer;
      this.buffer = "";
      return result;
    }

    // Check if the content after '<' could be a partial ACTION tag
    const potentialTag = this.buffer.slice(lastAngle);
    const actionStart = "<ACTION>";

    // If what we have so far matches the beginning of "<ACTION>", hold it back
    if (actionStart.startsWith(potentialTag) || potentialTag.startsWith("<ACTION>")) {
      // Hold back the potential partial tag
      const safe = this.buffer.slice(0, lastAngle);
      this.buffer = potentialTag;
      return safe;
    }

    // The '<' is not part of an ACTION tag, safe to emit everything
    const result = this.buffer;
    this.buffer = "";
    return result;
  }

  /**
   * Flush remaining buffer content (call at end of stream).
   */
  flush(): string {
    // Remove any remaining complete action tags and return
    const result = this.buffer.replace(/<ACTION>[\s\S]*?<\/ACTION>/g, "");
    this.buffer = "";
    return result;
  }
}

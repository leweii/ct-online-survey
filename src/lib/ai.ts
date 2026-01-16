import { google } from "@ai-sdk/google";

// Flash 模型 - 用于 Responder 和 Analytics（快速响应）
export const geminiFlash = google("gemini-2.0-flash");

// Pro 模型 - 用于 Creator 生成专业问卷（高质量输出）
export const geminiPro = google("gemini-2.5-pro");

// Legacy export for backward compatibility
export const geminiModel = geminiFlash;


const ACTION_REGEX = /<ACTION>([\s\S]*?)<\/ACTION>/g;

export function parseActions(text: string): Array<Record<string, any>> {
  const actions: Array<Record<string, any>> = [];
  let match;

  while ((match = ACTION_REGEX.exec(text)) !== null) {
    try {
      actions.push(JSON.parse(match[1]));
    } catch {
      console.error("Failed to parse action:", match[1]);
    }
  }

  return actions;
}

export function removeActionTags(text: string): string {
  return text.replace(/<ACTION>[\s\S]*?<\/ACTION>/g, "").trim();
}

export interface StreamBufferResult {
  text: string;
  actions: Array<Record<string, any>>;
}

const ACTION_TAG_START = "<ACTION>";

/**
 * Buffer for streaming text that may contain ACTION tags.
 * Holds back potential partial tags until we're sure they're complete or not tags.
 * Also extracts and returns complete actions for immediate processing.
 */
export class StreamActionBuffer {
  private buffer = "";

  /**
   * Add a chunk to the buffer and return safe text to emit plus any complete actions.
   * Safe text is everything before any potential partial ACTION tag.
   */
  push(chunk: string): StreamBufferResult {
    this.buffer += chunk;

    const actions = parseActions(this.buffer);
    this.buffer = removeActionTags(this.buffer);

    // Find the last '<' that might be starting a tag
    const lastAngle = this.buffer.lastIndexOf("<");

    if (lastAngle === -1) {
      const result = this.buffer;
      this.buffer = "";
      return { text: result, actions };
    }

    // Check if the content after '<' could be a partial ACTION tag
    const potentialTag = this.buffer.slice(lastAngle);

    // If what we have so far matches the beginning of "<ACTION>", hold it back
    if (ACTION_TAG_START.startsWith(potentialTag) || potentialTag.startsWith(ACTION_TAG_START)) {
      const safe = this.buffer.slice(0, lastAngle);
      this.buffer = potentialTag;
      return { text: safe, actions };
    }

    const result = this.buffer;
    this.buffer = "";
    return { text: result, actions };
  }

  /**
   * Flush remaining buffer content (call at end of stream).
   */
  flush(): StreamBufferResult {
    const actions = parseActions(this.buffer);
    const result = removeActionTags(this.buffer);
    this.buffer = "";
    return { text: result, actions };
  }
}

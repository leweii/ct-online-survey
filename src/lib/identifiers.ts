import { getSurveyByShortCode } from "@/lib/db/surveys";

const SHORT_CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function generateShortCode(length: number): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += SHORT_CODE_CHARS[Math.floor(Math.random() * SHORT_CODE_CHARS.length)];
  }
  return code;
}

export async function generateUniqueShortCode(): Promise<string> {
  const maxLength = 8;
  const maxRetries = 10;

  for (let length = 4; length <= maxLength; length++) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const code = generateShortCode(length);
      const existing = await getSurveyByShortCode(code);
      if (!existing) return code;
    }
  }
  throw new Error("Unable to generate unique short code");
}

export function isUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export function isShortCode(str: string): boolean {
  const shortCodeRegex = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4,8}$/i;
  return shortCodeRegex.test(str);
}

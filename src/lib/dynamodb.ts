import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

let client: DynamoDBDocumentClient | null = null;

export function getDocClient(): DynamoDBDocumentClient {
  if (client) return client;

  const raw = new DynamoDBClient({
    region: process.env.AWS_REGION || "ap-northeast-1",
    endpoint: process.env.DYNAMODB_ENDPOINT || undefined,
    ...(process.env.DYNAMODB_ENDPOINT
      ? {
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local",
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local",
          },
        }
      : {}),
  });

  client = DynamoDBDocumentClient.from(raw, {
    marshallOptions: { removeUndefinedValues: true },
  });
  return client;
}

export function tableName(suffix: "users" | "otp" | "surveys" | "responses"): string {
  const prefix = process.env.DYNAMODB_TABLE_PREFIX || "ct-survey";
  return `${prefix}-${suffix}`;
}

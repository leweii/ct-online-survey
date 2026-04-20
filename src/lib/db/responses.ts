import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { getDocClient, tableName } from "@/lib/dynamodb";
import type { ResponseStatus } from "@/types/database";

export interface ResponseRecord {
  responseId: string;
  surveyId: string;
  respondentId: string | null;
  answers: Record<string, unknown>;
  status: ResponseStatus;
  currentQuestionIndex: number;
  startedAt: string;
  completedAt?: string | null;
}

export type CreateResponseInput = Omit<ResponseRecord, "responseId" | "startedAt">;

export async function createResponse(input: CreateResponseInput): Promise<ResponseRecord> {
  const rec: ResponseRecord = {
    ...input,
    responseId: randomUUID(),
    startedAt: new Date().toISOString(),
  };
  await getDocClient().send(
    new PutCommand({ TableName: tableName("responses"), Item: rec })
  );
  return rec;
}

export async function getResponseById(responseId: string): Promise<ResponseRecord | null> {
  const res = await getDocClient().send(
    new GetCommand({ TableName: tableName("responses"), Key: { responseId } })
  );
  return (res.Item as ResponseRecord) ?? null;
}

export async function listResponsesBySurveyId(surveyId: string): Promise<ResponseRecord[]> {
  const res = await getDocClient().send(
    new QueryCommand({
      TableName: tableName("responses"),
      IndexName: "surveyId-index",
      KeyConditionExpression: "surveyId = :s",
      ExpressionAttributeValues: { ":s": surveyId },
    })
  );
  return (res.Items ?? []) as ResponseRecord[];
}

const UPDATABLE: (keyof ResponseRecord)[] = [
  "answers",
  "status",
  "currentQuestionIndex",
  "completedAt",
];

export async function updateResponse(
  responseId: string,
  patch: Partial<ResponseRecord>
): Promise<ResponseRecord | null> {
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  const sets: string[] = [];

  for (const key of UPDATABLE) {
    if (patch[key] === undefined) continue;
    names[`#${key}`] = key;
    values[`:${key}`] = patch[key];
    sets.push(`#${key} = :${key}`);
  }
  if (sets.length === 0) return getResponseById(responseId);

  const res = await getDocClient().send(
    new UpdateCommand({
      TableName: tableName("responses"),
      Key: { responseId },
      UpdateExpression: `SET ${sets.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    })
  );
  return (res.Attributes as ResponseRecord) ?? null;
}

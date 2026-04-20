import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { getDocClient, tableName } from "@/lib/dynamodb";
import type { Question, SurveySettings, SurveyStatus } from "@/types/database";

export interface SurveyRecord {
  surveyId: string;
  userId: string;
  shortCode: string;
  title: string;
  description: string | null;
  questions: Question[];
  settings: SurveySettings;
  status: SurveyStatus;
  createdAt: string;
  updatedAt: string;
}

export type CreateSurveyInput = Omit<SurveyRecord, "surveyId" | "createdAt" | "updatedAt">;

export async function createSurvey(input: CreateSurveyInput): Promise<SurveyRecord> {
  const now = new Date().toISOString();
  const rec: SurveyRecord = {
    ...input,
    surveyId: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  await getDocClient().send(
    new PutCommand({ TableName: tableName("surveys"), Item: rec })
  );
  return rec;
}

export async function getSurveyById(surveyId: string): Promise<SurveyRecord | null> {
  const res = await getDocClient().send(
    new GetCommand({ TableName: tableName("surveys"), Key: { surveyId } })
  );
  return (res.Item as SurveyRecord) ?? null;
}

export async function getSurveyByShortCode(shortCode: string): Promise<SurveyRecord | null> {
  const res = await getDocClient().send(
    new QueryCommand({
      TableName: tableName("surveys"),
      IndexName: "shortCode-index",
      KeyConditionExpression: "shortCode = :c",
      ExpressionAttributeValues: { ":c": shortCode.toUpperCase() },
      Limit: 1,
    })
  );
  return (res.Items?.[0] as SurveyRecord) ?? null;
}

export async function listSurveysByUserId(userId: string): Promise<SurveyRecord[]> {
  const res = await getDocClient().send(
    new QueryCommand({
      TableName: tableName("surveys"),
      IndexName: "userId-index",
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": userId },
    })
  );
  return (res.Items ?? []) as SurveyRecord[];
}

const UPDATABLE: (keyof SurveyRecord)[] = [
  "title",
  "description",
  "questions",
  "settings",
  "status",
];

export async function updateSurvey(
  surveyId: string,
  patch: Partial<SurveyRecord>
): Promise<SurveyRecord | null> {
  const names: Record<string, string> = { "#updatedAt": "updatedAt" };
  const values: Record<string, unknown> = { ":updatedAt": new Date().toISOString() };
  const sets: string[] = ["#updatedAt = :updatedAt"];

  for (const key of UPDATABLE) {
    if (patch[key] === undefined) continue;
    names[`#${key}`] = key;
    values[`:${key}`] = patch[key];
    sets.push(`#${key} = :${key}`);
  }

  const res = await getDocClient().send(
    new UpdateCommand({
      TableName: tableName("surveys"),
      Key: { surveyId },
      UpdateExpression: `SET ${sets.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    })
  );
  return (res.Attributes as SurveyRecord) ?? null;
}

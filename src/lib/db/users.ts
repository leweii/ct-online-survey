import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { getDocClient, tableName } from "@/lib/dynamodb";

export interface UserRecord {
  userId: string;
  email: string;
  createdAt: string;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const res = await getDocClient().send(
    new QueryCommand({
      TableName: tableName("users"),
      IndexName: "email-index",
      KeyConditionExpression: "email = :e",
      ExpressionAttributeValues: { ":e": email },
      Limit: 1,
    })
  );
  const item = res.Items?.[0];
  return item ? (item as UserRecord) : null;
}

export async function getUserById(userId: string): Promise<UserRecord | null> {
  const res = await getDocClient().send(
    new GetCommand({
      TableName: tableName("users"),
      Key: { userId },
    })
  );
  return (res.Item as UserRecord) ?? null;
}

export async function createUser(email: string): Promise<UserRecord> {
  const user: UserRecord = {
    userId: randomUUID(),
    email,
    createdAt: new Date().toISOString(),
  };
  await getDocClient().send(
    new PutCommand({ TableName: tableName("users"), Item: user })
  );
  return user;
}

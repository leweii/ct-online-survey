import { GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { getDocClient, tableName } from "@/lib/dynamodb";

export interface OtpRecord {
  email: string;
  otpHash: string;
  magicTokenHash: string;
  expiresAt: number;
}

export async function putOtp(rec: OtpRecord): Promise<void> {
  await getDocClient().send(
    new PutCommand({ TableName: tableName("otp"), Item: rec })
  );
}

export async function getOtp(email: string): Promise<OtpRecord | null> {
  const res = await getDocClient().send(
    new GetCommand({ TableName: tableName("otp"), Key: { email } })
  );
  return (res.Item as OtpRecord) ?? null;
}

export async function deleteOtp(email: string): Promise<void> {
  await getDocClient().send(
    new DeleteCommand({ TableName: tableName("otp"), Key: { email } })
  );
}

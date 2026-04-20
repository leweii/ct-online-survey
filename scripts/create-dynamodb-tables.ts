import {
  DynamoDBClient,
  CreateTableCommand,
  UpdateTimeToLiveCommand,
  DescribeTableCommand,
  ResourceInUseException,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-northeast-1",
  endpoint: process.env.DYNAMODB_ENDPOINT || undefined,
});

const PREFIX = process.env.DYNAMODB_TABLE_PREFIX || "ct-survey";

const tables = [
  {
    TableName: `${PREFIX}-users`,
    BillingMode: "PAY_PER_REQUEST" as const,
    AttributeDefinitions: [
      { AttributeName: "userId", AttributeType: "S" as const },
      { AttributeName: "email", AttributeType: "S" as const },
    ],
    KeySchema: [{ AttributeName: "userId", KeyType: "HASH" as const }],
    GlobalSecondaryIndexes: [
      {
        IndexName: "email-index",
        KeySchema: [{ AttributeName: "email", KeyType: "HASH" as const }],
        Projection: { ProjectionType: "ALL" as const },
      },
    ],
  },
  {
    TableName: `${PREFIX}-otp`,
    BillingMode: "PAY_PER_REQUEST" as const,
    AttributeDefinitions: [{ AttributeName: "email", AttributeType: "S" as const }],
    KeySchema: [{ AttributeName: "email", KeyType: "HASH" as const }],
  },
  {
    TableName: `${PREFIX}-surveys`,
    BillingMode: "PAY_PER_REQUEST" as const,
    AttributeDefinitions: [
      { AttributeName: "surveyId", AttributeType: "S" as const },
      { AttributeName: "userId", AttributeType: "S" as const },
      { AttributeName: "shortCode", AttributeType: "S" as const },
    ],
    KeySchema: [{ AttributeName: "surveyId", KeyType: "HASH" as const }],
    GlobalSecondaryIndexes: [
      {
        IndexName: "userId-index",
        KeySchema: [{ AttributeName: "userId", KeyType: "HASH" as const }],
        Projection: { ProjectionType: "ALL" as const },
      },
      {
        IndexName: "shortCode-index",
        KeySchema: [{ AttributeName: "shortCode", KeyType: "HASH" as const }],
        Projection: { ProjectionType: "ALL" as const },
      },
    ],
  },
  {
    TableName: `${PREFIX}-responses`,
    BillingMode: "PAY_PER_REQUEST" as const,
    AttributeDefinitions: [
      { AttributeName: "responseId", AttributeType: "S" as const },
      { AttributeName: "surveyId", AttributeType: "S" as const },
    ],
    KeySchema: [{ AttributeName: "responseId", KeyType: "HASH" as const }],
    GlobalSecondaryIndexes: [
      {
        IndexName: "surveyId-index",
        KeySchema: [{ AttributeName: "surveyId", KeyType: "HASH" as const }],
        Projection: { ProjectionType: "ALL" as const },
      },
    ],
  },
];

async function tableExists(name: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: name }));
    return true;
  } catch (err: any) {
    if (err.name === "ResourceNotFoundException") return false;
    throw err;
  }
}

async function main() {
  for (const t of tables) {
    if (await tableExists(t.TableName)) {
      console.log(`✓ ${t.TableName} already exists`);
      continue;
    }
    try {
      await client.send(new CreateTableCommand(t));
      console.log(`✓ created ${t.TableName}`);
    } catch (err) {
      if (err instanceof ResourceInUseException) {
        console.log(`✓ ${t.TableName} already exists`);
        continue;
      }
      throw err;
    }
  }

  // Enable TTL on otp table
  const otpTable = `${PREFIX}-otp`;
  try {
    await client.send(
      new UpdateTimeToLiveCommand({
        TableName: otpTable,
        TimeToLiveSpecification: { Enabled: true, AttributeName: "expiresAt" },
      })
    );
    console.log(`✓ TTL enabled on ${otpTable}`);
  } catch (err: any) {
    if (err.message?.includes("TimeToLive is already enabled")) {
      console.log(`✓ TTL already enabled on ${otpTable}`);
    } else {
      throw err;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

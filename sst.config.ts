/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "ct-online-survey",
      removal: input?.stage === "prod" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: { region: "ap-northeast-1" },
      },
    };
  },
  async run() {
    const stage = $app.stage;
    const isProd = stage === "prod";
    const tablePrefix = isProd ? "ct-survey" : `ct-survey-${stage}`;

    const usersTable = new sst.aws.Dynamo("UsersTable", {
      fields: { userId: "string", email: "string" },
      primaryIndex: { hashKey: "userId" },
      globalIndexes: {
        "email-index": { hashKey: "email" },
      },
      transform: {
        table: { name: `${tablePrefix}-users` },
      },
    });

    const otpTable = new sst.aws.Dynamo("OtpTable", {
      fields: { email: "string" },
      primaryIndex: { hashKey: "email" },
      ttl: "expiresAt",
      transform: {
        table: { name: `${tablePrefix}-otp` },
      },
    });

    const surveysTable = new sst.aws.Dynamo("SurveysTable", {
      fields: {
        surveyId: "string",
        userId: "string",
        shortCode: "string",
      },
      primaryIndex: { hashKey: "surveyId" },
      globalIndexes: {
        "userId-index": { hashKey: "userId" },
        "shortCode-index": { hashKey: "shortCode" },
      },
      transform: {
        table: { name: `${tablePrefix}-surveys` },
      },
    });

    const responsesTable = new sst.aws.Dynamo("ResponsesTable", {
      fields: { responseId: "string", surveyId: "string" },
      primaryIndex: { hashKey: "responseId" },
      globalIndexes: {
        "surveyId-index": { hashKey: "surveyId" },
      },
      transform: {
        table: { name: `${tablePrefix}-responses` },
      },
    });

    const geminiApiKey = new sst.Secret("GeminiApiKey");
    const jwtSecret = new sst.Secret("JwtSecret");
    const turnstileSecret = new sst.Secret("TurnstileSecret");
    const turnstileSiteKey = new sst.Secret("TurnstileSiteKey");
    const sesFromEmail = new sst.Secret("SesFromEmail");

    const site = new sst.aws.Nextjs("Web", {
      link: [usersTable, otpTable, surveysTable, responsesTable],
      domain: isProd
        ? {
            name: "survey.zhiyu-online.com",
            dns: sst.aws.dns(),
          }
        : undefined,
      server: {
        // Lambda max execution time. Streaming responses are unaffected by
        // CloudFront origin readTimeout (60s) once first byte is flushed.
        timeout: "60 seconds",
        memory: "1024 MB",
      },
      environment: {
        DYNAMODB_TABLE_PREFIX: tablePrefix,
        GOOGLE_GENERATIVE_AI_API_KEY: geminiApiKey.value,
        JWT_SECRET: jwtSecret.value,
        TURNSTILE_SECRET_KEY: turnstileSecret.value,
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: turnstileSiteKey.value,
        AWS_SES_FROM_EMAIL: sesFromEmail.value,
        AWS_SES_REGION: "ap-southeast-1",
      },
      permissions: [
        {
          actions: ["ses:SendEmail", "ses:SendRawEmail"],
          resources: ["*"],
        },
      ],
    });

    return {
      url: site.url,
    };
  },
});

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

let client: SESClient | null = null;

function getClient(): SESClient {
  if (client) return client;
  client = new SESClient({
    region: process.env.AWS_REGION || "ap-northeast-1",
  });
  return client;
}

function buildHtmlBody(code: string): string {
  return `
<!doctype html>
<html>
  <body style="font-family: -apple-system, Segoe UI, sans-serif; padding: 32px; background: #f7f7f7;">
    <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px;">
      <h1 style="margin: 0 0 8px; font-size: 22px;">畅谈问卷</h1>
      <p style="margin: 0 0 24px; color: #666;">我和AI共创一切</p>
      <p>你的登录验证码是：</p>
      <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 16px; background: #f0f0f0; border-radius: 8px; text-align: center; margin: 16px 0;">${code}</div>
      <p style="color: #666; font-size: 14px;">验证码 10 分钟内有效，请勿转发给他人。</p>
    </div>
  </body>
</html>`;
}

export async function sendOtpEmail(toEmail: string, code: string): Promise<void> {
  const from = process.env.AWS_SES_FROM_EMAIL;
  if (!from) throw new Error("AWS_SES_FROM_EMAIL not set");

  await getClient().send(
    new SendEmailCommand({
      Source: from,
      Destination: { ToAddresses: [toEmail] },
      Message: {
        Subject: { Data: "畅谈问卷 登录验证码", Charset: "UTF-8" },
        Body: {
          Html: { Data: buildHtmlBody(code), Charset: "UTF-8" },
          Text: { Data: `你的登录验证码是 ${code}，10 分钟内有效。`, Charset: "UTF-8" },
        },
      },
    })
  );
}

import nodemailer from "nodemailer";
import { EmailSender } from "../sender";

async function testWithEthereal() {
  // Create fake SMTP credentials
  const testAccount = await nodemailer.createTestAccount();

  console.log("Test account created:", {
    user: testAccount.user,
    pass: testAccount.pass,
  });

  const emailSender = new EmailSender({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
    from: "test@example.com",
  });

  // Load a test template
  emailSender.loadTemplate(
    "test",
    `
    <h1>Hello {{name}}!</h1>
    <p>This is a test email sent on {{formatDate date}}.</p>
    <p>You have {{messageCount}} messages.</p>
    {{#if isPremium}}
      <p style="color: gold;">⭐ Premium User ⭐</p>
    {{/if}}
  `,
  );

  // Test single email
  console.log("Testing single email...");
  const singleResult = await emailSender.send({
    to: "recipient@test.com",
    subject: "Test Email",
    template: "test",
    data: {
      name: "John Doe",
      date: new Date(),
      messageCount: 5,
      isPremium: true,
    },
  });

  console.log("Single email result:", singleResult);

  // Show ethereal email login info
  console.log("To view sent emails:");
  console.log("Go to: https://ethereal.email/login");
  console.log("Login with:");
  console.log("Email:", testAccount.user);
  console.log("Password:", testAccount.pass);

  // Test bulk emails
  console.log("\n📧 Testing bulk emails...");
  const bulkEmails = [
    {
      to: "user1@test.com",
      subject: "Bulk Test 1",
      template: "test",
      data: {
        name: "User 1",
        date: new Date(),
        messageCount: 3,
        isPremium: false,
      },
    },
    {
      to: "user2@test.com",
      subject: "Bulk Test 2",
      template: "test",
      data: {
        name: "User 2",
        date: new Date(),
        messageCount: 8,
        isPremium: true,
      },
    },
    {
      to: "user3@test.com",
      subject: "Bulk Test 3",
      html: "<h1>Direct HTML Email</h1><p>No template used here.</p>",
    },
  ];

  const bulkResult = await emailSender.sendBulk(bulkEmails);
  console.log("Bulk email result:", {
    total: bulkResult.total,
    successful: bulkResult.successful,
    failed: bulkResult.failed,
  });

  console.log("\n✅ All emails sent! Check them at the Ethereal login above.");

  emailSender.close();
}

testWithEthereal().catch(console.error);

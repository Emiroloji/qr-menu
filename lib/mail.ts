import "server-only";
import nodemailer from "nodemailer";

const port = Number(process.env.SMTP_PORT ?? 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465,
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
    : undefined,
});

export async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
}) {
  await transporter.sendMail({ from: process.env.SMTP_FROM, ...input });
}

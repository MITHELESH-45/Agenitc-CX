const nodemailer = require("nodemailer");

function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("Missing EMAIL_USER or EMAIL_PASS env vars");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass }
  });
}

/**
 * Send an email via Gmail SMTP.
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 */
async function sendEmail(to, subject, text) {
  const user = process.env.EMAIL_USER;
  const transporter = getTransporter();

  const safeSubject = typeof subject === "string" && subject.trim().length ? subject.trim() : "Re:";
  const safeText = typeof text === "string" && text.trim().length ? text.trim() : "";

  return await transporter.sendMail({
    from: user,
    to,
    subject: safeSubject,
    text: safeText
  });
}

module.exports = { sendEmail };


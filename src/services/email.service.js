const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify SMTP connection
const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log("Email server is ready");
  } catch (error) {
    console.error("Email server connection failed:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
    });
  }
};

verifyEmailConnection();

const sendPasswordResetEmail = async ({
  to,
  firstName,
  resetUrl,
}) => {
  return transporter.sendMail({
    from: `"Paw Match" <${process.env.EMAIL_FROM}>`,
    to,
    subject: "Reset Your Paw Match Password",

    text: `
Hello ${firstName || "User"},

We received a request to reset the password for your Paw Match account.

Reset your password using the following link:

${resetUrl}

This link will expire in 15 minutes.

If you didn't request a password reset, you can safely ignore this email.

The Paw Match Team
    `.trim(),

    html: `
<!DOCTYPE html>
<html lang="en">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Password Reset</title>
</head>

<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 20px;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="
background:#ffffff;
border-radius:18px;
overflow:hidden;
box-shadow:0 10px 35px rgba(0,0,0,.08);
">

<tr>
<td align="center" style="background:#2563eb;padding:40px;">

<div style="
width:80px;
height:80px;
background:#ffffff;
border-radius:50%;
display:flex;
align-items:center;
justify-content:center;
margin:auto;
font-size:38px;
">
🐾
</div>

<h1 style="
margin:20px 0 0;
color:#ffffff;
font-size:32px;
font-weight:bold;
">
Paw Match
</h1>

<p style="
margin-top:10px;
font-size:16px;
color:#dbeafe;
">
Password Reset Request
</p>

</td>
</tr>

<tr>
<td style="padding:45px;">

<h2 style="
margin-top:0;
color:#1f2937;
font-size:26px;
">
Hello ${firstName || "User"},
</h2>

<p style="
font-size:16px;
line-height:1.8;
color:#4b5563;
">
We received a request to reset the password for your
<strong>Paw Match</strong> account.
</p>

<p style="
font-size:16px;
line-height:1.8;
color:#4b5563;
">
Click the button below to create a new password.
For your security, this link will expire in
<strong>15 minutes</strong>.
</p>

<div style="text-align:center;margin:45px 0;">

<a
href="${resetUrl}"
style="
background:#2563eb;
color:#ffffff;
text-decoration:none;
padding:16px 40px;
border-radius:10px;
font-size:17px;
font-weight:bold;
display:inline-block;
">
Reset Password
</a>

</div>

<p style="
font-size:15px;
color:#6b7280;
margin-bottom:10px;
">
If the button doesn't work, copy and paste the following link into your browser:
</p>

<div style="
background:#f3f4f6;
border:1px solid #e5e7eb;
padding:16px;
border-radius:8px;
word-break:break-all;
font-size:14px;
color:#2563eb;
line-height:1.6;
">
${resetUrl}
</div>

<hr style="
margin:40px 0;
border:none;
border-top:1px solid #e5e7eb;
">

<p style="
font-size:15px;
line-height:1.8;
color:#6b7280;
">
If you didn't request this password reset, you can safely ignore this email.
Your password will remain unchanged.
</p>

</td>
</tr>

<tr>
<td style="
background:#f9fafb;
padding:30px;
text-align:center;
">

<p style="
margin:0;
font-size:15px;
font-weight:bold;
color:#374151;
">
Paw Match
</p>

<p style="
margin:10px 0;
font-size:14px;
color:#9ca3af;
">
Helping pets find their forever homes ❤️
</p>

<p style="
margin-top:20px;
font-size:12px;
color:#9ca3af;
line-height:1.7;
">
This email was sent automatically.
Please do not reply to this message.
</p>

<p style="
margin-top:15px;
font-size:12px;
color:#9ca3af;
">
© ${new Date().getFullYear()} Paw Match. All rights reserved.
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
    `,
  });
};

const sendSignupVerificationEmail = async ({
  to,
  firstName,
  verificationCode,
}) => {
  return transporter.sendMail({
    from: `"Paw Match" <${process.env.EMAIL_FROM}>`,
    to,
    subject: "Verify Your Paw Match Account",

    text: `
Hello ${firstName || "User"},

Thank you for registering with Paw Match.

Use the following verification code to complete your registration:

${verificationCode}

This code will expire in 10 minutes.

Do not share this code with anyone.

If you didn't create a Paw Match account, you can safely ignore this email.

The Paw Match Team
    `.trim(),

    html: `
<!DOCTYPE html>
<html lang="en">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Email Verification</title>
</head>

<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 20px;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="
background:#ffffff;
border-radius:18px;
overflow:hidden;
box-shadow:0 10px 35px rgba(0,0,0,.08);
">

<!-- Header -->
<tr>
<td align="center" style="background:#2563eb;padding:40px;">

<div style="
width:80px;
height:80px;
background:#ffffff;
border-radius:50%;
display:flex;
align-items:center;
justify-content:center;
margin:auto;
font-size:38px;
">
🐾
</div>

<h1 style="
margin:20px 0 0;
color:#ffffff;
font-size:32px;
font-weight:bold;
">
Paw Match
</h1>

<p style="
margin-top:10px;
font-size:16px;
color:#dbeafe;
">
Email Verification
</p>

</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:45px;">

<h2 style="
margin-top:0;
color:#1f2937;
font-size:26px;
">
Hello ${firstName || "User"},
</h2>

<p style="
font-size:16px;
line-height:1.8;
color:#4b5563;
">
Thank you for creating an account with
<strong>Paw Match</strong>.
</p>

<p style="
font-size:16px;
line-height:1.8;
color:#4b5563;
">
Enter the verification code below to complete your registration:
</p>

<div style="
text-align:center;
margin:40px 0;
">

<div style="
display:inline-block;
background:#eff6ff;
border:2px dashed #2563eb;
border-radius:14px;
padding:20px 35px;
font-size:36px;
font-weight:bold;
letter-spacing:12px;
color:#2563eb;
">
${verificationCode}
</div>

</div>

<p style="
font-size:16px;
line-height:1.8;
color:#4b5563;
text-align:center;
">
This verification code will expire in
<strong>10 minutes</strong>.
</p>

<div style="
background:#fff7ed;
border:1px solid #fed7aa;
border-radius:10px;
padding:16px;
margin-top:30px;
">

<p style="
margin:0;
font-size:14px;
line-height:1.7;
color:#9a3412;
">
<strong>Security notice:</strong>
Never share this verification code with anyone.
Paw Match will never ask you for this code by phone or message.
</p>

</div>

<hr style="
margin:40px 0;
border:none;
border-top:1px solid #e5e7eb;
">

<p style="
font-size:15px;
line-height:1.8;
color:#6b7280;
">
If you didn't create a Paw Match account, you can safely ignore this email.
No account will be created without entering the verification code.
</p>

</td>
</tr>

<!-- Footer -->
<tr>
<td style="
background:#f9fafb;
padding:30px;
text-align:center;
">

<p style="
margin:0;
font-size:15px;
font-weight:bold;
color:#374151;
">
Paw Match
</p>

<p style="
margin:10px 0;
font-size:14px;
color:#9ca3af;
">
Helping pets find their forever homes ❤️
</p>

<p style="
margin-top:20px;
font-size:12px;
color:#9ca3af;
line-height:1.7;
">
This email was sent automatically.
Please do not reply to this message.
</p>

<p style="
margin-top:15px;
font-size:12px;
color:#9ca3af;
">
© ${new Date().getFullYear()} Paw Match. All rights reserved.
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
    `,
  });
};

module.exports = {
  sendPasswordResetEmail,
  sendSignupVerificationEmail,
};
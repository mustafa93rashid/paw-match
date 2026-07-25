const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },

  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
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

/**
 * transporter.sendMail() can resolve successfully even when the destination
 * mail server rejects the recipient after accepting the SMTP session — it
 * only rejects the promise on a hard connection/auth failure. Callers that
 * need to know the message was actually accepted (e.g. password reset,
 * where a silent failure would look identical to success) should send
 * through this wrapper instead of calling transporter.sendMail directly.
 */
const sendMailVerifyingAcceptance = async (mailOptions) => {
  let info;

  try {
    info = await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send email:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
    });
    throw error;
  }

  if (info.accepted?.length === 0 || info.rejected?.length > 0) {
    console.error("Email was not accepted by the recipient's mail server:", {
      rejected: info.rejected,
      response: info.response,
    });
    throw new Error("Email was not accepted by the recipient's mail server");
  }

  return info;
};

const sendPasswordResetEmail = async ({
  to,
  firstName,
  resetUrl,
}) => {
  return sendMailVerifyingAcceptance({
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

const sendEmailUpdateVerificationEmail = async ({
  to,
  firstName,
  verificationCode,
}) => {
  return transporter.sendMail({
    from: `"Paw Match" <${process.env.EMAIL_FROM}>`,
    to,
    subject: "Verify Your New Paw Match Email Address",

    text: `
Hello ${firstName || "User"},

We received a request to update the email address associated with your Paw Match account.

Use the following verification code to confirm your new email address:

${verificationCode}

This code will expire in 10 minutes.

Do not share this code with anyone.

If you didn't request this email update, you can safely ignore this email.
Your current email address will remain unchanged.

The Paw Match Team
    `.trim(),

    html: `
<!DOCTYPE html>
<html lang="en">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Email Update Verification</title>
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
Email Update Verification
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
We received a request to update the email address associated
with your <strong>Paw Match</strong> account.
</p>

<p style="
font-size:16px;
line-height:1.8;
color:#4b5563;
">
Enter the verification code below to confirm your new email address:
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
If you didn't request this email update, you can safely ignore this email.
Your current email address will remain unchanged unless the verification
code is entered successfully.
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

const sendApplicationVerificationEmail = async ({
  to,
  firstName,
  verificationCode,
}) => {
  return transporter.sendMail({
    from: `"Paw Match" <${process.env.EMAIL_FROM}>`,
    to,
    subject: "Verify Your Paw Match Application",

    text: `
Hello ${firstName || "there"},

Thank you for applying to join Paw Match.

Use the following verification code to confirm your email address:

${verificationCode}

This code will expire in 10 minutes.

Do not share this code with anyone.

Once verified, your application will be sent to our team for review.

If you didn't submit this application, you can safely ignore this email.

The Paw Match Team
    `.trim(),

    html: `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Application Verification</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 35px rgba(0,0,0,.08);">
<tr><td align="center" style="background:#2563eb;padding:40px;">
<div style="width:80px;height:80px;background:#ffffff;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:auto;font-size:38px;">🐾</div>
<h1 style="margin:20px 0 0;color:#ffffff;font-size:32px;font-weight:bold;">Paw Match</h1>
<p style="margin-top:10px;font-size:16px;color:#dbeafe;">Application Verification</p>
</td></tr>
<tr><td style="padding:45px;">
<h2 style="margin-top:0;color:#1f2937;font-size:26px;">Hello ${firstName || "there"},</h2>
<p style="font-size:16px;line-height:1.8;color:#4b5563;">Thank you for applying to join <strong>Paw Match</strong>.</p>
<p style="font-size:16px;line-height:1.8;color:#4b5563;">Enter the verification code below to confirm your email address:</p>
<div style="text-align:center;margin:40px 0;">
<div style="display:inline-block;background:#eff6ff;border:2px dashed #2563eb;border-radius:14px;padding:20px 35px;font-size:36px;font-weight:bold;letter-spacing:12px;color:#2563eb;">${verificationCode}</div>
</div>
<p style="font-size:16px;line-height:1.8;color:#4b5563;text-align:center;">This verification code will expire in <strong>10 minutes</strong>.</p>
<p style="font-size:15px;line-height:1.8;color:#6b7280;">Once verified, your application will be sent to our team for review. You'll be notified by email once a decision has been made.</p>
<hr style="margin:40px 0;border:none;border-top:1px solid #e5e7eb;">
<p style="font-size:15px;line-height:1.8;color:#6b7280;">If you didn't submit this application, you can safely ignore this email.</p>
</td></tr>
<tr><td style="background:#f9fafb;padding:30px;text-align:center;">
<p style="margin:0;font-size:15px;font-weight:bold;color:#374151;">Paw Match</p>
<p style="margin:10px 0;font-size:14px;color:#9ca3af;">Helping pets find their forever homes ❤️</p>
<p style="margin-top:20px;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Paw Match. All rights reserved.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
    `,
  });
};

const sendAccountActivationEmail = async ({
  to,
  firstName,
  activationUrl,
}) => {
  return sendMailVerifyingAcceptance({
    from: `"Paw Match" <${process.env.EMAIL_FROM}>`,
    to,
    subject: "Your Paw Match Application Was Approved — Activate Your Account",

    text: `
Hello ${firstName || "there"},

Great news — your Paw Match application has been approved!

Activate your account and set your password using the following link:

${activationUrl}

This link will expire in 24 hours.

Once activated, you can sign in to the Paw Match Dashboard.

If you didn't apply to Paw Match, please ignore this email.

The Paw Match Team
    `.trim(),

    html: `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Account Approved</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 35px rgba(0,0,0,.08);">
<tr><td align="center" style="background:#16a34a;padding:40px;">
<div style="width:80px;height:80px;background:#ffffff;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:auto;font-size:38px;">🎉</div>
<h1 style="margin:20px 0 0;color:#ffffff;font-size:32px;font-weight:bold;">Paw Match</h1>
<p style="margin-top:10px;font-size:16px;color:#dcfce7;">Application Approved</p>
</td></tr>
<tr><td style="padding:45px;">
<h2 style="margin-top:0;color:#1f2937;font-size:26px;">Hello ${firstName || "there"},</h2>
<p style="font-size:16px;line-height:1.8;color:#4b5563;">Great news — your <strong>Paw Match</strong> application has been approved.</p>
<p style="font-size:16px;line-height:1.8;color:#4b5563;">Click the button below to activate your account and set your own password. For your security, this link will expire in <strong>24 hours</strong>.</p>
<div style="text-align:center;margin:45px 0;">
<a href="${activationUrl}" style="background:#16a34a;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:17px;font-weight:bold;display:inline-block;">Activate Account</a>
</div>
<p style="font-size:15px;color:#6b7280;margin-bottom:10px;">If the button doesn't work, copy and paste the following link into your browser:</p>
<div style="background:#f3f4f6;border:1px solid #e5e7eb;padding:16px;border-radius:8px;word-break:break-all;font-size:14px;color:#16a34a;line-height:1.6;">${activationUrl}</div>
<hr style="margin:40px 0;border:none;border-top:1px solid #e5e7eb;">
<p style="font-size:15px;line-height:1.8;color:#6b7280;">Once activated, you'll be able to sign in to the Paw Match Dashboard.</p>
</td></tr>
<tr><td style="background:#f9fafb;padding:30px;text-align:center;">
<p style="margin:0;font-size:15px;font-weight:bold;color:#374151;">Paw Match</p>
<p style="margin:10px 0;font-size:14px;color:#9ca3af;">Helping pets find their forever homes ❤️</p>
<p style="margin-top:20px;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Paw Match. All rights reserved.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
    `,
  });
};

const sendApplicationRejectedEmail = async ({
  to,
  firstName,
  reason,
}) => {
  return sendMailVerifyingAcceptance({
    from: `"Paw Match" <${process.env.EMAIL_FROM}>`,
    to,
    subject: "Update on Your Paw Match Application",

    text: `
Hello ${firstName || "there"},

Thank you for your interest in joining Paw Match.

After careful review, we're unable to approve your application at this time.

Reason: ${reason}

If you believe this was a mistake or would like to provide more information, please contact our team.

The Paw Match Team
    `.trim(),

    html: `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Application Update</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 35px rgba(0,0,0,.08);">
<tr><td align="center" style="background:#475569;padding:40px;">
<div style="width:80px;height:80px;background:#ffffff;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:auto;font-size:38px;">🐾</div>
<h1 style="margin:20px 0 0;color:#ffffff;font-size:32px;font-weight:bold;">Paw Match</h1>
<p style="margin-top:10px;font-size:16px;color:#e2e8f0;">Application Update</p>
</td></tr>
<tr><td style="padding:45px;">
<h2 style="margin-top:0;color:#1f2937;font-size:26px;">Hello ${firstName || "there"},</h2>
<p style="font-size:16px;line-height:1.8;color:#4b5563;">Thank you for your interest in joining <strong>Paw Match</strong>.</p>
<p style="font-size:16px;line-height:1.8;color:#4b5563;">After careful review, we're unable to approve your application at this time.</p>
<div style="background:#f3f4f6;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:30px 0;">
<p style="margin:0;font-size:14px;font-weight:bold;color:#374151;">Reason provided:</p>
<p style="margin-top:8px;font-size:15px;line-height:1.7;color:#4b5563;">${reason}</p>
</div>
<hr style="margin:40px 0;border:none;border-top:1px solid #e5e7eb;">
<p style="font-size:15px;line-height:1.8;color:#6b7280;">If you believe this was a mistake or would like to provide more information, please contact our team.</p>
</td></tr>
<tr><td style="background:#f9fafb;padding:30px;text-align:center;">
<p style="margin:0;font-size:15px;font-weight:bold;color:#374151;">Paw Match</p>
<p style="margin:10px 0;font-size:14px;color:#9ca3af;">Helping pets find their forever homes ❤️</p>
<p style="margin-top:20px;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Paw Match. All rights reserved.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
    `,
  });
};

module.exports = {
  sendPasswordResetEmail,
  sendSignupVerificationEmail,
  sendEmailUpdateVerificationEmail,
  sendApplicationVerificationEmail,
  sendAccountActivationEmail,
  sendApplicationRejectedEmail,
};
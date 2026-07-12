const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildOtpEmailText = ({ greeting, otp, expiryText, footerNote }) => [
  greeting,
  "",
  `Your verification code is: ${otp}`,
  expiryText,
  "",
  footerNote,
  "If you did not request this email, you can safely ignore it.",
].join("\n");

const buildOtpEmailHtml = ({
  brandName,
  logoUrl,
  preheader,
  title,
  headline,
  message,
  otp,
  expiryText,
  footerNote,
  buttonText,
  buttonLink,
}) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
</head>

<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

<span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">
${escapeHtml(preheader)}
</span>

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f7fb">
<tr>
<td align="center" style="padding:40px 20px;">

<table
width="650"
cellpadding="0"
cellspacing="0"
border="0"
style="
max-width:650px;
background:#ffffff;
border-radius:20px;
overflow:hidden;
box-shadow:0 8px 30px rgba(0,0,0,.08);
">

<!-- HEADER -->

<tr>
<td
style="
padding:45px 40px 30px;
text-align:center;
background:#ffffff;
border-bottom:5px solid #22c55e;
">

${
  logoUrl
    ? `
<img
src="${escapeHtml(logoUrl)}"
alt="${escapeHtml(brandName)}"
width="120"
style="
display:block;
margin:0 auto;
border:none;
outline:none;
height:auto;
max-width:120px;
"/>
`
    : ""
}

<div
style="
margin-top:18px;
font-size:13px;
letter-spacing:3px;
text-transform:uppercase;
font-weight:bold;
color:#22c55e;
">
${escapeHtml(brandName)}
</div>

<h1
style="
margin:18px 0 0;
font-size:34px;
font-weight:700;
color:#166534;
line-height:1.3;
">
${escapeHtml(title)}
</h1>

</td>
</tr>

<!-- BODY -->

<tr>
<td style="padding:45px;">

<h2
style="
margin:0;
font-size:28px;
text-align:center;
color:#111827;
">
${escapeHtml(headline)}
</h2>

<p
style="
margin:22px 0 35px;
font-size:16px;
line-height:1.8;
color:#4b5563;
text-align:center;
">
${escapeHtml(message)}
</p>

<!-- OTP -->

<table
align="center"
cellpadding="0"
cellspacing="0"
border="0"
style="
margin-bottom:25px;
">
<tr>
<td
style="
background:#f0fdf4;
border:2px dashed #22c55e;
border-radius:18px;
padding:22px 40px;
font-size:42px;
font-weight:bold;
letter-spacing:10px;
color:#15803d;
text-align:center;
">
${escapeHtml(otp)}
</td>
</tr>
</table>

<p
style="
text-align:center;
color:#6b7280;
font-size:14px;
margin:0 0 35px;
">
${escapeHtml(expiryText)}
</p>

${
  buttonText && buttonLink
    ? `
<table align="center" cellpadding="0" cellspacing="0" border="0">
<tr>
<td
style="
background:#16a34a;
border-radius:10px;
">
<a
href="${escapeHtml(buttonLink)}"
style="
display:inline-block;
padding:15px 36px;
font-size:16px;
font-weight:bold;
color:#ffffff;
text-decoration:none;
">
${escapeHtml(buttonText)}
</a>
</td>
</tr>
</table>
`
    : ""
}

</td>
</tr>

<!-- INFO BOX -->

<tr>
<td style="padding:0 45px 40px;">

<table
width="100%"
cellpadding="0"
cellspacing="0"
border="0"
style="
background:#f9fafb;
border-left:4px solid #22c55e;
border-radius:10px;
">
<tr>
<td style="padding:20px;">

<p
style="
margin:0;
font-size:14px;
line-height:1.8;
color:#4b5563;
">
${escapeHtml(footerNote)}
</p>

<p
style="
margin-top:18px;
font-size:14px;
line-height:1.8;
color:#6b7280;
">
If you didn't request this verification code, you can safely ignore this email.
</p>

</td>
</tr>
</table>

</td>
</tr>

<!-- FOOTER -->

<tr>
<td
style="
padding:25px;
background:#166534;
text-align:center;
">

<p
style="
margin:0;
font-size:13px;
color:#d1fae5;
line-height:1.8;
">
© ${new Date().getFullYear()} ${escapeHtml(
  brandName
)}. All rights reserved.
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;

module.exports = {
  buildOtpEmailHtml,
  buildOtpEmailText,
};
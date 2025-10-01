// ✅ Nodemailer util: ইমেইল + OTP পাঠাও, স্পষ্ট রিটার্ন দাও
import nodemailer from 'nodemailer'

export async function sendOtpMail({ to, otp }) {
  if (!to || !otp) throw new Error('to এবং otp প্রয়োজন')

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true', // 465 হলে true
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  let info
  try {
    info = await transporter.sendMail({
      from:
        process.env.MAIL_FROM ||
        `No Reply <${process.env.SMTP_USER || 'no-reply@example.com'}>`, // ✅ ডিফল্ট ঠিক করা
      to,
      subject: 'Your OTP Code',
      text: `Your OTP is ${otp}`,
     html: `<!DOCTYPE html>
<html lang="bn" style="margin:0;padding:0;">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="x-apple-disable-message-reformatting">
  <title>OTP Verification</title>
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    @media (max-width:480px){
      .container{padding:16px!important}
      .card{border-radius:14px!important}
      .title{font-size:18px!important}
      .sub{font-size:13px!important}
      .otp{font-size:22px!important; letter-spacing:8px!important}
      .row{display:block!important}
      .btn{display:block!important; width:100%!important; text-align:center!important; margin:0 0 10px 0!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#0b1220;font-family:Arial,Helvetica,sans-serif;">

  <!-- Preheader -->
  <div style="display:none;opacity:0;visibility:hidden;height:0;width:0;overflow:hidden;">
    আপনার ভেরিফিকেশন কোড ${otp} (১০ মিনিটের মধ্যে ব্যবহার করুন)
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
         style="background:#0b1220;">
    <tr>
      <td align="center">
        <div class="container" style="max-width:600px;margin:0 auto;padding:24px;">
          
          <!-- Header -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="border-collapse:separate;border-spacing:0;margin:0 0 10px 0;">
            <tr>
              <td align="center"
                  style="border-radius:16px 16px 0 0;padding:26px 18px;color:#fff;
                         background:radial-gradient(circle at 20% 10%,#3b0764 0%,#0b1220 55%,#030712 100%);">
                <div style="font-size:16px;font-weight:700;">Your App</div>
                <div style="font-size:12px;opacity:.9;">Secure Verification</div>
              </td>
            </tr>
          </table>

          <!-- Card -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card"
                 style="border:1px solid rgba(255,255,255,.08);border-radius:16px;
                        background:rgba(255,255,255,.05);backdrop-filter:blur(12px);">
            <tr>
              <td style="padding:24px;text-align:center;">
                
                <h1 class="title"
                    style="margin:0 0 6px 0;font-size:20px;line-height:1.3;font-weight:700;color:#fff;">
                  আপনার ভেরিফিকেশন কোড
                </h1>
                <p class="sub"
                   style="margin:6px 0 14px 0;font-size:14px;color:rgba(255,255,255,.78);">
                  নিচের একবার-ব্যবহারযোগ্য কোডটি ব্যবহার করুন। এই কোডটি <strong>১০ মিনিটে</strong> এক্সপায়ার হবে।
                </p>

                <!-- OTP -->
                <div class="otp" aria-label="Your one-time passcode"
                     style="display:inline-block;margin:10px auto 6px auto;padding:14px 16px;border-radius:12px;
                            font-size:26px;font-weight:800;letter-spacing:10px;
                            color:#fff;background:rgba(255,255,255,.06);
                            border:1px solid rgba(255,255,255,.1);">
                  ${otp}
                </div>

                <!-- Button -->
                <div class="row" style="margin-top:14px;display:flex;gap:12px;justify-content:center;">
                  <button onclick="navigator.clipboard.writeText('${otp}');alert('কোড কপি হয়েছে ✅');"
                          class="btn"
                          style="cursor:pointer;display:inline-block;text-decoration:none;
                                 background:linear-gradient(135deg,#a21caf,#0ea5e9);
                                 color:#fff;font-weight:700;padding:12px 20px;border-radius:12px;border:0;">
                    কোড কপি করুন
                  </button>
                </div>

                <!-- Hints -->
                <p style="margin:12px 0 0 0;font-size:12px;color:rgba(255,255,255,.72);">
                  অনুগ্রহ করে এই কোড অবশ্যই <strong>১০ মিনিটের মধ্যে</strong> ভেরিফাই করুন।
                </p>
                <p style="margin:6px 0 0 0;font-size:12px;color:rgba(255,255,255,.7);">
                  যদি এই অনুরোধ আপনার না হয়ে থাকে, তাহলে ইমেইলটি উপেক্ষা করুন। সহায়তার জন্য লিখুন: 
                  <a href="mailto:support@yourapp.com"
                     style="color:inherit;text-decoration:underline;">support@yourapp.com</a>
                </p>

              </td>
            </tr>
          </table>

          <!-- Footer -->
          <div style="text-align:center;padding:14px 8px 36px 8px;font-size:12px;color:rgba(255,255,255,.62);">
            এই মেইলটি পাঠানো হয়েছে <strong>Your App</strong> এর পক্ষ থেকে। কখনোই কারও সাথে এই কোডটি শেয়ার করবেন না।
          </div>

        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`

    })

    const ok = Array.isArray(info?.accepted) && info.accepted.length > 0
    
    return { ok, messageId: info?.messageId || null } // ✅ সফল রিটার্ন
  } catch (error) {
    console.error('sendOtpMail error:', error)
    return { ok: false, error: error?.message || String(error) } // ✅ ব্যর্থ রিটার্ন
  }
}

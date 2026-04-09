import nodemailer from "nodemailer";

/**
 * Sends an email notification to the Branch Head with qualified candidate details.
 */
export async function sendEmailNotification(candidate, aiResult) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const emailHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #60a5fa; margin: 0; font-size: 24px;">🎯 Qualified Candidate Alert</h1>
        <p style="color: #94a3b8; font-size: 14px;">Pramerica Life Insurance Selection</p>
      </div>
      
      <div style="background: #1e293b; padding: 24px; border-radius: 12px; margin-bottom: 16px;">
        <h2 style="color: #f8fafc; font-size: 18px; margin-top: 0;">Candidate Information</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #94a3b8;">Role</td><td style="color: #f8fafc; font-weight: 600;">${candidate.role || 'Financial Advisor'}</td></tr>
          <tr><td style="padding: 8px 0; color: #94a3b8;">Name</td><td style="color: #f8fafc; font-weight: 600;">${candidate.fullName}</td></tr>
          <tr><td style="padding: 8px 0; color: #94a3b8;">Email</td><td style="color: #38bdf8;">${candidate.email}</td></tr>
          <tr><td style="padding: 8px 0; color: #94a3b8;">Phone</td><td style="color: #f8fafc;">${candidate.phone}</td></tr>
          <tr><td style="padding: 8px 0; color: #94a3b8;">Experience</td><td style="color: #f8fafc;">${candidate.experience} years</td></tr>
        </table>
      </div>

      <div style="background: #1e293b; padding: 24px; border-radius: 12px; margin-bottom: 16px;">
        <h2 style="color: #f8fafc; font-size: 18px; margin-top: 0;">AI Evaluation</h2>
        <div style="display: flex; gap: 16px; margin-bottom: 16px;">
          <div style="background: ${aiResult.tier === "Elite" ? "#065f46" : "#1e40af"}; padding: 12px 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 28px; font-weight: 800; color: #f8fafc;">${aiResult.score}</div>
            <div style="font-size: 12px; color: #94a3b8;">SCORE</div>
          </div>
          <div style="background: ${aiResult.tier === "Elite" ? "#065f46" : "#1e40af"}; padding: 12px 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 20px; font-weight: 700; color: ${aiResult.tier === "Elite" ? "#34d399" : "#60a5fa"};">${aiResult.tier}</div>
            <div style="font-size: 12px; color: #94a3b8;">TIER</div>
          </div>
        </div>
        <p style="color: #cbd5e1; line-height: 1.6; margin: 0;"><strong>Reasoning:</strong> ${aiResult.reasoning}</p>
      </div>

      <div style="background: #1e293b; padding: 24px; border-radius: 12px;">
        <h2 style="color: #f8fafc; font-size: 18px; margin-top: 0;">Interview Transcript</h2>
        <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 16px;">
          ${(candidate.transcript || []).map(msg => `
            <div style="padding: 12px 16px; border-radius: 8px; background: ${msg.role === 'ai' ? '#0f172a' : '#1e3a8a'}; margin-left: ${msg.role === 'ai' ? '0' : '32px'}; margin-right: ${msg.role === 'ai' ? '32px' : '0'}; border: 1px solid ${msg.role === 'ai' ? '#334155' : '#1e40af'};">
              <p style="color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0; font-weight: 700;">
                ${msg.role === 'ai' ? 'AI Interviewer' : candidate.fullName}
                ${msg.timeTakenMs ? `<span style="color: #93c5fd; text-transform: none; font-weight: 400; padding-left: 6px;">(Typed in ${(msg.timeTakenMs / 1000).toFixed(1)}s)</span>` : ''}
              </p>
              <p style="color: ${msg.role === 'ai' ? '#cbd5e1' : '#f8fafc'}; font-size: 14px; line-height: 1.5; margin: 0;">${msg.content}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <p style="text-align: center; color: #475569; font-size: 12px; margin-top: 24px;">
        Powered by Brogence AI Lead Qualification • ${new Date().toLocaleDateString("en-IN")}
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Pramerica Selection" <${process.env.SMTP_USER}>`,
      to: process.env.BRANCH_HEAD_EMAIL,
      subject: `🎯 [${aiResult.tier}] New Qualified Candidate: ${candidate.fullName} (Score: ${aiResult.score})`,
      html: emailHtml,
    });
    console.log(`[EMAIL] Notification sent for: ${candidate.fullName}`);
    return true;
  } catch (err) {
    console.error("[EMAIL] Failed to send notification:", err.message);
    return false;
  }
}

/**
 * Fires a webhook with candidate data (for Make.com / Zapier integrations)
 */
export async function fireWebhook(candidate, aiResult) {
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) return false;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "candidate_qualified",
        timestamp: new Date().toISOString(),
        candidate: {
          fullName: candidate.fullName,
          email: candidate.email,
          phone: candidate.phone,
          experience: candidate.experience,
        },
        evaluation: aiResult,
      }),
    });
    console.log(`[WEBHOOK] Fired for: ${candidate.fullName} — Status: ${response.status}`);
    return response.ok;
  } catch (err) {
    console.error("[WEBHOOK] Failed:", err.message);
    return false;
  }
}

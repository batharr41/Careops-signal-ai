// server/services/alertService.js
// Sends email (Resend) and SMS (Twilio) notifications for high-risk check-ins

export async function sendAlertNotifications({ patient, riskScore, alert }) {
  const results = { email: null, sms: null };

  const patientName = `${patient.first_name} ${patient.last_name}`;
  const severity = riskScore.riskLevel === 'critical' ? '🚨 CRITICAL' : '⚠️ ELEVATED';
  const factors = riskScore.factors.join(', ');

  // Send email if caregiver email exists
  if (patient.caregiver_email) {
    try {
      results.email = await sendEmail({
        to: patient.caregiver_email,
        caregiverName: patient.caregiver_name || 'Caregiver',
        patientName,
        severity,
        score: riskScore.score,
        factors,
        actionNeeded: alert.action_needed
      });
      console.log(`📧 Alert email sent to ${patient.caregiver_email} for ${patientName}`);
    } catch (err) {
      console.error(`📧 Failed to send alert email:`, err.message);
      results.email = { error: err.message };
    }
  } else {
    console.log(`📧 No caregiver email for ${patientName} — skipping email alert`);
  }

  // Send SMS if caregiver phone exists
  if (patient.caregiver_phone) {
    try {
      results.sms = await sendSMS({
        to: patient.caregiver_phone,
        patientName,
        severity,
        score: riskScore.score,
        factors
      });
      console.log(`📱 Alert SMS sent to ${patient.caregiver_phone} for ${patientName}`);
    } catch (err) {
      console.error(`📱 Failed to send alert SMS:`, err.message);
      results.sms = { error: err.message };
    }
  } else {
    console.log(`📱 No caregiver phone for ${patientName} — skipping SMS alert`);
  }

  return results;
}

async function sendEmail({ to, caregiverName, patientName, severity, score, factors, actionNeeded }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not configured');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: 'BetweenVisits Alerts <onboarding@resend.dev>',
      to: [to],
      subject: `${severity} Alert — ${patientName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${severity.includes('CRITICAL') ? '#dc2626' : '#f59e0b'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 22px;">${severity} Alert</h1>
            <p style="margin: 8px 0 0; font-size: 16px;">Patient: ${patientName}</p>
          </div>
          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="margin: 0 0 12px;">Dear ${caregiverName},</p>
            <p style="margin: 0 0 16px;">A recent check-in for <strong>${patientName}</strong> has triggered a <strong>${severity.replace(/[🚨⚠️ ]/g, '').trim()}</strong> risk alert.</p>
            <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
              <p style="margin: 0 0 8px;"><strong>Risk Score:</strong> ${score}/100</p>
              <p style="margin: 0 0 8px;"><strong>Risk Factors:</strong> ${factors}</p>
              <p style="margin: 0;"><strong>Action Needed:</strong> ${actionNeeded}</p>
            </div>
            <p style="margin: 0 0 8px;">Please review the patient's status as soon as possible.</p>
            <p style="margin: 16px 0 0; color: #64748b; font-size: 13px;">— BetweenVisits Early Warning System</p>
          </div>
        </div>
      `
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Resend API error');
  return data;
}

async function sendSMS({ to, patientName, severity, score, factors }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials not configured');
  }

  // Format phone number — ensure it starts with +1 for US numbers
  let formattedTo = to.replace(/[^0-9+]/g, '');
  if (!formattedTo.startsWith('+')) {
    if (formattedTo.length === 10) {
      formattedTo = '+1' + formattedTo;
    } else if (formattedTo.length === 11 && formattedTo.startsWith('1')) {
      formattedTo = '+' + formattedTo;
    }
  }

  const message = `${severity} — ${patientName}\nRisk Score: ${score}/100\nFactors: ${factors}\n\nPlease check on this patient as soon as possible.\n— BetweenVisits`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      To: formattedTo,
      From: fromNumber,
      Body: message
    }).toString()
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Twilio API error');
  return data;
}

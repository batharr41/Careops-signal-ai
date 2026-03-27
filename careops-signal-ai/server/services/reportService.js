// server/services/reportService.js
// Generates PDF weekly reports for individual patients

import PDFDocument from 'pdfkit';
import pool from '../database/pool.js';

export async function generatePatientReport(patientId, startDate, endDate) {
  // Fetch patient info
  const patientResult = await pool.query(
    'SELECT * FROM patients WHERE id = $1',
    [patientId]
  );
  if (patientResult.rows.length === 0) throw new Error('Patient not found');
  const patient = patientResult.rows[0];

  // Fetch check-ins for the period
  const checkInsResult = await pool.query(
    `SELECT ci.*, rs.score as risk_score, rs.risk_level, rs.risk_factors,
            ls.content as ai_summary
     FROM check_ins ci
     LEFT JOIN risk_scores rs ON ci.id = rs.check_in_id
     LEFT JOIN llm_summaries ls ON ci.id = ls.check_in_id AND ls.summary_type = 'shift_handoff'
     WHERE ci.patient_id = $1
       AND ci.submitted_at >= $2
       AND ci.submitted_at <= $3
     ORDER BY ci.submitted_at DESC`,
    [patientId, startDate, endDate]
  );
  const checkIns = checkInsResult.rows;

  // Fetch alerts for the period
  const alertsResult = await pool.query(
    `SELECT * FROM alerts
     WHERE patient_id = $1
       AND created_at >= $2
       AND created_at <= $3
     ORDER BY created_at DESC`,
    [patientId, startDate, endDate]
  );
  const alerts = alertsResult.rows;

  // Generate PDF
  return buildPDF(patient, checkIns, alerts, startDate, endDate);
}

function buildPDF(patient, checkIns, alerts, startDate, endDate) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const blue = '#2563eb';
    const darkGray = '#1e293b';
    const medGray = '#64748b';
    const lightGray = '#f1f5f9';
    const red = '#dc2626';
    const orange = '#f59e0b';
    const green = '#16a34a';

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const formatDateTime = (d) => new Date(d).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });

    const pageWidth = doc.page.width - 100; // 50px margin each side

    // ===== HEADER =====
    doc.rect(0, 0, doc.page.width, 100).fill(blue);
    doc.fillColor('white').fontSize(24).font('Helvetica-Bold')
      .text('BetweenVisits', 50, 30);
    doc.fontSize(12).font('Helvetica')
      .text('Patient Weekly Report', 50, 58);
    doc.fillColor(darkGray);

    // ===== PATIENT INFO SECTION =====
    let y = 120;
    doc.fontSize(18).font('Helvetica-Bold').fillColor(darkGray)
      .text(`${patient.first_name} ${patient.last_name}`, 50, y);
    y += 28;

    doc.fontSize(10).font('Helvetica').fillColor(medGray)
      .text(`Report Period: ${formatDate(startDate)} - ${formatDate(endDate)}`, 50, y);
    y += 16;
    doc.text(`Generated: ${formatDateTime(new Date())}`, 50, y);
    y += 24;

    // Patient details box
    doc.rect(50, y, pageWidth, 80).fill(lightGray);
    doc.fillColor(darkGray).fontSize(10).font('Helvetica');

    const col1 = 65;
    const col2 = 250;
    const col3 = 420;
    const boxY = y + 12;

    doc.font('Helvetica-Bold').text('Date of Birth:', col1, boxY);
    doc.font('Helvetica').text(
      patient.date_of_birth ? formatDate(patient.date_of_birth) : 'N/A',
      col1, boxY + 14
    );

    doc.font('Helvetica-Bold').text('Risk Level:', col2, boxY);
    doc.font('Helvetica').text(
      (patient.risk_level || 'routine').toUpperCase(),
      col2, boxY + 14
    );

    doc.font('Helvetica-Bold').text('Caregiver:', col3, boxY);
    doc.font('Helvetica').text(
      patient.caregiver_name || 'Not assigned',
      col3, boxY + 14
    );

    doc.font('Helvetica-Bold').text('Conditions:', col1, boxY + 34);
    const conditions = Array.isArray(patient.medical_conditions)
      ? patient.medical_conditions.join(', ')
      : 'None listed';
    doc.font('Helvetica').text(conditions, col1 + 70, boxY + 34, { width: pageWidth - 85 });

    y += 100;

    // ===== SUMMARY STATS =====
    doc.fontSize(14).font('Helvetica-Bold').fillColor(blue)
      .text('Weekly Summary', 50, y);
    y += 22;

    const totalCheckIns = checkIns.length;
    const avgScore = checkIns.length > 0
      ? Math.round(checkIns.reduce((sum, ci) => sum + (ci.risk_score || 0), 0) / checkIns.length)
      : 0;
    const highestScore = checkIns.length > 0
      ? Math.max(...checkIns.map(ci => ci.risk_score || 0))
      : 0;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const elevatedAlerts = alerts.filter(a => a.severity === 'elevated').length;

    const statWidth = pageWidth / 4;
    const stats = [
      { label: 'Check-Ins', value: totalCheckIns.toString() },
      { label: 'Avg Risk Score', value: `${avgScore}/100` },
      { label: 'Highest Score', value: `${highestScore}/100` },
      { label: 'Alerts', value: `${criticalAlerts + elevatedAlerts}` }
    ];

    stats.forEach((stat, i) => {
      const sx = 50 + (i * statWidth);
      doc.rect(sx, y, statWidth - 8, 50).fill(lightGray);
      doc.fillColor(darkGray).fontSize(18).font('Helvetica-Bold')
        .text(stat.value, sx + 10, y + 8, { width: statWidth - 28 });
      doc.fillColor(medGray).fontSize(9).font('Helvetica')
        .text(stat.label, sx + 10, y + 32, { width: statWidth - 28 });
    });
    y += 68;

    // ===== ALERTS SECTION =====
    if (alerts.length > 0) {
      if (y > 620) { doc.addPage(); y = 50; }

      doc.fontSize(14).font('Helvetica-Bold').fillColor(blue)
        .text('Alerts', 50, y);
      y += 22;

      alerts.forEach(alert => {
        if (y > 680) { doc.addPage(); y = 50; }

        const alertColor = alert.severity === 'critical' ? red : orange;
        doc.rect(50, y, 4, 36).fill(alertColor);
        doc.fillColor(darkGray).fontSize(10).font('Helvetica-Bold')
          .text(`${alert.severity.toUpperCase()} - ${formatDateTime(alert.created_at)}`, 62, y + 4);
        doc.fillColor(medGray).fontSize(9).font('Helvetica')
          .text(alert.description || alert.title, 62, y + 18, { width: pageWidth - 20 });
        y += 44;
      });
    }

    // ===== CHECK-INS SECTION =====
    if (y > 580) { doc.addPage(); y = 50; }

    doc.fontSize(14).font('Helvetica-Bold').fillColor(blue)
      .text('Check-In Details', 50, y);
    y += 22;

    if (checkIns.length === 0) {
      doc.fontSize(10).font('Helvetica').fillColor(medGray)
        .text('No check-ins recorded during this period.', 50, y);
      y += 20;
    } else {
      checkIns.forEach((ci, index) => {
        if (y > 640) { doc.addPage(); y = 50; }

        // Check-in header
        const scoreColor = (ci.risk_score || 0) >= 70 ? red :
                          (ci.risk_score || 0) >= 40 ? orange : green;

        doc.rect(50, y, pageWidth, 1).fill('#e2e8f0');
        y += 8;

        doc.fontSize(11).font('Helvetica-Bold').fillColor(darkGray)
          .text(`Check-In #${checkIns.length - index}`, 50, y);
        doc.fontSize(10).font('Helvetica').fillColor(medGray)
          .text(formatDateTime(ci.submitted_at), 160, y);

        if (ci.risk_score != null) {
          doc.fillColor(scoreColor).font('Helvetica-Bold')
            .text(`Score: ${ci.risk_score}/100 (${ci.risk_level || 'routine'})`,
              400, y, { width: 150, align: 'right' });
        }
        y += 18;

        // Check-in details
        doc.fontSize(9).font('Helvetica').fillColor(darkGray);
        const details = [];
        if (ci.pain_level != null) details.push(`Pain: ${ci.pain_level}/10${ci.pain_location ? ' (' + ci.pain_location + ')' : ''}`);
        if (ci.mobility_status) details.push(`Mobility: ${ci.mobility_status}`);
        if (ci.mood) details.push(`Mood: ${ci.mood}`);
        if (ci.medications_taken === false) details.push('Medications: MISSED');
        if (ci.temperature) details.push(`Temp: ${ci.temperature}F`);
        if (ci.blood_pressure) details.push(`BP: ${ci.blood_pressure}`);
        if (ci.heart_rate) details.push(`HR: ${ci.heart_rate}`);
        if (ci.fall_incident) details.push('FALL INCIDENT');

        if (details.length > 0) {
          doc.text(details.join('  |  '), 50, y, { width: pageWidth });
          y += 14;
        }

        // Risk factors
        if (ci.risk_factors && Array.isArray(ci.risk_factors) && ci.risk_factors.length > 0) {
          doc.fillColor(medGray).fontSize(9).font('Helvetica')
            .text(`Risk factors: ${ci.risk_factors.join(', ')}`, 50, y, { width: pageWidth });
          y += 14;
        }

        // AI Summary
        if (ci.ai_summary) {
          doc.fillColor(medGray).fontSize(9).font('Helvetica-Oblique')
            .text(`AI Summary: ${ci.ai_summary}`, 50, y, { width: pageWidth });
          y += doc.heightOfString(`AI Summary: ${ci.ai_summary}`, { width: pageWidth }) + 4;
        }

        doc.fillColor(darkGray).text(`Submitted by: ${ci.submitted_by || 'Unknown'}`, 50, y);
        y += 20;
      });
    }

    // ===== FOOTER =====
    const footerY = doc.page.height - 40;
    doc.fontSize(8).font('Helvetica').fillColor(medGray)
      .text(
        'Generated by BetweenVisits Early Warning System | Confidential Patient Information',
        50, footerY, { width: pageWidth, align: 'center' }
      );

    doc.end();
  });
}

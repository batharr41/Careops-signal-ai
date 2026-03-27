// server/services/reportService.js
// Generates PDF weekly reports for individual patients and agency-wide summaries

import PDFDocument from 'pdfkit';
import pool from '../database/pool.js';

// ==================== PER-PATIENT REPORT ====================
export async function generatePatientReport(patientId, startDate, endDate) {
  const patientResult = await pool.query(
    'SELECT * FROM patients WHERE id = $1',
    [patientId]
  );
  if (patientResult.rows.length === 0) throw new Error('Patient not found');
  const patient = patientResult.rows[0];

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

  const alertsResult = await pool.query(
    `SELECT * FROM alerts
     WHERE patient_id = $1
       AND created_at >= $2
       AND created_at <= $3
     ORDER BY created_at DESC`,
    [patientId, startDate, endDate]
  );
  const alerts = alertsResult.rows;

  return buildPatientPDF(patient, checkIns, alerts, startDate, endDate);
}

// ==================== AGENCY-WIDE REPORT ====================
export async function generateAgencyReport(agencyId, startDate, endDate) {
  const patientsResult = await pool.query(
    `SELECT * FROM patients WHERE agency_id = $1 ORDER BY last_name, first_name`,
    [agencyId]
  );
  const patients = patientsResult.rows;

  const checkInsResult = await pool.query(
    `SELECT ci.*, rs.score as risk_score, rs.risk_level, rs.risk_factors,
            p.first_name, p.last_name, p.id as pat_id
     FROM check_ins ci
     LEFT JOIN risk_scores rs ON ci.id = rs.check_in_id
     JOIN patients p ON ci.patient_id = p.id
     WHERE p.agency_id = $1
       AND ci.submitted_at >= $2
       AND ci.submitted_at <= $3
     ORDER BY ci.submitted_at DESC`,
    [agencyId, startDate, endDate]
  );
  const checkIns = checkInsResult.rows;

  const alertsResult = await pool.query(
    `SELECT a.*, p.first_name, p.last_name
     FROM alerts a
     JOIN patients p ON a.patient_id = p.id
     WHERE p.agency_id = $1
       AND a.created_at >= $2
       AND a.created_at <= $3
     ORDER BY a.created_at DESC`,
    [agencyId, startDate, endDate]
  );
  const alerts = alertsResult.rows;

  return buildAgencyPDF(patients, checkIns, alerts, startDate, endDate);
}

// ==================== SHARED HELPERS ====================
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

function drawHeader(doc, title) {
  doc.rect(0, 0, doc.page.width, 100).fill(blue);
  doc.fillColor('white').fontSize(24).font('Helvetica-Bold')
    .text('BetweenVisits', 50, 30);
  doc.fontSize(12).font('Helvetica')
    .text(title, 50, 58);
  doc.fillColor(darkGray);
}

function drawStatBox(doc, x, y, width, value, label) {
  doc.rect(x, y, width - 8, 50).fill(lightGray);
  doc.fillColor(darkGray).fontSize(18).font('Helvetica-Bold')
    .text(value, x + 10, y + 8, { width: width - 28 });
  doc.fillColor(medGray).fontSize(9).font('Helvetica')
    .text(label, x + 10, y + 32, { width: width - 28 });
}

function checkPageBreak(doc, y, needed) {
  if (y > doc.page.height - needed - 60) {
    doc.addPage();
    return 50;
  }
  return y;
}

// ==================== BUILD PATIENT PDF ====================
function buildPatientPDF(patient, checkIns, alerts, startDate, endDate) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - 100;

    drawHeader(doc, 'Patient Weekly Report');

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
    const col1 = 65, col2 = 250, col3 = 420;
    const boxY = y + 12;

    doc.font('Helvetica-Bold').text('Date of Birth:', col1, boxY);
    doc.font('Helvetica').text(patient.date_of_birth ? formatDate(patient.date_of_birth) : 'N/A', col1, boxY + 14);
    doc.font('Helvetica-Bold').text('Risk Level:', col2, boxY);
    doc.font('Helvetica').text((patient.risk_level || 'routine').toUpperCase(), col2, boxY + 14);
    doc.font('Helvetica-Bold').text('Caregiver:', col3, boxY);
    doc.font('Helvetica').text(patient.caregiver_name || 'Not assigned', col3, boxY + 14);
    doc.font('Helvetica-Bold').text('Conditions:', col1, boxY + 34);
    const conditions = Array.isArray(patient.medical_conditions) ? patient.medical_conditions.join(', ') : 'None listed';
    doc.font('Helvetica').text(conditions, col1 + 70, boxY + 34, { width: pageWidth - 85 });
    y += 100;

    // Summary stats
    doc.fontSize(14).font('Helvetica-Bold').fillColor(blue).text('Weekly Summary', 50, y);
    y += 22;
    const totalCheckIns = checkIns.length;
    const avgScore = checkIns.length > 0 ? Math.round(checkIns.reduce((sum, ci) => sum + (ci.risk_score || 0), 0) / checkIns.length) : 0;
    const highestScore = checkIns.length > 0 ? Math.max(...checkIns.map(ci => ci.risk_score || 0)) : 0;
    const totalAlerts = alerts.length;
    const statWidth = pageWidth / 4;
    const stats = [
      { label: 'Check-Ins', value: totalCheckIns.toString() },
      { label: 'Avg Risk Score', value: `${avgScore}/100` },
      { label: 'Highest Score', value: `${highestScore}/100` },
      { label: 'Alerts', value: totalAlerts.toString() }
    ];
    stats.forEach((stat, i) => drawStatBox(doc, 50 + (i * statWidth), y, statWidth, stat.value, stat.label));
    y += 68;

    // Alerts
    if (alerts.length > 0) {
      y = checkPageBreak(doc, y, 80);
      doc.fontSize(14).font('Helvetica-Bold').fillColor(blue).text('Alerts', 50, y);
      y += 22;
      alerts.forEach(alert => {
        y = checkPageBreak(doc, y, 50);
        const alertColor = alert.severity === 'critical' ? red : orange;
        doc.rect(50, y, 4, 36).fill(alertColor);
        doc.fillColor(darkGray).fontSize(10).font('Helvetica-Bold')
          .text(`${alert.severity.toUpperCase()} - ${formatDateTime(alert.created_at)}`, 62, y + 4);
        doc.fillColor(medGray).fontSize(9).font('Helvetica')
          .text(alert.description || alert.title, 62, y + 18, { width: pageWidth - 20 });
        y += 44;
      });
    }

    // Check-ins
    y = checkPageBreak(doc, y, 60);
    doc.fontSize(14).font('Helvetica-Bold').fillColor(blue).text('Check-In Details', 50, y);
    y += 22;

    if (checkIns.length === 0) {
      doc.fontSize(10).font('Helvetica').fillColor(medGray).text('No check-ins recorded during this period.', 50, y);
    } else {
      checkIns.forEach((ci, index) => {
        y = checkPageBreak(doc, y, 80);
        const scoreColor = (ci.risk_score || 0) >= 70 ? red : (ci.risk_score || 0) >= 40 ? orange : green;
        doc.rect(50, y, pageWidth, 1).fill('#e2e8f0');
        y += 8;
        doc.fontSize(11).font('Helvetica-Bold').fillColor(darkGray)
          .text(`Check-In #${checkIns.length - index}`, 50, y);
        doc.fontSize(10).font('Helvetica').fillColor(medGray).text(formatDateTime(ci.submitted_at), 160, y);
        if (ci.risk_score != null) {
          doc.fillColor(scoreColor).font('Helvetica-Bold')
            .text(`Score: ${ci.risk_score}/100 (${ci.risk_level || 'routine'})`, 400, y, { width: 150, align: 'right' });
        }
        y += 18;
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
        if (details.length > 0) { doc.text(details.join('  |  '), 50, y, { width: pageWidth }); y += 14; }
        if (ci.risk_factors && Array.isArray(ci.risk_factors) && ci.risk_factors.length > 0) {
          doc.fillColor(medGray).fontSize(9).font('Helvetica')
            .text(`Risk factors: ${ci.risk_factors.join(', ')}`, 50, y, { width: pageWidth });
          y += 14;
        }
        if (ci.ai_summary) {
          doc.fillColor(medGray).fontSize(9).font('Helvetica-Oblique')
            .text(`AI Summary: ${ci.ai_summary}`, 50, y, { width: pageWidth });
          y += doc.heightOfString(`AI Summary: ${ci.ai_summary}`, { width: pageWidth }) + 4;
        }
        doc.fillColor(darkGray).text(`Submitted by: ${ci.submitted_by || 'Unknown'}`, 50, y);
        y += 20;
      });
    }


    doc.end();
  });
}


// ==================== BUILD AGENCY PDF ====================
function buildAgencyPDF(patients, checkIns, alerts, startDate, endDate) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - 100;

    drawHeader(doc, 'Agency Weekly Summary');

    let y = 120;
    doc.fontSize(18).font('Helvetica-Bold').fillColor(darkGray)
      .text('Agency Weekly Summary', 50, y);
    y += 28;
    doc.fontSize(10).font('Helvetica').fillColor(medGray)
      .text(`Report Period: ${formatDate(startDate)} - ${formatDate(endDate)}`, 50, y);
    y += 16;
    doc.text(`Generated: ${formatDateTime(new Date())}`, 50, y);
    y += 30;

    // Agency-wide stats
    doc.fontSize(14).font('Helvetica-Bold').fillColor(blue).text('Overview', 50, y);
    y += 22;

    const totalPatients = patients.length;
    const totalCheckIns = checkIns.length;
    const totalAlerts = alerts.length;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const elevatedAlerts = alerts.filter(a => a.severity === 'elevated').length;
    const avgScore = checkIns.length > 0
      ? Math.round(checkIns.reduce((sum, ci) => sum + (ci.risk_score || 0), 0) / checkIns.length)
      : 0;

    const statWidth = pageWidth / 4;
    const overviewStats = [
      { label: 'Total Patients', value: totalPatients.toString() },
      { label: 'Check-Ins This Week', value: totalCheckIns.toString() },
      { label: 'Avg Risk Score', value: `${avgScore}/100` },
      { label: 'Total Alerts', value: totalAlerts.toString() }
    ];
    overviewStats.forEach((stat, i) => drawStatBox(doc, 50 + (i * statWidth), y, statWidth, stat.value, stat.label));
    y += 60;

    const halfWidth = pageWidth / 2;
    drawStatBox(doc, 50, y, halfWidth, criticalAlerts.toString(), 'Critical Alerts');
    drawStatBox(doc, 50 + halfWidth, y, halfWidth, elevatedAlerts.toString(), 'Elevated Alerts');
    y += 68;

    // Risk distribution
    doc.fontSize(14).font('Helvetica-Bold').fillColor(blue).text('Risk Distribution', 50, y);
    y += 22;

    const riskCounts = { critical: 0, elevated: 0, moderate: 0, routine: 0 };
    patients.forEach(p => {
      const level = p.risk_level || 'routine';
      if (riskCounts[level] !== undefined) riskCounts[level]++;
    });

    const riskColors = { critical: red, elevated: orange, moderate: '#eab308', routine: green };
    ['critical', 'elevated', 'moderate', 'routine'].forEach(level => {
      const count = riskCounts[level];
      const pct = totalPatients > 0 ? (count / totalPatients) * 100 : 0;
      doc.fontSize(10).font('Helvetica-Bold').fillColor(darkGray)
        .text(`${level.charAt(0).toUpperCase() + level.slice(1)}`, 50, y);
      doc.font('Helvetica').fillColor(medGray)
        .text(`${count} patient${count !== 1 ? 's' : ''}`, 150, y);
      doc.rect(250, y + 2, 200, 12).fill('#e2e8f0');
      if (pct > 0) {
        doc.rect(250, y + 2, Math.max(4, 200 * (pct / 100)), 12).fill(riskColors[level]);
      }
      doc.fillColor(medGray).fontSize(9).text(`${Math.round(pct)}%`, 460, y + 1);
      y += 22;
    });
    y += 10;

    // Alerts summary
    if (alerts.length > 0) {
      y = checkPageBreak(doc, y, 80);
      doc.fontSize(14).font('Helvetica-Bold').fillColor(blue).text('Alerts This Week', 50, y);
      y += 22;

      alerts.forEach(alert => {
        y = checkPageBreak(doc, y, 50);
        const alertColor = alert.severity === 'critical' ? red : orange;
        doc.rect(50, y, 4, 40).fill(alertColor);
        doc.fillColor(darkGray).fontSize(10).font('Helvetica-Bold')
          .text(`${alert.first_name} ${alert.last_name}`, 62, y + 2);
        doc.fillColor(medGray).fontSize(9).font('Helvetica')
          .text(`${alert.severity.toUpperCase()} - ${formatDateTime(alert.created_at)}`, 62, y + 16);
        doc.text(alert.description || alert.title, 62, y + 28, { width: pageWidth - 20 });
        y += 48;
      });
    }

    // Patient breakdown table
    y = checkPageBreak(doc, y, 80);
    doc.fontSize(14).font('Helvetica-Bold').fillColor(blue).text('Patient Breakdown', 50, y);
    y += 24;

    // Build per-patient stats
    const riskPriority = { critical: 0, elevated: 1, moderate: 2, routine: 3 };
    const patientStats = patients.map(p => {
      const pCheckIns = checkIns.filter(ci => ci.pat_id === p.id);
      const pAlerts = alerts.filter(a => a.patient_id === p.id);
      const pAvgScore = pCheckIns.length > 0
        ? Math.round(pCheckIns.reduce((sum, ci) => sum + (ci.risk_score || 0), 0) / pCheckIns.length)
        : 0;
      const pHighScore = pCheckIns.length > 0
        ? Math.max(...pCheckIns.map(ci => ci.risk_score || 0))
        : 0;
      return {
        name: `${p.first_name} ${p.last_name}`,
        riskLevel: p.risk_level || 'routine',
        checkIns: pCheckIns.length,
        avgScore: pAvgScore,
        highScore: pHighScore,
        alerts: pAlerts.length,
        caregiver: p.caregiver_name || 'Not assigned'
      };
    }).sort((a, b) => {
      const riskDiff = (riskPriority[a.riskLevel] ?? 3) - (riskPriority[b.riskLevel] ?? 3);
      if (riskDiff !== 0) return riskDiff;
      return b.highScore - a.highScore;
    });

    // Table header
    y = checkPageBreak(doc, y, 30);
    doc.rect(50, y, pageWidth, 22).fill(blue);
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
    doc.text('Patient', 55, y + 6, { width: 120 });
    doc.text('Risk', 175, y + 6, { width: 60 });
    doc.text('Check-Ins', 240, y + 6, { width: 55 });
    doc.text('Avg Score', 300, y + 6, { width: 55 });
    doc.text('High Score', 360, y + 6, { width: 60 });
    doc.text('Alerts', 425, y + 6, { width: 40 });
    doc.text('Caregiver', 470, y + 6, { width: 90 });
    y += 22;

    patientStats.forEach((ps, index) => {
      y = checkPageBreak(doc, y, 28);
      const bgColor = index % 2 === 0 ? '#ffffff' : lightGray;
      doc.rect(50, y, pageWidth, 22).fill(bgColor);

      const riskColor = ps.riskLevel === 'critical' ? red :
                        ps.riskLevel === 'elevated' ? orange :
                        ps.riskLevel === 'moderate' ? '#eab308' : green;

      doc.fillColor(darkGray).fontSize(9).font('Helvetica');
      doc.text(ps.name, 55, y + 6, { width: 120 });
      doc.fillColor(riskColor).font('Helvetica-Bold')
        .text(ps.riskLevel.toUpperCase(), 175, y + 6, { width: 60 });
      doc.fillColor(darkGray).font('Helvetica');
      doc.text(ps.checkIns.toString(), 240, y + 6, { width: 55 });

      const avgColor = ps.avgScore >= 70 ? red : ps.avgScore >= 40 ? orange : green;
      doc.fillColor(avgColor).text(`${ps.avgScore}/100`, 300, y + 6, { width: 55 });

      const highColor = ps.highScore >= 70 ? red : ps.highScore >= 40 ? orange : green;
      doc.fillColor(highColor).text(`${ps.highScore}/100`, 360, y + 6, { width: 60 });

      doc.fillColor(ps.alerts > 0 ? red : darkGray)
        .text(ps.alerts.toString(), 425, y + 6, { width: 40 });
      doc.fillColor(medGray).text(ps.caregiver, 470, y + 6, { width: 90 });
      y += 22;
    });

    y += 20;

    // Patients without check-ins
    const patientsWithoutCheckIns = patientStats.filter(ps => ps.checkIns === 0);
    if (patientsWithoutCheckIns.length > 0) {
      y = checkPageBreak(doc, y, 60);
      doc.fontSize(12).font('Helvetica-Bold').fillColor(orange)
        .text('Patients Without Check-Ins This Week', 50, y);
      y += 18;
      doc.fontSize(10).font('Helvetica').fillColor(darkGray);
      patientsWithoutCheckIns.forEach(ps => {
        y = checkPageBreak(doc, y, 16);
        doc.text(`- ${ps.name} (${ps.riskLevel} risk, Caregiver: ${ps.caregiver})`, 60, y);
        y += 16;
      });
    }

    doc.end();
  });
}

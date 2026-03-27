import express from 'express';
import checkInController from '../controllers/checkInController.js';
import dashboardController from '../controllers/dashboardController.js';
import pool from '../database/pool.js';
import { authenticateJWT } from '../middleware/auth.js';
import { generatePatientReport, generateAgencyReport } from '../services/reportService.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
router.use(authenticateJWT);

// Check-in routes
router.post('/check-ins', checkInController.submitCheckIn);
router.get('/check-ins/:id', checkInController.getCheckIn);
router.get('/patients/:patientId/check-ins', checkInController.getPatientCheckIns);

// Dashboard routes
router.get('/agencies/:agencyId/dashboard', dashboardController.getDashboardOverview);
router.get('/agencies/:agencyId/triage-queue', dashboardController.getTriageQueue);
router.get('/patients/:patientId/trends', dashboardController.getPatientTrends);

// Alert routes
router.put('/alerts/:alertId/acknowledge', dashboardController.acknowledgeAlert);
router.put('/alerts/:alertId/resolve', dashboardController.resolveAlert);

// Patients routes
router.get('/agencies/:agencyId/patients', async (req, res) => {
  try {
    const { agencyId } = req.params;
    const result = await pool.query(
      `SELECT 
        p.*,
        COUNT(ci.id) as total_check_ins,
        MAX(ci.submitted_at) as last_check_in
       FROM patients p
       LEFT JOIN check_ins ci ON p.id = ci.patient_id
       WHERE p.agency_id = $1
       GROUP BY p.id
       ORDER BY p.last_name, p.first_name`,
      [agencyId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

router.get('/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM patients WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// POST create new patient
router.post('/patients', async (req, res) => {
  try {
    const body = req.body;

    const agency_id = body.agency_id || body.agencyId;
    const first_name = body.first_name || body.firstName;
    const last_name = body.last_name || body.lastName;
    const date_of_birth = body.date_of_birth || body.dateOfBirth || null;
    const caregiver_name = body.caregiver_name || body.caregiverName || null;
    const caregiver_phone = body.caregiver_phone || body.caregiverPhone || null;
    const caregiver_email = body.caregiver_email || body.caregiverEmail || null;

    const rawConditions = body.medical_conditions || body.medicalConditions || [];
    const rawMedications = body.medications || [];
    const medical_conditions = Array.isArray(rawConditions) ? rawConditions : [];
    const medications = Array.isArray(rawMedications) ? rawMedications : [];

    if (!agency_id || !first_name || !last_name) {
      return res.status(400).json({ error: 'agency_id, first_name, and last_name are required' });
    }

    const result = await pool.query(
      `INSERT INTO patients (
        agency_id, first_name, last_name, date_of_birth,
        medical_conditions, medications,
        caregiver_name, caregiver_phone, caregiver_email,
        risk_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        agency_id, first_name, last_name, date_of_birth,
        medical_conditions, medications,
        caregiver_name, caregiver_phone, caregiver_email,
        'routine'
      ]
    );

    console.log(`New patient created: ${first_name} ${last_name} (${result.rows[0].id})`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Failed to create patient: ' + error.message });
  }
});

// DELETE patient and all related data
router.delete('/patients/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');
    await client.query(`DELETE FROM llm_summaries WHERE check_in_id IN (SELECT id FROM check_ins WHERE patient_id = $1)`, [id]);
    await client.query(`DELETE FROM risk_scores WHERE check_in_id IN (SELECT id FROM check_ins WHERE patient_id = $1)`, [id]);
    await client.query('DELETE FROM alerts WHERE patient_id = $1', [id]);
    await client.query('DELETE FROM check_ins WHERE patient_id = $1', [id]);
    const result = await client.query('DELETE FROM patients WHERE id = $1 RETURNING first_name, last_name', [id]);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Patient not found' });
    }
    await client.query('COMMIT');
    const { first_name, last_name } = result.rows[0];
    console.log(`Patient deleted: ${first_name} ${last_name} (${id})`);
    res.json({ message: `${first_name} ${last_name} has been deleted.` });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Failed to delete patient: ' + error.message });
  } finally {
    client.release();
  }
});

// GET patient weekly report PDF
router.get('/patients/:id/report', async (req, res) => {
  try {
    const { id } = req.params;
    const { start, end } = req.query;
    const endDate = end ? new Date(end) : new Date();
    const startDate = start ? new Date(start) : new Date(endDate - 7 * 24 * 60 * 60 * 1000);
    endDate.setHours(23, 59, 59, 999);
    startDate.setHours(0, 0, 0, 0);
    const pdfBuffer = await generatePatientReport(id, startDate.toISOString(), endDate.toISOString());
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="patient-report-${id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report: ' + error.message });
  }
});

// GET agency-wide weekly report PDF
router.get('/agencies/:agencyId/report', async (req, res) => {
  try {
    const { agencyId } = req.params;
    const { start, end } = req.query;
    const endDate = end ? new Date(end) : new Date();
    const startDate = start ? new Date(start) : new Date(endDate - 7 * 24 * 60 * 60 * 1000);
    endDate.setHours(23, 59, 59, 999);
    startDate.setHours(0, 0, 0, 0);
    const pdfBuffer = await generateAgencyReport(agencyId, startDate.toISOString(), endDate.toISOString());
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="agency-weekly-report.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating agency report:', error);
    res.status(500).json({ error: 'Failed to generate report: ' + error.message });
  }
});

// Weekly report export (JSON)
router.get('/agencies/:agencyId/reports/weekly', async (req, res) => {
  try {
    const { agencyId } = req.params;
    const { startDate, endDate } = req.query;
    const result = await pool.query(
      `SELECT 
        p.first_name || ' ' || p.last_name as patient_name,
        COUNT(ci.id) as check_ins_count,
        AVG(rs.score) as avg_risk_score,
        COUNT(CASE WHEN a.severity IN ('critical', 'elevated') THEN 1 END) as alerts_count,
        STRING_AGG(DISTINCT rs.risk_level, ', ') as risk_levels
       FROM patients p
       LEFT JOIN check_ins ci ON p.id = ci.patient_id 
         AND ci.submitted_at BETWEEN $2 AND $3
       LEFT JOIN risk_scores rs ON ci.id = rs.check_in_id
       LEFT JOIN alerts a ON ci.id = a.check_in_id
       WHERE p.agency_id = $1
       GROUP BY p.id, patient_name
       ORDER BY alerts_count DESC, avg_risk_score DESC`,
      [agencyId, startDate, endDate]
    );
    res.json({
      period: { startDate, endDate },
      patients: result.rows,
      summary: {
        totalPatients: result.rows.length,
        totalCheckIns: result.rows.reduce((sum, p) => sum + parseInt(p.check_ins_count), 0),
        totalAlerts: result.rows.reduce((sum, p) => sum + parseInt(p.alerts_count), 0)
      }
    });
  } catch (error) {
    console.error('Error generating weekly report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

export default router;

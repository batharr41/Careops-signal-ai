import express from 'express';
import checkInController from '../controllers/checkInController.js';
import dashboardController from '../controllers/dashboardController.js';
import pool from '../database/pool.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { generatePatientReport, generateAgencyReport } from '../services/reportService.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
router.use(authenticateJWT);

// Middleware: enforce that :agencyId in URL matches the user's agency
function enforceAgencyScope(req, res, next) {
  var urlAgencyId = req.params.agencyId;
  if (urlAgencyId && req.agencyId && urlAgencyId !== req.agencyId) {
    return res.status(403).json({ error: 'Access denied - you do not belong to this agency' });
  }
  next();
}

router.get('/me', async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) return res.status(401).json({ error: 'No user email in token' });
    const staffResult = await pool.query(
      'SELECT id, agency_id, email, first_name, last_name, role FROM staff_users WHERE email = $1',
      [userEmail]
    );
    if (staffResult.rows.length > 0) {
      return res.json(staffResult.rows[0]);
    }
    const familyResult = await pool.query(
      'SELECT id, agency_id, patient_id, email, first_name, last_name, relationship FROM family_users WHERE email = $1',
      [userEmail]
    );
    if (familyResult.rows.length > 0) {
      return res.json({ ...familyResult.rows[0], role: 'family' });
    }
    return res.json({ email: userEmail, needs_onboarding: true });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Onboarding: create a new agency and link the current user as admin
router.post('/onboarding', async (req, res) => {
  var client = await pool.connect();
  try {
    var userEmail = req.user?.email;
    if (!userEmail) return res.status(401).json({ error: 'No user email in token' });

    // Check if user already has a staff record
    var existing = await client.query('SELECT id FROM staff_users WHERE email = $1', [userEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already belongs to an agency' });
    }

    var agencyName = (req.body.agencyName || '').trim();
    var firstName = (req.body.firstName || '').trim();
    var lastName = (req.body.lastName || '').trim();

    if (!agencyName) {
      return res.status(400).json({ error: 'Agency name is required' });
    }

    await client.query('BEGIN');

    // Create the agency
    var agencyResult = await client.query(
      'INSERT INTO agencies (name, contact_email) VALUES ($1, $2) RETURNING *',
      [agencyName, userEmail]
    );
    var agency = agencyResult.rows[0];

    // Create the staff user as admin
    var staffResult = await client.query(
      'INSERT INTO staff_users (agency_id, email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, agency_id, email, first_name, last_name, role',
      [agency.id, userEmail, 'supabase-auth-managed', firstName || 'Admin', lastName || '', 'admin']
    );

    await client.query('COMMIT');

    console.log('New agency onboarded: ' + agencyName + ' (' + agency.id + ') by ' + userEmail);
    res.status(201).json({
      agency: agency,
      user: staffResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Onboarding error:', error);
    res.status(500).json({ error: 'Failed to complete onboarding: ' + error.message });
  } finally {
    client.release();
  }
});

router.post('/check-ins', requireRole('admin', 'caregiver'), checkInController.submitCheckIn);
router.get('/check-ins/:id', checkInController.getCheckIn);
router.get('/patients/:patientId/check-ins', checkInController.getPatientCheckIns);

router.get('/agencies/:agencyId/dashboard', requireRole('admin', 'caregiver'), enforceAgencyScope, dashboardController.getDashboardOverview);
router.get('/agencies/:agencyId/triage-queue', requireRole('admin', 'caregiver'), enforceAgencyScope, dashboardController.getTriageQueue);
router.get('/patients/:patientId/trends', dashboardController.getPatientTrends);

router.get('/agencies/:agencyId/staff', requireRole('admin'), enforceAgencyScope, dashboardController.getStaffMembers);

router.put('/alerts/:alertId/acknowledge', requireRole('admin', 'caregiver'), dashboardController.acknowledgeAlert);
router.put('/alerts/:alertId/resolve', requireRole('admin', 'caregiver'), dashboardController.resolveAlert);

router.get('/agencies/:agencyId/alerts/resolved', requireRole('admin', 'caregiver'), enforceAgencyScope, async (req, res) => {
  try {
    const { agencyId } = req.params;
    const { limit = 20 } = req.query;
    const result = await pool.query(
      `SELECT a.*, p.first_name || ' ' || p.last_name as patient_name, su.first_name as resolved_by_first, su.last_name as resolved_by_last FROM alerts a JOIN patients p ON a.patient_id = p.id LEFT JOIN staff_users su ON a.resolved_by = su.id WHERE p.agency_id = $1 AND a.status = 'resolved' ORDER BY a.resolved_at DESC LIMIT $2`,
      [agencyId, limit]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching resolved alerts:', error);
    res.status(500).json({ error: 'Failed to fetch resolved alerts' });
  }
});

router.get('/agencies/:agencyId/patients', requireRole('admin', 'caregiver'), enforceAgencyScope, async (req, res) => {
  try {
    const { agencyId } = req.params;
    let whereClause = 'WHERE p.agency_id = $1';
    const params = [agencyId];
    if (req.userRole === 'caregiver' && req.staffUser) {
      whereClause += ' AND p.assigned_caregiver_id = $2';
      params.push(req.staffUser.id);
    }
    const result = await pool.query(
      `SELECT p.*, COUNT(ci.id) as total_check_ins, MAX(ci.submitted_at) as last_check_in, su.first_name as caregiver_first, su.last_name as caregiver_last FROM patients p LEFT JOIN check_ins ci ON p.id = ci.patient_id LEFT JOIN staff_users su ON p.assigned_caregiver_id = su.id ${whereClause} GROUP BY p.id, su.first_name, su.last_name ORDER BY p.last_name, p.first_name`,
      params
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
    if (req.userRole === 'family' && req.linkedPatientId !== id) {
      return res.status(403).json({ error: 'Access denied - you can only view your linked patient' });
    }
    if (req.userRole === 'caregiver' && req.staffUser) {
      const check = await pool.query('SELECT id FROM patients WHERE id = $1 AND assigned_caregiver_id = $2', [id, req.staffUser.id]);
      if (check.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied - patient not assigned to you' });
      }
    }
    const result = await pool.query(
      `SELECT p.*, su.first_name as assigned_first, su.last_name as assigned_last, su.email as assigned_email FROM patients p LEFT JOIN staff_users su ON p.assigned_caregiver_id = su.id WHERE p.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

router.put('/patients/:id/assign', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { caregiverId } = req.body;
    const result = await pool.query(
      `UPDATE patients SET assigned_caregiver_id = $1 WHERE id = $2 RETURNING *`,
      [caregiverId || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json({ success: true, patient: result.rows[0] });
  } catch (error) {
    console.error('Error assigning caregiver:', error);
    res.status(500).json({ error: 'Failed to assign caregiver' });
  }
});

router.post('/patients', requireRole('admin'), async (req, res) => {
  try {
    const body = req.body;
    const agency_id = req.agencyId;
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
      return res.status(400).json({ error: 'first_name and last_name are required' });
    }
    const result = await pool.query(
      `INSERT INTO patients (agency_id, first_name, last_name, date_of_birth, medical_conditions, medications, caregiver_name, caregiver_phone, caregiver_email, risk_level) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [agency_id, first_name, last_name, date_of_birth, medical_conditions, medications, caregiver_name, caregiver_phone, caregiver_email, 'routine']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Failed to create patient: ' + error.message });
  }
});

router.delete('/patients/:id', requireRole('admin'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');
    await client.query(`DELETE FROM llm_summaries WHERE check_in_id IN (SELECT id FROM check_ins WHERE patient_id = $1)`, [id]);
    await client.query(`DELETE FROM risk_scores WHERE check_in_id IN (SELECT id FROM check_ins WHERE patient_id = $1)`, [id]);
    await client.query('DELETE FROM alerts WHERE patient_id = $1', [id]);
    await client.query('DELETE FROM check_ins WHERE patient_id = $1', [id]);
    const result = await client.query('DELETE FROM patients WHERE id = $1 RETURNING first_name, last_name', [id]);
    if (result.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Patient not found' }); }
    await client.query('COMMIT');
    const { first_name, last_name } = result.rows[0];
    res.json({ message: `${first_name} ${last_name} has been deleted.` });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to delete patient: ' + error.message });
  } finally {
    client.release();
  }
});

router.get('/patients/:id/report', requireRole('admin', 'caregiver'), async (req, res) => {
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
    res.status(500).json({ error: 'Failed to generate report: ' + error.message });
  }
});

router.get('/agencies/:agencyId/report', requireRole('admin'), enforceAgencyScope, async (req, res) => {
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
    res.status(500).json({ error: 'Failed to generate report: ' + error.message });
  }
});

router.get('/agencies/:agencyId/reports/weekly', requireRole('admin'), enforceAgencyScope, async (req, res) => {
  try {
    const { agencyId } = req.params;
    const { startDate, endDate } = req.query;
    const result = await pool.query(
      `SELECT p.first_name || ' ' || p.last_name as patient_name, COUNT(ci.id) as check_ins_count, AVG(rs.score) as avg_risk_score, COUNT(CASE WHEN a.severity IN ('critical', 'elevated') THEN 1 END) as alerts_count, STRING_AGG(DISTINCT rs.risk_level, ', ') as risk_levels FROM patients p LEFT JOIN check_ins ci ON p.id = ci.patient_id AND ci.submitted_at BETWEEN $2 AND $3 LEFT JOIN risk_scores rs ON ci.id = rs.check_in_id LEFT JOIN alerts a ON ci.id = a.check_in_id WHERE p.agency_id = $1 GROUP BY p.id, patient_name ORDER BY alerts_count DESC, avg_risk_score DESC`,
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
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

export default router;

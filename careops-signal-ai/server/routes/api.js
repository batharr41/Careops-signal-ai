import express from 'express';
import checkInController from '../controllers/checkInController.js';
import dashboardController from '../controllers/dashboardController.js';
import pool from '../database/pool.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

    // Support both camelCase (frontend) and snake_case field names
    const agency_id = body.agency_id || body.agencyId;
    const first_name = body.first_name || body.firstName;
    const last_name = body.last_name || body.lastName;
    const date_of_birth = body.date_of_birth || body.dateOfBirth || null;
    const medical_conditions = body.medical_conditions || body.medicalConditions || [];
    const medications = body.medications || [];
    const caregiver_name = body.caregiver_name || body.caregiverName || null;
    const caregiver_phone = body.caregiver_phone || body.caregiverPhone || null;

    // Validate required fields
    if (!agency_id || !first_name || !last_name) {
      return res.status(400).json({ error: 'agency_id, first_name, and last_name are required' });
    }

    const result = await pool.query(
      `INSERT INTO patients (
        agency_id, first_name, last_name, date_of_birth,
        medical_conditions, medications,
        caregiver_name, caregiver_phone,
        status, risk_level, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *`,
      [
        agency_id,
        first_name,
        last_name,
        date_of_birth,
        JSON.stringify(medical_conditions),
        JSON.stringify(medications),
        caregiver_name,
        caregiver_phone,
        'active',
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

// Weekly report export
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

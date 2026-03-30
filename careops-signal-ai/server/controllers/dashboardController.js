import pool from '../database/pool.js';
import { format, subDays } from 'date-fns';

/**
 * Get dashboard overview for an agency
 * Admins see all patients; caregivers see only their assigned patients
 */
export async function getDashboardOverview(req, res) {
  try {
    var agencyId = req.params.agencyId;
    var days = req.query.days || 7;
    var startDate = subDays(new Date(), parseInt(days));

    // Build caregiver filter
    var caregiverFilter = '';
    var baseParams = [agencyId];
    if (req.userRole === 'caregiver' && req.staffUser) {
      caregiverFilter = ' AND p.assigned_caregiver_id = $2';
      baseParams = [agencyId, req.staffUser.id];
    }

    var riskDistribution = await pool.query(
      'SELECT risk_level, COUNT(*) as count FROM patients p WHERE p.agency_id = $1' + caregiverFilter + ' GROUP BY risk_level',
      baseParams
    );

    var dateParamIndex = baseParams.length + 1;
    var checkInParams = baseParams.concat([startDate]);

    var recentCheckIns = await pool.query(
      'SELECT COUNT(*) as total FROM check_ins ci JOIN patients p ON ci.patient_id = p.id WHERE p.agency_id = $1' + caregiverFilter + ' AND ci.submitted_at >= $' + dateParamIndex,
      checkInParams
    );

    var pendingAlerts = await pool.query(
      'SELECT severity, COUNT(*) as count FROM alerts a JOIN patients p ON a.patient_id = p.id WHERE p.agency_id = $1' + caregiverFilter + ' AND a.status = \'pending\' GROUP BY severity',
      baseParams
    );

    var dailyTrends = await pool.query(
      'SELECT DATE(ci.submitted_at) as date, COUNT(*) as check_ins, AVG(rs.score) as avg_risk_score, COUNT(CASE WHEN rs.risk_level IN (\'critical\', \'elevated\') THEN 1 END) as high_risk_count FROM check_ins ci JOIN patients p ON ci.patient_id = p.id LEFT JOIN risk_scores rs ON ci.id = rs.check_in_id WHERE p.agency_id = $1' + caregiverFilter + ' AND ci.submitted_at >= $' + dateParamIndex + ' GROUP BY DATE(ci.submitted_at) ORDER BY date DESC',
      checkInParams
    );

    var totalPatientsResult = await pool.query(
      'SELECT COUNT(*) as count FROM patients p WHERE p.agency_id = $1' + caregiverFilter,
      baseParams
    );

    res.json({
      riskDistribution: riskDistribution.rows,
      totalPatients: totalPatientsResult.rows[0].count,
      recentCheckIns: recentCheckIns.rows[0].total,
      pendingAlerts: pendingAlerts.rows,
      dailyTrends: dailyTrends.rows
    });

  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
}

/**
 * Get active alerts for triage queue - includes acknowledged alerts too
 * Admins see all alerts; caregivers see only alerts for their assigned patients
 */
export async function getTriageQueue(req, res) {
  try {
    var agencyId = req.params.agencyId;

    var caregiverFilter = '';
    var params = [agencyId];
    if (req.userRole === 'caregiver' && req.staffUser) {
      caregiverFilter = ' AND p.assigned_caregiver_id = $2';
      params = [agencyId, req.staffUser.id];
    }

    var result = await pool.query(
      'SELECT a.*, p.first_name || \' \' || p.last_name as patient_name, p.first_name, p.last_name, p.caregiver_name, p.caregiver_phone, tq.priority, tq.call_script as ai_call_script, tq.suggested_actions, ci.submitted_at as check_in_time, su.first_name as resolved_by_first, su.last_name as resolved_by_last FROM alerts a JOIN patients p ON a.patient_id = p.id LEFT JOIN triage_queue tq ON a.id = tq.alert_id LEFT JOIN check_ins ci ON a.check_in_id = ci.id LEFT JOIN staff_users su ON a.resolved_by = su.id WHERE p.agency_id = $1' + caregiverFilter + ' AND a.status IN (\'pending\', \'acknowledged\') ORDER BY CASE a.status WHEN \'pending\' THEN 0 WHEN \'acknowledged\' THEN 1 END, CASE a.severity WHEN \'critical\' THEN 0 WHEN \'elevated\' THEN 1 ELSE 2 END, a.created_at ASC',
      params
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching triage queue:', error);
    res.status(500).json({ error: 'Failed to fetch triage queue' });
  }
}

/**
 * Get patient trend data
 */
export async function getPatientTrends(req, res) {
  try {
    var patientId = req.params.patientId;
    var days = req.query.days || 30;
    var startDate = subDays(new Date(), parseInt(days));

    var trends = await pool.query(
      'SELECT DATE(ci.submitted_at) as date, ci.pain_level, ci.appetite, ci.sleep_quality, ci.mood, ci.medications_taken, ci.temperature, ci.heart_rate, rs.score as risk_score, rs.risk_level FROM check_ins ci LEFT JOIN risk_scores rs ON ci.id = rs.check_in_id WHERE ci.patient_id = $1 AND ci.submitted_at >= $2 ORDER BY ci.submitted_at ASC',
      [patientId, startDate]
    );

    var aggregated = trends.rows.reduce(function(acc, row) {
      var date = row.date.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date: date, painLevel: [], riskScore: [], temperature: [], heartRate: [], medicationCompliance: [] };
      }
      if (row.pain_level !== null) acc[date].painLevel.push(row.pain_level);
      if (row.risk_score !== null) acc[date].riskScore.push(row.risk_score);
      if (row.temperature !== null) acc[date].temperature.push(parseFloat(row.temperature));
      if (row.heart_rate !== null) acc[date].heartRate.push(row.heart_rate);
      acc[date].medicationCompliance.push(row.medications_taken ? 1 : 0);
      return acc;
    }, {});

    var trendData = Object.values(aggregated).map(function(day) {
      return {
        date: day.date,
        avgPainLevel: day.painLevel.length ? (day.painLevel.reduce(function(a, b) { return a + b; }, 0) / day.painLevel.length).toFixed(1) : null,
        avgRiskScore: day.riskScore.length ? (day.riskScore.reduce(function(a, b) { return a + b; }, 0) / day.riskScore.length).toFixed(0) : null,
        avgTemperature: day.temperature.length ? (day.temperature.reduce(function(a, b) { return a + b; }, 0) / day.temperature.length).toFixed(1) : null,
        avgHeartRate: day.heartRate.length ? Math.round(day.heartRate.reduce(function(a, b) { return a + b; }, 0) / day.heartRate.length) : null,
        medicationCompliance: day.medicationCompliance.length ? Math.round((day.medicationCompliance.reduce(function(a, b) { return a + b; }, 0) / day.medicationCompliance.length) * 100) : null
      };
    });

    res.json(trendData);
  } catch (error) {
    console.error('Error fetching patient trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(req, res) {
  try {
    var alertId = req.params.alertId;
    var userEmail = req.user?.email;

    var staffId = null;
    var staffName = 'Unknown';
    if (userEmail) {
      var staffResult = await pool.query('SELECT id, first_name, last_name FROM staff_users WHERE email = $1', [userEmail]);
      if (staffResult.rows.length > 0) {
        staffId = staffResult.rows[0].id;
        staffName = staffResult.rows[0].first_name + ' ' + staffResult.rows[0].last_name;
      }
    }

    var result = await pool.query(
      'UPDATE alerts SET status = \'acknowledged\', assigned_to = $1, acknowledged_at = NOW() WHERE id = $2 RETURNING *',
      [staffName, alertId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ success: true, alert: result.rows[0] });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
}

/**
 * Resolve an alert
 */
export async function resolveAlert(req, res) {
  try {
    var alertId = req.params.alertId;
    var resolutionNotes = req.body.resolutionNotes;
    var userEmail = req.user?.email;

    var staffId = null;
    if (userEmail) {
      var staffResult = await pool.query('SELECT id FROM staff_users WHERE email = $1', [userEmail]);
      if (staffResult.rows.length > 0) {
        staffId = staffResult.rows[0].id;
      }
    }

    var result = await pool.query(
      'UPDATE alerts SET status = \'resolved\', resolved_at = NOW(), resolved_by = $1, resolution_notes = $2 WHERE id = $3 RETURNING *',
      [staffId, resolutionNotes || null, alertId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    console.log('Alert ' + alertId + ' resolved by ' + userEmail);
    res.json({ success: true, alert: result.rows[0] });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
}

/**
 * Get staff members for an agency (for caregiver assignment)
 */
export async function getStaffMembers(req, res) {
  try {
    var agencyId = req.params.agencyId;
    var result = await pool.query(
      'SELECT id, email, first_name, last_name, role FROM staff_users WHERE agency_id = $1 ORDER BY last_name, first_name',
      [agencyId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching staff members:', error);
    res.status(500).json({ error: 'Failed to fetch staff members' });
  }
}

/**
 * Get current user profile from JWT
 */
export async function getCurrentUser(req, res) {
  try {
    var userEmail = req.user?.email;
    if (!userEmail) return res.status(401).json({ error: 'No user email in token' });

    var result = await pool.query(
      'SELECT id, agency_id, email, first_name, last_name, role FROM staff_users WHERE email = $1',
      [userEmail]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff user not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}

export default {
  getDashboardOverview,
  getTriageQueue,
  getPatientTrends,
  acknowledgeAlert,
  resolveAlert,
  getStaffMembers,
  getCurrentUser
};

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../database/pool.js';

let cachedKey = null;

async function getSupabasePublicKey() {
  if (cachedKey) return cachedKey;

  const jwksUrl = `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`;
  console.log('Fetching JWKS from:', jwksUrl);
  const response = await fetch(jwksUrl);
  const jwks = await response.json();
  console.log('JWKS response:', JSON.stringify(jwks));

  if (!jwks.keys || jwks.keys.length === 0) {
    throw new Error('No keys found in JWKS endpoint');
  }

  const key = jwks.keys[0];
  const publicKey = crypto.createPublicKey({
    key: key,
    format: 'jwk'
  });

  cachedKey = publicKey;
  return publicKey;
}

export async function authenticateJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const publicKey = await getSupabasePublicKey();
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['ES256']
    });
    req.user = decoded;

    // Look up staff user to attach role and agency_id
    const staffResult = await pool.query(
      'SELECT id, agency_id, role, first_name, last_name FROM staff_users WHERE email = $1',
      [decoded.email]
    );

    if (staffResult.rows.length > 0) {
      req.staffUser = staffResult.rows[0];
      req.userRole = staffResult.rows[0].role;
      req.agencyId = staffResult.rows[0].agency_id;
    } else {
      // Check if they are a family user
      const familyResult = await pool.query(
        'SELECT id, agency_id, patient_id, first_name, last_name FROM family_users WHERE email = $1',
        [decoded.email]
      );

      if (familyResult.rows.length > 0) {
        req.familyUser = familyResult.rows[0];
        req.userRole = 'family';
        req.agencyId = familyResult.rows[0].agency_id;
        req.linkedPatientId = familyResult.rows[0].patient_id;
      } else {
        req.userRole = null;
        req.agencyId = null;
      }
    }

    next();
  } catch (err) {
    console.log('JWT VERIFY FAILED:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Middleware factory: restrict routes to specific roles
// Usage: router.delete('/patients/:id', requireRole('admin'), handler)
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({ error: 'No role assigned to this user' });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'This action requires one of these roles: ' + allowedRoles.join(', '),
        yourRole: req.userRole
      });
    }

    next();
  };
}

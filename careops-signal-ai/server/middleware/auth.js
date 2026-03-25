import jwt from 'jsonwebtoken';

export function authenticateJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET, {
      algorithms: ['HS256']
    });
    req.user = decoded;
    next();
  } catch (err) {
    console.log('JWT VERIFY FAILED:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

/**
 * Auth middleware that supports two token modes:
 * - Real JWT tokens (signed with JWT_SECRET)
 * - Demo tokens in the form: demo-token-<userId>-<ts>
 *
 * This keeps the demo server working while still allowing real JWTs if configured.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const raw = req.header('Authorization') || '';
    const token = raw.replace('Bearer ', '').trim();

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Try verify as JWT first
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.id)
        .single();
        
      if (error || !user) return res.status(401).json({ message: 'Token is not valid' });
      
      user._id = user.id;
      req.user = user;
      return next();
    } catch (jwtErr) {
      // Not a valid JWT — fall back to demo-token scheme
    }

    // Demo token format: demo-token:::<userId>:::<ts>
    if (token.startsWith('demo-token:::')) {
      console.log('🔑 Processing demo token:', token);
      const parts = token.split(':::');
      // parts: ['demo-token', '<userId>', '<ts>']
      const possibleId = parts[1];
      if (!possibleId) {
        console.log('❌ Demo token malformed:', token);
        return res.status(401).json({ message: 'Demo token malformed' });
      }
      
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', possibleId)
        .single();
        
      if (error || !user) {
        console.log('❌ User not found for ID:', possibleId);
        return res.status(401).json({ message: 'Token is not valid' });
      }
      
      // Normalize to ensure downstream handlers can rely on req.user.id as a string
      user._id = user.id;
      console.log('✅ User authenticated:', user.id, user.role);
      req.user = user;
      return next();
    }

    return res.status(401).json({ message: 'Token is not valid' });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
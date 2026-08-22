import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required to authenticate requests.');
}

export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const parts = authHeader.split(' ');
    const token = parts.length === 2 ? parts[1] : parts[0];

    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ error: 'Authorization token is missing or invalid' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Token is invalid or expired' });
      }

      req.user = decoded;
      next();
    });
  } else {
    res.status(401).json({ error: 'Authorization header is missing' });
  }
}


export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User is not authenticated' });
    }

    if (req.user.role === 'super_admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      error: `Access Denied: Role '${req.user.role}' is not authorized to access this resource`
    });
  };
}

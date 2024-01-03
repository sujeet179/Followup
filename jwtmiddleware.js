require('dotenv').config();

const jwt = require('jsonwebtoken');

// Secret keys for JWT (you should keep these secrets secret and not hardcode them)
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
const SUBEMPLOYEE_JWT_SECRET = process.env.SUBEMPLOYEE_JWT_SECRET;

const jwtMiddleware = (req, res, next) => {
  // Get the token from the request headers, cookies, or wherever it's sent
  const token = req.headers.authorization;

  if (!token) {
    console.error('Token not found in headers');
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, getJwtSecret(token), (err, decodedToken) => {
    if (err) {
      // console.error('JWT verification error:', err);
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Attach the decoded token data to the request for later use
    req.user = decodedToken;

    // If you reach this point, the token is valid and decoded
    console.log('Decoded Token:', decodedToken);

    // You can check the role here and restrict access accordingly
    const { role } = decodedToken;

    if (role === 'admin' || role === 'sub-employee') {
      console.log('Authenticated User:', req.user);
      next();
    } else {
      console.error('Access denied: Invalid role');
      return res.status(403).json({ error: 'Access denied: Invalid role' });
    }
  });
};

function getJwtSecret(token) {
  // Determine which JWT secret to use based on the token's payload
  const decodedToken = jwt.decode(token);

  if (!decodedToken) {
    // Handle the case where the token couldn't be decoded
    return 'FallbackSecretKey';
  }

  const { role } = decodedToken;

  if (role === 'admin') {
    return ADMIN_JWT_SECRET;
  } else if (role === 'sub-employee') {
    return SUBEMPLOYEE_JWT_SECRET;
  }

  // Default to a fallback secret if role is not recognized
  return 'FallbackSecretKey';
}

module.exports = jwtMiddleware;
function authMiddleware(req, res, next) {
  const password = process.env.ACCESS_PASSWORD;
  if (!password) return next();

  const provided =
    req.headers['x-access-password'] ||
    req.headers['authorization']?.replace('Bearer ', '') ||
    req.query.password;

  if (provided === password) return next();

  return res.status(401).json({
    error: 'Unauthorized',
    hint: 'Set X-Access-Password header or ?password= query param',
  });
}

module.exports = { authMiddleware };
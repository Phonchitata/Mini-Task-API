module.exports = function abac(checkFn) {
  return async (req, res, next) => {
    try {
      const allowed = await checkFn(req);
      if (!allowed)
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied by ABAC policy' } });
      next();
    } catch (err) {
      next(err);
    }
  };
};

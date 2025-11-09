const prisma = require('../config/prisma');
const crypto = require('crypto');

module.exports = async function idempotency(req, res, next) {
  try {
    const key = req.headers['idempotency-key'];
    if (!key) return next();

    const existing = await prisma.idempotencyKey.findUnique({ where: { key } });
    if (existing && existing.expiresAt > new Date()) {
      return res.json(existing.response);
    }

    const chunks = [];
    const oldSend = res.json.bind(res);

    res.json = async (body) => {
      try {
        const requestHash = crypto
          .createHash('sha256')
          .update(JSON.stringify(req.body))
          .digest('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.idempotencyKey.upsert({
          where: { key },
          update: { response: body, expiresAt: expires },
          create: {
            key,
            userId: req.user?.userId || 'anonymous',
            endpoint: req.originalUrl,
            requestHash,
            response: body,
            expiresAt: expires
          }
        });
      } catch (e) {
        console.error('Idempotency save failed:', e.message);
      }
      return oldSend(body);
    };

    next();
  } catch (err) {
    next(err);
  }
};

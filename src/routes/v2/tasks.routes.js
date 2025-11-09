const router = require('express').Router();
const prisma = require('../../config/prisma');
const authenticate = require('../../middleware/authenticate');
const abac = require('../../middleware/abac');
const idempotency = require('../../middleware/idempotency');

/**
 * ✅ GET : แสดงรายการงานทั้งหมด
 * เงื่อนไข: แสดงเฉพาะงานที่เป็น public หรือเป็นเจ้าของ หรือ admin เท่านั้น
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { isPublic: true },
          { ownerId: req.user.userId },
          { owner: { role: 'admin' } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

/**
 * ✅ POST : สร้างงานใหม่ (รองรับ Idempotency-Key)
 */
router.post('/', authenticate, idempotency, async (req, res, next) => {
  try {
    const { title, description, priority } = req.body;
    if (!title) {
      return res.status(400).json({ error: { code: 'MISSING_FIELD', message: 'Title is required' } });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'medium',
        ownerId: req.user.userId
      }
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

/**
 * ✅ ABAC Policy : เจ้าของหรือ admin เท่านั้นที่แก้ไขงานได้
 */
const canAccessTask = async (req) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) return false;
  return task.ownerId === req.user.userId || req.user.role === 'admin';
};

/**
 * ✅ PATCH : แก้สถานะงาน (เฉพาะเจ้าของหรือ admin)
 */
router.patch('/:id/status', authenticate, abac(canAccessTask), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: { code: 'INVALID_STATUS', message: 'Invalid task status' } });
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

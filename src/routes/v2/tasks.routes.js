const router = require('express').Router();
const prisma = require('../../config/prisma');
const authenticate = require('../../middleware/authenticate');
const abac = require('../../middleware/abac');
const idempotency = require('../../middleware/idempotency');

/**
 * @openapi
 * /api/v2/tasks:
 *   get:
 *     summary: Get all tasks visible to current user
 *     description: Returns tasks that are public or owned by the current user (or admin).
 *     tags:
 *       - Tasks v2
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK - list of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string }
 *                   title: { type: string }
 *                   description: { type: string }
 *                   status: { type: string }
 *                   priority: { type: string }
 *                   isPublic: { type: boolean }
 *                   ownerId: { type: string }
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
 * @openapi
 * /api/v2/tasks:
 *   post:
 *     summary: Create a new task (idempotent)
 *     description: Create a new task. If Idempotency-Key header is provided and already used, returns the cached result.
 *     tags:
 *       - Tasks v2
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: false
 *         schema:
 *           type: string
 *         description: Unique key to make the request idempotent
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *     responses:
 *       201:
 *         description: Task created
 *       400:
 *         description: Missing or invalid fields
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
 * @openapi
 * /api/v2/tasks/{id}/status:
 *   patch:
 *     summary: Update task status (owner or admin only)
 *     description: Only the task owner or admin can update task status.
 *     tags:
 *       - Tasks v2
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed]
 *     responses:
 *       200:
 *         description: Task status updated successfully
 *       400:
 *         description: Invalid status
 *       403:
 *         description: Forbidden - ABAC policy denied
 */
const canAccessTask = async (req) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) return false;
  return task.ownerId === req.user.userId || req.user.role === 'admin';
};

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

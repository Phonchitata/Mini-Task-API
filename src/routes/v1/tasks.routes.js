const router = require('express').Router();

/**
 * @openapi
 * /api/v1/tasks:
 *   get:
 *     summary: Get all tasks
 *     tags: [Tasks v1]
 *     description: Returns a list of all tasks. This is a simple demo endpoint for version 1.
 *     responses:
 *       200:
 *         description: Successfully retrieved list of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "1"
 *                 title:
 *                   type: string
 *                   example: "Fix bug"
 *                 status:
 *                   type: string
 *                   example: "pending"
 */
router.get('/', (req, res) => {
  return res.json({ id: '1', title: 'Fix bug', status: 'pending' });
});

module.exports = router;

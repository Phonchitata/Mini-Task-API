const router = require('express').Router();
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { getMe, updateMe, deleteMe, listUsers } = require('../../controllers/users.controller');

/**
 * @openapi
 * /api/v1/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users v1]
 *     description: Retrieve profile information of the currently authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "user-123"
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 *                 name:
 *                   type: string
 *                   example: "Test User"
 *                 role:
 *                   type: string
 *                   example: "user"
 *       401:
 *         description: Unauthorized - missing or invalid token
 */
router.get('/me', authenticate, getMe);

/**
 * @openapi
 * /api/v1/users/me:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users v1]
 *     description: Update user profile fields such as name or email.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Name"
 *               email:
 *                 type: string
 *                 example: "updated@example.com"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.put('/me', authenticate, updateMe);

/**
 * @openapi
 * /api/v1/users/me:
 *   delete:
 *     summary: Delete current user account
 *     tags: [Users v1]
 *     description: Delete the authenticated user's account and related data.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Cannot delete user due to related data conflict
 */
router.delete('/me', authenticate, deleteMe);

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users v1]
 *     description: List all registered users. Only accessible by admin role.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "user-123"
 *                   email:
 *                     type: string
 *                     example: "admin@example.com"
 *                   role:
 *                     type: string
 *                     example: "admin"
 *       403:
 *         description: Forbidden - requires admin role
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, authorize(['admin']), listUsers);

module.exports = router;

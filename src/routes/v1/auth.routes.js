const router = require('express').Router();
const { register, login, refresh, logout } = require('../../controllers/auth.controller');

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth v1]
 *     description: Create a new user account with email, password, and name.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *               name:
 *                 type: string
 *                 example: Test User
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing or invalid fields
 */
router.post('/register', register);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth v1]
 *     description: Authenticate user and receive access/refresh tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful (returns tokens)
 *       401:
 *         description: Invalid email or password
 */
router.post('/login', login);

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth v1]
 *     description: Generate a new access token using a valid refresh token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: New access token generated
 *       403:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', refresh);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth v1]
 *     description: Revoke refresh token and logout the user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Invalid token
 */
router.post('/logout', logout);

module.exports = router;

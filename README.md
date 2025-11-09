# Mini Task API

A RESTful API for managing tasks with user authentication, RBAC/ABAC access control, idempotency, and rate limiting. Built with **Node.js + Express + Prisma + MySQL**, and documented using **Swagger (OpenAPI 3.0)**.

---

## 1. System Setup

### 1.1 Prerequisites

* Node.js v18+ (recommended v20+)
* MySQL 8.0
* Docker (optional, for MySQL + phpMyAdmin)

### 1.2 Installation

```bash
npm install
```

### 1.3 Environment Variables

Create a file `.env` in the project root:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="mysql://root:password@localhost:3306/minitaskdb"
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me-too
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
IDEMPOTENCY_TTL_HOURS=24
```

### 1.4 Database Setup

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 1.5 Run Development Server

```bash
npm run dev
```

Check: [http://localhost:3000/health](http://localhost:3000/health) → `{ ok: true }`

---

## 2. Testing Setup

### 2.1 Create `.env.test`

```env
PORT=3100
NODE_ENV=test
DATABASE_URL="mysql://root:password@localhost:3306/minitaskdb_test"
JWT_ACCESS_SECRET=test-access-secret
JWT_REFRESH_SECRET=test-refresh-secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
IDEMPOTENCY_TTL_HOURS=24
```

### 2.2 Run Tests

```bash
npm test
```

---

## 3. Core Features

### Authentication (v1)

| Method | Endpoint              | Description                            |
| ------ | --------------------- | -------------------------------------- |
| POST   | /api/v1/auth/register | Register new user                      |
| POST   | /api/v1/auth/login    | Login and receive access/refresh token |
| POST   | /api/v1/auth/refresh  | Refresh access token                   |
| POST   | /api/v1/auth/logout   | Logout and revoke refresh token        |

### Users (v1)

| Method | Endpoint         | Description                     |
| ------ | ---------------- | ------------------------------- |
| GET    | /api/v1/users/me | View own profile                |
| PUT    | /api/v1/users/me | Update profile                  |
| DELETE | /api/v1/users/me | Delete account (cascades tasks) |

### Tasks (v1)

| Method | Endpoint          | Description             |
| ------ | ----------------- | ----------------------- |
| GET    | /api/v1/tasks     | List tasks (basic RBAC) |
| POST   | /api/v1/tasks     | Create new task         |
| PUT    | /api/v1/tasks/:id | Update task             |
| DELETE | /api/v1/tasks/:id | Delete task             |

### Tasks (v2)

| Method | Endpoint                 | Description                               |
| ------ | ------------------------ | ----------------------------------------- |
| GET    | /api/v2/tasks            | View visible tasks (public, owner, admin) |
| POST   | /api/v2/tasks            | Create new task (with Idempotency-Key)    |
| PATCH  | /api/v2/tasks/:id/status | Update status (ABAC policy)               |

Authorization Header:

```
Authorization: Bearer <accessToken>
```

---

## 4. Key Middleware

### 4.1 ABAC (Attribute-Based Access Control)

* Allows access based on user and resource attributes.
* Example rule (in v2 tasks): only owner or admin can update task.

```js
const canAccessTask = async (req) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  return task && (task.ownerId === req.user.userId || req.user.role === 'admin');
};
```

### 4.2 Idempotency

Ensures `POST /api/v2/tasks` cannot create duplicate records if the same `Idempotency-Key` is sent twice.

Header example:

```
Idempotency-Key: create-task-001
```

### 4.3 Rate Limiter

Configured via `src/middleware/rateLimiter.js`:

```js
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many requests' } }
});
```

Applied globally in `app.js`.

---

## 5. Error Format

All errors follow the same structure:

```json
{
  "error": {
    "code": "INVALID_STATUS",
    "message": "Invalid task status",
    "details": null,
    "timestamp": "2025-11-10T09:41:00.000Z",
    "path": "/api/v2/tasks/123/status"
  }
}
```

---

## 6. Swagger API Docs

### 6.1 Install

```bash
npm i swagger-ui-express swagger-jsdoc
```

### 6.2 Config (`src/docs/swagger.js`)

```js
const swaggerJSDoc = require('swagger-jsdoc');
const options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Mini Task API', version: '2.0.0' },
    servers: [{ url: 'http://localhost:3000' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['src/routes/**/*.js']
};
module.exports = swaggerJSDoc(options);
```

### 6.3 Integrate in `app.js`

```js
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

Open: **[http://localhost:3000/docs](http://localhost:3000/docs)**

---

## 7. Docker Compose

Example file:

```yaml
version: "3.9"
services:
  db:
    image: mysql:8.0
    container_name: mini_task_mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: minitaskdb
    ports:
      - "3306:3306"
    volumes:
      - dbdata:/var/lib/mysql

  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    container_name: mini_phpmyadmin
    restart: unless-stopped
    environment:
      PMA_HOST: db
      PMA_USER: root
      PMA_PASSWORD: password
    ports:
      - "8081:80"
    depends_on:
      - db

volumes:
  dbdata:
```

---

## 8. Useful Tips

* Use `crypto.randomUUID()` instead of `uuid` (to avoid ESM errors).
* Maintain `.env.example` for shared configuration.
* Add `onDelete: Cascade` in Prisma schema for user-task relations.
* Run `npx prisma studio` for visual DB management.

---

**Author:** Kawinphop Suwatwisutthikhun
**Version:** 2.0.0
**License:** MIT

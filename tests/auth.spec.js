const request = require('supertest');
const app = require('../src/app');

describe('Auth Flow', () => {
  const email = 'user@test.com';
  const password = '123456';

  let accessToken, refreshToken;

  test('register 201', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password, name: 'User A' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(email);
  });

  test('login 200 -> tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  test('get /users/me with access token', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
  });

  test('refresh -> new access token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    accessToken = res.body.accessToken;
  });

  test('logout -> revoke refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken });
    expect(res.status).toBe(200);
  });

  test('refresh with revoked token -> 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });
    expect(res.status).toBe(401);
  });
});

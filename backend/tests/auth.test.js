const request = require('supertest');
const NutriJournalServer = require('../src/server');

describe('Auth Endpoints', () => {
  let app;
  let server;

  beforeAll(async () => {
    server = new NutriJournalServer();
    app = await server.initialize();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('POST /api/auth/register', () => {
    test('Should register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPassword123!',
        birth_date: '1990-01-01',
        gender: 'male',
        height: 175,
        weight: 70
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
    });

    test('Should fail with invalid email', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'TestPassword123!',
        birth_date: '1990-01-01',
        gender: 'male',
        height: 175,
        weight: 70
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    test('Should login with valid credentials', async () => {
      // First register a user
      const userData = {
        name: 'Login Test',
        email: 'login@example.com',
        password: 'TestPassword123!',
        birth_date: '1990-01-01',
        gender: 'male',
        height: 175,
        weight: 70
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Then try to login
      const loginData = {
        email: 'login@example.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });
  });

  describe('GET /health', () => {
    test('Should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(response.body.database).toBe('Connected');
    });
  });
});

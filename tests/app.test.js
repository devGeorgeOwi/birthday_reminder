process.env.NODE_ENV = 'test';
require('dotenv').config();

const request = require('supertest');

// Mock the DB and queue to isolate tests
jest.mock('../src/db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  },
  initializeDB: jest.fn(),
}));

jest.mock('../src/queue', () => ({
  addEmailJob: jest.fn(),
  emailQueue: {
    add: jest.fn(),
    process: jest.fn(),
  },
}));

jest.mock('../src/cronJob', () => ({
  startCronJob: jest.fn(),
}));

const app = require('../src/server');

describe('Auth Routes', () => {
  const { pool } = require('../src/db');
  const { addEmailJob } = require('../src/queue');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /signup should hash password and queue verification email', async () => {
    pool.query.mockResolvedValueOnce(); // INSERT succeeds
    const res = await request(app)
      .post('/signup')
      .send({ username: 'Test', email: 'test@example.com', password: 'pass', dob: '2000-01-01' });

    expect(res.status).toBe(201);
    expect(pool.query).toHaveBeenCalled();
    expect(addEmailJob).toHaveBeenCalledWith('verification', expect.any(Object));
  });

  it('POST /signup should return 409 if email duplicate', async () => {
    const dupErr = new Error('duplicate');
    dupErr.code = '23505';
    pool.query.mockRejectedValueOnce(dupErr);
    const res = await request(app)
      .post('/signup')
      .send({ username: 'Dup', email: 'dup@example.com', password: 'pass', dob: '2000-01-01' });
    expect(res.status).toBe(409);
  });
});
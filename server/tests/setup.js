const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load test environment variables
dotenv.config({ path: 'tests/.env.test' });

// Ensure JWT_SECRET is set for tests
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
}

// Setup before all tests
beforeAll(async () => {
  // Connect to test database (remove deprecated options)
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/moodecho-test');
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

// Clear database after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});
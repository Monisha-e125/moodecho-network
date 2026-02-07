#!/bin/bash

echo "🔧 Fixing Phase 9 Tests..."

# 1. Create test environment file
echo "Creating tests/.env.test..."
cat > tests/.env.test << 'EOF'
NODE_ENV=test
PORT=8001
MONGODB_URI=mongodb://localhost:27017/moodecho-test
JWT_SECRET=test-jwt-secret-key-for-testing-only
JWT_EXPIRES_IN=7d
LOG_LEVEL=error
ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# 2. Update setup.js
echo "Updating tests/setup.js..."
cat > tests/setup.js << 'EOF'
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: 'tests/.env.test' });

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
}

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/moodecho-test');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});
EOF

echo "✅ Fixes applied!"
echo ""
echo "Now run: npm test"
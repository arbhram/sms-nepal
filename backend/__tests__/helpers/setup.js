// Test environment variables — never use these values outside tests
process.env.JWT_SECRET = 'test_jwt_secret_not_for_production';
process.env.JWT_EXPIRE = '1h';
process.env.NODE_ENV = 'test';

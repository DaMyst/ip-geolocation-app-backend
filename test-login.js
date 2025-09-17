const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123',
      ipAddress: '127.0.0.1'
    });
    console.log('Login successful:', response.data);
  } catch (error) {
    console.error('Login failed:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
  }
}

testLogin();

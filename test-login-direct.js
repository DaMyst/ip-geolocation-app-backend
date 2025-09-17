const request = require('supertest');
const app = require('./server');

const testUser = {
  email: 'mephistophelles1994@gmail.com',
  password: 'password123'
};

async function testLogin() {
  try {
    console.log('Testing login with:', testUser.email);
    
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
        ipAddress: '127.0.0.1'
      });

    console.log('Login Response:', {
      status: res.status,
      body: res.body
    });

    if (res.status === 200 && res.body.token) {
      console.log('✅ Login successful!');
      console.log('Token:', res.body.token);
      
      // Test protected route
      console.log('\nTesting protected route...');
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${res.body.token}`);
      
      console.log('Protected route response:', {
        status: meRes.status,
        body: meRes.body
      });
    } else {
      console.error('❌ Login failed');
      if (res.body.error) {
        console.error('Error:', res.body.error);
      }
    }
  } catch (error) {
    console.error('Test failed with error:', error.message);
  }
}

testLogin();

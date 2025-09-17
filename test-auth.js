const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { User } = require('./models/User');

const app = require('./app');

async function testAuth() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ip_geolocation', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Test data
    const testUser = {
      email: 'mephistophelles1994@gmail.com',
      password: 'password123'
    };

    // Test login
    console.log('\nTesting login...');
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
        ipAddress: '127.0.0.1'
      });

    console.log('Login response status:', loginRes.status);
    console.log('Login response body:', JSON.stringify(loginRes.body, null, 2));

    if (loginRes.body.token) {
      console.log('\nLogin successful! Token received.');
      
      // Test protected route
      console.log('\nTesting protected route...');
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.token}`);
      
      console.log('Protected route status:', meRes.status);
      console.log('Protected route response:', JSON.stringify(meRes.body, null, 2));
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

testAuth();

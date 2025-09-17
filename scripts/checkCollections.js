require('dotenv').config();
const mongoose = require('mongoose');

async function checkCollections() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Check if userlogins collection exists
    const userLoginsExists = collections.some(c => c.name === 'userlogins');
    console.log('userlogins collection exists:', userLoginsExists);
    
    if (userLoginsExists) {
      const UserLogin = require('../models/UserLogin').UserLogin;
      const count = await UserLogin.countDocuments();
      console.log(`Found ${count} documents in userlogins collection`);
      
      if (count > 0) {
        const latest = await UserLogin.findOne().sort({ createdAt: -1 });
        console.log('Latest login record:', latest);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkCollections();

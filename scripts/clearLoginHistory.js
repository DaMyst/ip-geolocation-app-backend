const mongoose = require('mongoose');
require('dotenv').config();
const { UserLogin } = require('../models/UserLogin');

async function clearLoginHistory() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Your user ID
    const userId = '68bc108d5050fcc6ac5979e9';
    
    // Delete all login history for this user
    const result = await UserLogin.deleteMany({ user: userId });
    
    console.log(`Successfully deleted ${result.deletedCount} login records`);
    
  } catch (error) {
    console.error('Error clearing login history:', error);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
clearLoginHistory();

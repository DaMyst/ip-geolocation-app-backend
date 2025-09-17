require('dotenv').config();
const mongoose = require('mongoose');
const { UserLogin } = require('../models/UserLogin');

async function clearUserLogins() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Delete all documents in userlogins collection
    const result = await UserLogin.deleteMany({});
    console.log(`Deleted ${result.deletedCount} login records`);

  } catch (error) {
    console.error('Error clearing user logins:', error);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
clearUserLogins();

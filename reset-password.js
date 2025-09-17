const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./models/User');

async function resetPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ip_geolocation', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find the test user
    const email = 'mephistophelles1994@gmail.com';
    const newPassword = 'password123';
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found');
      return;
    }

    // Update the password
    user.password = newPassword;
    await user.save();
    
    console.log(`Password for ${email} has been reset to: ${newPassword}`);
    
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

resetPassword();

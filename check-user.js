const mongoose = require('mongoose');
const { User } = require('./models/User');
const bcrypt = require('bcryptjs');

async function checkUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ip_geolocation', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if user exists
    const email = 'mephistophelles1994@gmail.com';
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User found:', {
      _id: user._id,
      email: user.email,
      password: user.password,
      passwordLength: user.password?.length,
      tokens: user.tokens?.length || 0
    });

    // Verify password
    const isMatch = await bcrypt.compare('password123', user.password);
    console.log('Password match:', isMatch);
    
    // Generate a new token
    try {
      const token = await user.generateAuthToken();
      console.log('Generated token:', token);
    } catch (tokenError) {
      console.error('Error generating token:', tokenError);
    }

  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkUser();

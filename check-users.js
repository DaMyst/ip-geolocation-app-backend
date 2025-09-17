const mongoose = require('mongoose');
const { User } = require('./models/User');

async function checkUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ip_geolocation', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if there are any users
    const users = await User.find({});
    console.log(`Found ${users.length} users in the database:`);
    
    users.forEach(user => {
      console.log(`- ${user.email} (ID: ${user._id})`);
    });
    
    // If no users, create a test user
    if (users.length === 0) {
      console.log('\nNo users found. Creating a test user...');
      const testUser = new User({
        email: 'test@example.com',
        password: 'password123'
      });
      
      await testUser.save();
      console.log('Test user created successfully!');
      console.log('Email: test@example.com');
      console.log('Password: password123');
    }
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkUsers();

const mongoose = require('mongoose');
const { User } = require('../models/User');
const { UserLogin } = require('../models/UserLogin');

async function checkLoginHistory() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    
    if (users.length === 0) {
      console.log('No users found in the database');
      return;
    }

    console.log(`Found ${users.length} users`);

    // For each user, get their login history
    for (const user of users) {
      console.log(`\nUser: ${user.email}`);
      const logins = await UserLogin.find({ user: user._id })
        .sort({ createdAt: -1 })
        .limit(5);
      
      if (logins.length === 0) {
        console.log('  No login history found');
      } else {
        console.log(`  Last ${logins.length} logins:`);
        logins.forEach(login => {
          console.log(`  - ${login.createdAt}: ${login.ipAddress} (${login.userAgent || 'No user agent'})`);
        });
      }
    }
  } catch (error) {
    console.error('Error checking login history:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkLoginHistory();

const mongoose = require('mongoose');

async function checkDB() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ip_geolocation', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get the database instance
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\nCollections in the database:');
    collections.forEach(coll => console.log(`- ${coll.name}`));
    
    // Check users collection
    if (collections.some(c => c.name === 'users')) {
      const users = await db.collection('users').find({}).toArray();
      console.log('\nUsers in the database:');
      users.forEach(user => {
        console.log(`- ${user.email} (ID: ${user._id})`);
      });
    } else {
      console.log('\nNo users collection found');
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkDB();

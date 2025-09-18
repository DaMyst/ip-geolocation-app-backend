import mongoose from 'mongoose';

const UserLoginSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  location: {
    type: {
      city: String,
      region: String,
      country: String,
      loc: String,
      timezone: String
    },
    default: {}
  },
  isCurrent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update previous logins to not be current
UserLoginSchema.pre('save', async function(next) {
  if (this.isCurrent) {
    await this.constructor.updateMany(
      { user: this.user, isCurrent: true },
      { $set: { isCurrent: false } }
    );
  }
  next();
});

// Export the model
const UserLogin = mongoose.model('UserLogin', UserLoginSchema);

// Export the schema as well
export { UserLogin, UserLoginSchema };

export default UserLogin;

const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  ip: {
    type: String,
    required: true,
  },
  geoData: {
    type: Object,
    required: true,
  },
}, {
  timestamps: true,
});

// Create a compound index to ensure a user can't have duplicate IP lookups
historySchema.index({ user: 1, ip: 1 }, { unique: true });

const History = mongoose.model('History', historySchema);

module.exports = History;

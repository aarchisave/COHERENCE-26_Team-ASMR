const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String 
  },
  role: { 
    type: String, 
    enum: ['admin', 'user'],
    default: 'user' 
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);

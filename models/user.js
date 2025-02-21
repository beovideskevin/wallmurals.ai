const mongoose = require('mongoose')

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name value'],
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone value'],
    },
    dba: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      unique: true,
      required: [true, 'Please add a email value'],
    },
    password: {
      type: String,
      required: [true, 'Please add a password value'],
    },
    reason: {
      type: String,
      required: false,
    },
    active: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('User', userSchema)
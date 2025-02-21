const mongoose = require('mongoose')

const subscriptionSchema = mongoose.Schema(
  {
    type: {
      type: String, // free, pro, enterprise
      required: [true, 'Please add a type value'],
    },
    start: {
      type: Date,
      required: [true, 'Please add a date value'],
    },
    last: {
      type: Date,
      required: false,
    },
    next: {
      type: Date,
      required: false,
    },
    error: {
      type: String,
      required: false,
    },
    yearly: {
      type: Boolean,
      required: false,
      default: false
    },
    active: {
      type: Boolean,
      required: false,
      default: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Subscription', subscriptionSchema)
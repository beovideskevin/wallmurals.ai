const mongoose = require('mongoose')

const subscriptionSchema = mongoose.Schema(
  {
    type: {
      type: String, // free, pro, enterprise
      required: [true, 'Please add a type value'],
    },
    date: {
      type: Date,
      required: [true, 'Please add a date value'],
    },
    next: {
      type: Date,
      required: false,
    },
    error: {
      type: String,
      required: false,
    }
    // user: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   required: true,
    //   ref: 'User',
    // },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Subscription', subscriptionSchema)
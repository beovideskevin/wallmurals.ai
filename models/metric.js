const mongoose = require('mongoose')

const metricSchema = mongoose.Schema(
  {
    type: {
      type: String, // open capture shared 
      required: [true, 'Please add a type value'],
    },
    data: {
      type: String,
      required: [true, 'Please add a data value'],
    },
    // artwork: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   required: true,
    //   ref: 'Artwork',
    // },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Metric', artworkSchema)
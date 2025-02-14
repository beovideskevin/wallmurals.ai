const mongoose = require('mongoose')

const metricSchema = mongoose.Schema(
  {
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
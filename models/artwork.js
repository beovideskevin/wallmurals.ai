const mongoose = require('mongoose')

const artworkSchema = mongoose.Schema(
  {
    marker: {
      type: String,
      required: [true, 'Please add a marker value'],
    },
    video: {
      type: String,
      required: [true, 'Please add a video value'],
    },
    poster: {
      type: String,
      required: false,
    },
    width: {
      type: Number,
      required: [true, 'Please add a width value'],
    },
    height: {
      type: Number,
      required: [true, 'Please add a height value'],
    },
    chroma: {
      type: String,
      required: false,
    },
    count: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      required: false,
    },
    tagline: {
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

module.exports = mongoose.model('Artwork', artworkSchema)
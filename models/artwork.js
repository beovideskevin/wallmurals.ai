const mongoose = require('mongoose')

const artworkSchema = mongoose.Schema(
  {
    type: {
      type: String,
      required: false,
      default: "video"
    },
    route: {
      type: String,
      required: false,
    },
    marker: {
      type: String,
      required: [true, 'Please add a marker value'],
    },
    video: {
      type: String,
      required: false,
    },
    model: {
      type: String,
      required: false,
    },
    audio: {
      type: String,
      required: false,
    },
    poster: {
      type: String,
      required: false,
    },
    width: {
      type: Number,
      required: false,
    },
    height: {
      type: Number,
      required: false,
    },
    chroma: {
      type: String,
      required: false,
    },
    location: {
      type: String,
      required: false,
    },
    tagline: {
      type: String,
      required: false,
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

module.exports = mongoose.model('Artwork', artworkSchema)
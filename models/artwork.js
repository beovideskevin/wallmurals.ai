const mongoose = require('mongoose')

const artworkSchema = mongoose.Schema(
    {
        route: {
            type: String,
            required: false,
        },
        target: {
            type: String,
            required: [true, 'Please add a target value'],
        },
        animations: [{
            video: {
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
            model: {
                type: String,
                required: false,
            },
            audio: {
                type: String,
                required: false,
            }
        }],
        location: {
            type: String,
            required: false,
        },
        lat: {
            type: Number,
            required: false,
            default: 0
        },
        lon: {
            type: Number,
            required: false,
            default: 0
        },
        tagline: {
            type: String,
            required: false,
        },
        website: {
            type: String,
            required: false,
            default: 'https://www.wallmurals.ai/ar'
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

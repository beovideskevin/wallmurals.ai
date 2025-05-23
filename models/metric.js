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
        uuid: {
            type: String,
            required: [true, 'Please add a uuid value'],
        },
        artwork: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Artwork',
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

module.exports = mongoose.model('Metric', metricSchema)
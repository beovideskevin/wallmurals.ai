const mongoose = require('mongoose');
const sanitize = require('mongo-sanitize');
const Metric = require('../models/metric');
const Artwork = require('../models/artwork');
const { getMonthNameArray } = require('../helpers/utils');

/* GET metrics listing. */
const list = async function(req, res, next) {
    // @TODO implement weekly and monthly metrics

    if (!req.session.user) {
        res.status(403);
        return res.json({});
    }

    const artworks = await Artwork.find({user: req.session.user});
    if (!artworks.length) {
        res.status(403);
        return res.json({});
    }

    const now = new Date();
    const monthsArray = getMonthNameArray();
    const visits = [];
    const engagement = [];
    const interactions = [];
    for (let i = 0; i < artworks.length; i++) {
        let artwork = artworks[i];
        let visitsData = [];
        let engagementData = [];
        let interactionsData = [];
        for (let month = 0; month < 12; month++) {
            let startDate = new Date(now.getFullYear(), month, 1);
            let endDate = new Date(now.getFullYear(), month + 1, 1);
            if (month == 11) {
                endDate = new Date(now.getFullYear()+1, 0, 1);
            } 

            // Visits
            let countVisits = await Metric.countDocuments({
                type: "open",
                artwork: artwork.id,
                createdAt: { $gte: startDate, $lte: endDate }
            });
            visitsData.push({month: monthsArray[month], count: countVisits});

            // Engagement
            let countEngagement = await Metric.countDocuments({
                type: "targetfound",
                artwork: artwork.id,
                createdAt: { $gt: startDate, $lte: endDate } 
            });
            engagementData.push({month: monthsArray[month], count: countEngagement});

            // Interactions
            let countVideoInteractions = await Metric.countDocuments({
                type: "sharevideo",
                artwork: artwork.id,
                createdAt: { $gt: startDate, $lte: endDate } 
            });
            let countPhotoInteractions = await Metric.countDocuments({
                type: "sharephoto",
                artwork: artwork.id,
                createdAt: { $gt: startDate, $lte: endDate }
            });
            interactionsData.push({month: monthsArray[month], count: countVideoInteractions + countPhotoInteractions});
        }
        // Visits
        visits.push({
            id: artwork.id,
            location: artwork.location,
            data: visitsData
        });

        // Engagement
        engagement.push({
            id: artwork.id,
            location: artwork.location,
            data: engagementData
        });

        // Interactions
        interactions.push({
            id: artwork.id,
            location: artwork.location,
            data: interactionsData
        });
    }

    const metrics = {visits, engagement, interactions};
    res.set('Content-Type', 'application/json')
    res.status(200);
    return res.json(metrics);
}

/* POST save metrics. */
const save = async function(req, res, next) {
    const body = req.body;
    if (!body.uuid || !body.id || !body.data || !body.metricType) {
        console.log("Bad form");
        res.status(400);
        return res.json({success: false});
    }

    const metricType = sanitize(body.metricType);
    const data = sanitize(body.data);
    const uuid = sanitize(body.uuid);
    const id = sanitize(body.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
        console.log("BAD ID", id);
        res.status(400);
        return res.json({success: false});
    }
    const artwork = await Artwork.findById(id);
    if (!artwork) {
        console.log("NO ARTWORK FOUND", id);
        res.status(400);
        return res.json({success: false});
    }
    const user = artwork.user;
    Metric.create({
        type: metricType,
        data: data,
        uuid: uuid,
        artwork: id,
        user: user
    }).then(function (newMetric) {
        console.log("Metric created!", newMetric);
    }).catch(function (error) {
        if(error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            console.log("VALIDATION ERROR: " + messages);
        }
        else {
            console.log("ERROR: " + error);
        }
    });
    res.status(200);
    return res.json({success: true});
}

module.exports = {
    list,
    save
};

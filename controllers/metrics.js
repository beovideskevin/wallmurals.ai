var sanitize = require('mongo-sanitize');
const Metric = require('../models/metric');
const Artwork = require('../models/artwork');
const { getMonthNameArray, saveMetric } = require('../helpers/utils');

/* GET metrics listing. */
const list = async function(req, res, next) {
    // @TODO implement weekly and monthly metrics

    if (!req.session.user) {
        res.status(403);
        res.json({});
        return;
    }

    const artworks = await Artwork.find({user: req.session.user});
    if (!artworks.length) {
        res.status(403);
        res.json({});
        return;
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
    res.json(metrics);
}

/* POST save metrics. */
const save = async function(req, res, next) {
    const body = req.body;
    if (!body.uuid || !body.id || !body.data || !body.metricType) {
        console.log("Bad form");
        res.status(400);
        res.json({success: false});
        return;
    }

    const metricType = sanitize(body.metricType);
    const id = sanitize(body.id);
    const data = sanitize(body.data);
    const uuid = sanitize(body.uuid);
    const artwork = await Artwork.findById(id);
    if (!artwork) {
        console.log("not found artwork!");
        res.status(400);
        res.json({success: false});
        return;
    }
    const user = artwork.user;
    Metric.find({uuid: uuid}).then(function (metrics) {
        // If the uuid is fake or bad return 400
        if (!metrics.length) {
            console.log("not found metric!");
            res.status(400);
            res.json({success: false});
            return;
        }
        // All good, save the metric
        saveMetric({metricType, user, id, data, uuid});
        res.status(200);
        res.json({success: true});
    });
}

module.exports = {
    list,
    save
};

const Subscription = require('../models/subscription');
const Metric = require('../models/metric');

getMonthNameArray = function () {
    let fullArray = [];
    const now = new Date();
    for (let month = 0; month < 12; month++) {
        now.setMonth(month); // Month is 0-indexed
        fullArray.push(now.toLocaleString('default', { month: 'long' }));
    }
    return fullArray;
}

const getSubscriptionLastDate = function(day) {
    const now = new Date();
    let targetDate = new Date(now.getFullYear(), now.getMonth(), 1);
    if (day == 1) {
        return targetDate;
    }
    if (now.getDate() >= day) {
        targetDate = new Date(now.getFullYear(), now.getMonth(), day);    
    }
    else {
        if (now.getMonth() == 1) {
            targetDate = new Date(now.getFullYear()-1, 11, day);        
        }
        else {
            targetDate = new Date(now.getFullYear(), now.getMonth() - 1, day);    
        }
    }
    return targetDate;
}

checkViews = async function(artwork) {
    const MAX_FREE_VIEWS = 1000;
    const MAX_PRO_VIEWS = 100000;

    let max = MAX_FREE_VIEWS;
    let targetDate = getSubscriptionLastDate(1);
    let subscriptions = await Subscription.find({user: artwork.user, active: true});
    if (subscriptions.length) {
        max = MAX_PRO_VIEWS;
        let start = new Date(subscriptions[0].start);
        // @TODO implement better deal here
        let day = start.getDate() > 28 ? 28 : start.getDate();
        targetDate = getSubscriptionLastDate(day);
    }
    let count = await Metric.countDocuments({
        type: "open",
        artwork: artwork.id,
        createdAt: { $gt: targetDate }
    });
    if (count > max) {
        console.log("MAX VIEWS REACHED: " + req.params.id);
        return false;
    }
    return true;
}

saveMetric = (values) => {
    const {metricType, id, data, uuid} = values;
    Metric.create({
        type: metricType,
        data: data,
        uuid: uuid,
        artwork: id
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
}

const openMetric = function(req, id, uuid) {
    const forwardedFor = req.headers['x-forwarded-for'] || req.connection.remoteAddress || "no IP";
    saveMetric({
        metricType: "open",
        data: forwardedFor,
        uuid: uuid,
        id: id
    });
}

const isCloseToPlace = function (userLat, userLon, targetLat, targetLon) {
    const MIN_DISTANCE = 200; // min distance in meters
    const METERS_PER_KILOMETER = 1000; // 1000 meter per kilometer
    const EARTH_RADIUS_KM = 6371;

    const toRadians = (angle) => (angle * Math.PI) / 180;

    const distance = (lat1, lon1, lat2, lon2) => {
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_KM * c * METERS_PER_KILOMETER; // Convert distance to meters
    };

    const calculatedDistance = distance(userLat, userLon, targetLat, targetLon);
    console.log("location ", calculatedDistance);
    return calculatedDistance <= MIN_DISTANCE;
}

module.exports = {
    getSubscriptionLastDate,
    getMonthNameArray,
    checkViews,
    saveMetric,
    openMetric,
    isCloseToPlace
};
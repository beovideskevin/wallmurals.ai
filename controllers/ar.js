var sanitize = require('mongo-sanitize');
const { v4: uuidv4 } = require('uuid');
const Artwork = require('../models/artwork');
const Metric = require('../models/metric');
const Subscription = require('../models/subscription');
const { getSubscriptionLastDate } = require('../helpers/utils');

const MAX_FREE_VIEWS = 1000;
const MAX_PRO_VIEWS = 100000;

/* GET AR page. */
const ar = async function(req, res, next) {
  const uuid = uuidv4();
  const forwardedFor = req.headers['x-forwarded-for'] || req.connection.remoteAddress || "no IP";
  const id = sanitize(req.params.id);
  try {
    const artwork = await Artwork.findById(id);
    if (!artwork || artwork == []) {
      console.log("NOT FOUND ID: " + req.params.id);
      res.redirect('/');
      return;
    }

    let max = MAX_FREE_VIEWS;
    let targetDate = getSubscriptionLastDate(1);
    let subscriptions = await Subscription.find({user: artwork.user, active: true});
    if (subscriptions.length) {
        max = MAX_PRO_VIEWS;
        let start = new Date(subscriptions[0].start);
        let day = start.getDate() > 28 ? 28 : start.getDate();
        targetDate = getSubscriptionLastDate(day);
    }
    console.log(targetDate);
    let count = await Metric.countDocuments({
        type: "open",
        artwork: artwork.id,
        createdAt: { $gt: targetDate } 
    });
    console.log(count);
    if (count > max) {
        console.log("MAX VIEWS REACHED: " + req.params.id);
        res.redirect('/');
        return;
    }

    Metric.create({
        type: "open",
        data: forwardedFor,
        uuid: uuid,
        artwork: artwork.id
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
    
    res.set('Cache-Control', 'no-cache'); // Set custom header NO CACHE
    res.render('ar', {
      uuid: uuid,
      artwork: artwork
    });
  }
  catch (error) {
    console.log("AR ROUTE ERROR: " + error + " ID: " + req.params.id);
    res.redirect('/');
  }
}

module.exports = {
    ar
};

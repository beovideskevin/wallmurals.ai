var sanitize = require('mongo-sanitize');
const { v4: uuidv4 } = require('uuid');
const Artwork = require('../models/artwork');
var Metric = require('../models/metric');

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

    const targetDate = new Date('2025-02-19T00:00:00.000Z');
    let count = await Metric.countDocuments({
        type: "open",
        artwork: artwork.id,
        createdAt: { $gt: targetDate } 
    });
    // @TODO implement views limit

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

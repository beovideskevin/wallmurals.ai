var express = require('express');
var router = express.Router();
var sanitize = require('mongo-sanitize');
const Artwork = require('../models/artwork');
const { v4: uuidv4 } = require('uuid');
var Metric = require('../models/metric');

var fs = require('fs');
var db = JSON.parse(fs.readFileSync('db.json', 'utf8'));

/* GET AR page. */
router.get('/:id', async function(req, res, next) {
  const uuid = uuidv4();

  if (req.params.id == 0 || 
      req.params.id == 1 ||
      req.params.id == 2 ||
      req.params.id == 3 ||
      req.params.id == 4) 
  {
    Metric.create({
        type: "open",
        data: "Nothing",
        uuid: uuid,
        artwork: db.artworks[req.params.id].id
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
    
    res.set('Cache-Control', 'no-cache'); // Set custom header
    res.render('ar', {
      uuid: uuid,
      artwork: db.artworks[req.params.id]
    });
    return;
  }

  let id = sanitize(req.params.id);
  try {
    const artwork = await Artwork.findById(id);
    if (!artwork || artwork == []) {
      console.log("NOT FOUND ID: " + req.params.id);
      res.redirect('/');
      return;
    }

    Metric.create({
        type: "open",
        data: "Nothing",
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
    
    res.render('ar', {
      uuid: uuid,
      artwork: artwork
    });
  }
  catch (error) {
    console.log("AR ROUTE ERROR: " + error + " ID: " + req.params.id);
    res.redirect('/');
  }
});

module.exports = router;

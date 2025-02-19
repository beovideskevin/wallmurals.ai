var express = require('express');
var router = express.Router();
var sanitize = require('mongo-sanitize');
const Artwork = require('../models/artwork')

var fs = require('fs');
var db = JSON.parse(fs.readFileSync('db.json', 'utf8'));

/* GET AR page. */
router.get('/:id', async function(req, res, next) {
  if (req.params.id == 0 || 
      req.params.id == 1 ||
      req.params.id == 2 ||
      req.params.id == 3 ||
      req.params.id == 4) 
  {
    res.set('Cache-Control', 'no-cache'); // Set custom header
    res.render('ar', { 
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
    
    res.render('ar', { 
      artwork: artwork
    });
  }
  catch (error) {
    console.log("AR ROUTE ERROR: " + error + " ID: " + req.params.id);
    res.redirect('/');
  }
});

module.exports = router;

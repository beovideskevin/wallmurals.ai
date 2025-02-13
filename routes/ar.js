var express = require('express');
var router = express.Router();

/* GET AR page. */
router.get('/:id', function(req, res, next) {
  let id = req.params.id;
  res.render('ar', { 
    title: process.env.title,
    keywords: process.env.keywords,
    description: process.env.description,
    author: process.env.author,
    artwork: db['artworks'][id]
  });
});

module.exports = router;

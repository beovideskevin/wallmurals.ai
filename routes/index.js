var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { 
    title: process.env.TITLE,
    keywords: process.env.KEYWORDS,
    description: process.env.DESCRIPTION,
    author: process.env.AUTHOR,
  });
});

module.exports = router;

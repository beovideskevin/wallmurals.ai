var express = require('express');
var router = express.Router();

/* GET AR page. */
router.get('/', function(req, res, next) {
  res.render('ar', { title: 'AR' });
});

module.exports = router;

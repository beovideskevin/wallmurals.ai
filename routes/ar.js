var express = require('express');
var router = express.Router();
const {ar} = require('../controllers/ar.js')

/* GET AR page. */
router.get('/:id', ar);

module.exports = router;

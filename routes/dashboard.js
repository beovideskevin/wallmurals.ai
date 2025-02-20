var express = require('express');
var router = express.Router();
const {
    index,
    metrics,
    account
} = require('../controllers/dashboard');

/* GET dashboard page. */
router.get('/', index); 

/* GET metrics page. */
router.get('/metrics', metrics);

/* GET account page. */
router.get('/account', account);

module.exports = router;
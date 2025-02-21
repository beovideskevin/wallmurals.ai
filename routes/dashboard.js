var express = require('express');
var router = express.Router();
const {
    index,
    updateLocation,
    updateTagLine,
    metrics,
    account,
    changePassword,
    closeAccount
} = require('../controllers/dashboard');

/* GET dashboard page. */
router.get('/', index); 

/* POST update location form. */
router.post('/updatelocation', updateLocation); 

/* POST update tagline form. */
router.post('/updatetagline', updateTagLine); 

/* GET metrics page. */
router.get('/metrics', metrics);

/* GET account page. */
router.get('/account', account);

/* POST change password. */
router.post('/changepassword', changePassword); 

/* POST close account. */
router.post('/closeaccount', closeAccount); 

module.exports = router;

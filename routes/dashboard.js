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

/* GET metrics page. */
router.get('/metrics', metrics);

/* GET account page. */
router.get('/account/:message?/:error?', account);

/* POST change password. */
router.post('/changepassword', changePassword);

/* POST close account. */
router.post('/closeaccount', closeAccount);

/* GET dashboard page. */
router.get('/:message?/:error?', index);

/* POST update tagline form. */
router.post('/updatetagline', updateTagLine); 

module.exports = router;

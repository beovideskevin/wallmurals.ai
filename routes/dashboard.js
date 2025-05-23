var express = require('express');
var router = express.Router();
const {
    index,
    storeArtwork,
    editArtwork,
    updateArtwork,
    deleteArtwork,
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

/* GET dashboard edit page. */
router.get('/edit/:id/:message?', editArtwork);

/* POST dashboard new artwork. */
router.post('/new', storeArtwork);

/* POST dashboard save artwork. */
router.post('/edit', updateArtwork);

/* POST update tagline form. */
router.post('/delete', deleteArtwork);

/* GET dashboard page. */
router.get('/:message?/:error?', index);

module.exports = router;

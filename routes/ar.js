var express = require('express');
var router = express.Router();
const {arLoc, arRoute, arId, ar, createAr, editAr, deleteAr} = require('../controllers/ar.js')

/* GET AR by route. */
router.get('/aframe/:route', arRoute);

/* GET AR by id. */
router.get('/id/:id', arId);

/* GET AR by location. */
router.get('/location/:lat/:lon/:uuid', arLoc);

/* GET AR by route. */
router.get('/:route', arRoute);

/* GET AR by location. */
router.get('/', ar);

module.exports = router;

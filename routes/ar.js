var express = require('express');
var router = express.Router();
const {arLoc, ar, createAr, editAr, deleteAr} = require('../controllers/ar.js')

/* GET AR by location. */
router.get('/location/:lat/:lon/:uuid', arLoc);

/* GET AR by id. */
router.get('/:id', ar);

/* GET AR page. */
router.post('/:id', createAr);

/* GET AR page. */
router.put('/:id', editAr);

/* GET AR page. */
router.delete('/:id', deleteAr);

module.exports = router;

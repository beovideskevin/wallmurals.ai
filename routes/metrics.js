var express = require('express');
var router = express.Router();
const {
    list,
    save
} = require('../controllers/metrics');

/* GET metrics listing. */
router.get('/:period?', list);

/* POST save metrics. */
router.post('/', save)

module.exports = router;

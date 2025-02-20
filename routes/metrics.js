var express = require('express');
var sanitize = require('mongo-sanitize');
var Metric = require('../models/metric');

var router = express.Router();

/* GET metrics listing. */
router.get('/:id', async function(req, res, next) {
    let id = sanitize(req.params.id);
    const metrics = await Metric.find({artwork: id});
    console.log(metrics);
});

/* POST save metrics. */
router.post('/', function(req, res, next) {
    let body = req.body;
    if (!body.uuid || !body.id || !body.data || !body.metricType) {
        console.log("Bad form");
        res.status(400);
        res.json({success: false});
        return;
    }

    let metricType = sanitize(body.metricType);
    let id = sanitize(body.id);
    let data = sanitize(body.data);
    let uuid = sanitize(body.uuid);
    let result = null;
    Metric.find({uuid: uuid}).then(function (metrics) {
        // If the uuid is fake or bad return 400
        if (!metrics.length) {
            res.status(400);
            result = {success: false};
            return;
        }

        // All good, save the metric
        saveMetric({metricType, id, data, uuid});
        result = {success: true};
        res.status(200);
    });

    res.json(result);
});

saveMetric = (values) => {
    const {metricType, id, data, uuid} = values;

    Metric.create({
        type: metricType,
        data: data,
        uuid: uuid,
        artwork: id
    }).then(function (newMetric) {
        console.log("Metric created!", newMetric);
    }).catch(function (error) {
        if(error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            console.log("VALIDATION ERROR: " + messages);
        } 
        else {
            console.log("ERROR: " + error);
        }
    });
}

module.exports = router;

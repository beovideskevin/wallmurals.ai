var sanitize = require('mongo-sanitize');
const {v4: uuidv4} = require('uuid');
const Artwork = require('../models/artwork');
const {checkViews, openMetric, isCloseToPlace} = require('../helpers/utils');

/* GET the artwork by route */
const arRoute = async function (req, res, next) {
    const route = sanitize(req.params.route);
    const uuid = uuidv4();

    const artwork = await Artwork.findOne({route: route});
    if (!artwork) {
        console.log("ROUTE NOT FOUND", req.params.route);
        res.redirect('/ar');
        return;
    }

    if (!checkViews(artwork)) {
        // @TODO send email to admin and user
        console.log("EXCESS VIEWS", req.params.id, artwork);
        res.redirect('/home');
        return;
    }

    openMetric(req, artwork.user, artwork.id, uuid);

    res.render('ar', {
        uuid: uuid,
        artwork: JSON.stringify(artwork)
    });
}

/* GET the artwork by id */
const arId = async function (req, res, next) {
    const id = sanitize(req.params.id);
    const uuid = uuidv4();

    Artwork.findById(id)
        .then(function (artwork) {
            if (!artwork) {
                console.log("NOT FOUND ID", req.params.id);
                res.redirect('/ar');
                return;
            }

            if (!checkViews(artwork)) {
                // @TODO send email to admin and user
                console.log("EXCESS VIEWS", req.params.id, artwork);
                res.redirect('/home');
                return;
            }

            openMetric(req, artwork.user, artwork.id, uuid);

            res.render('ar', {
                uuid: uuid,
                artwork: JSON.stringify(artwork)
            });
        })
        .catch(function(error) {
            console.log("ERROR: " + error);
            res.redirect('/home');
        });
}

/* GET the artwork */
const ar = async function (req, res, next) {
    res.render('ar', {
        uuid: uuidv4(),
        artwork: JSON.stringify(null)
    });
}

/* GET the artwork by location */
const arLoc = async function (req, res, next) {
    const lat = sanitize(req.params.lat);
    const lon = sanitize(req.params.lon);
    const uuid = sanitize(req.params.uuid);

    if (!lat || !lon || !uuid) {
        res.status(404);
        res.json(null);
        return;
    }

    const artworks = await Artwork.find({});
    for (const artwork of artworks) {
        if (!artwork.lat || !artwork.lon) {
            continue;
        }
        if (isCloseToPlace(lat, lon, artwork.lat, artwork.lon)) {
            if (!checkViews(artwork)) {
                // @TODO send email to admin and user
                console.log("EXCESS VIEWS", req.params.lat, req.params.lon, artwork);
                res.status(404);
                res.json(null);
                return;
            }

            openMetric(req, artwork.user, artwork.id, uuid);
            res.status(200);
            res.json(artwork);
            return;
        }
    }
    res.status(404);
    res.json(null);
}

module.exports = {
    arLoc,
    arRoute,
    arId,
    ar,
};

var sanitize = require('mongo-sanitize');
const {v4: uuidv4} = require('uuid');
const Artwork = require('../models/artwork');
const {checkViews, isCloseToPlace} = require('../helpers/utils');

const aFrame = async function (req, res, next) {
    const route = sanitize(req.params.route);
    const uuid = uuidv4();

    const artwork = await Artwork.findOne({route: route});
    if (!artwork) {
        console.log("ROUTE NOT FOUND", req.params.route);
        res.redirect('/ar');
        return;
    }

    if (!checkViews(artwork)) {
        console.log("EXCESS VIEWS", req.params.id, artwork);
        res.redirect('/');
        return;
    }

    res.render('aframe', {
        uuid: uuid,
        artwork: JSON.stringify(artwork)
    });
}

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
        console.log("EXCESS VIEWS", req.params.id, artwork);
        res.redirect('/');
        return;
    }

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
                console.log("EXCESS VIEWS", req.params.id, artwork);
                res.redirect('/');
                return;
            }

            res.render('ar', {
                uuid: uuid,
                artwork: JSON.stringify(artwork)
            });
        })
        .catch(function(error) {
            console.log("ERROR: " + error);
            res.redirect('/');
        });
}

/* GET the artwork */
const ar = function (req, res, next) {
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
                console.log("EXCESS VIEWS", req.params.lat, req.params.lon, artwork);
                res.status(404);
                res.json(null);
                return;
            }

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
    aFrame,
};

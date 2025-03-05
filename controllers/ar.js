var sanitize = require('mongo-sanitize');
const {v4: uuidv4} = require('uuid');
const Artwork = require('../models/artwork');
const {checkViews, openMetric, isCloseToPlace} = require('../helpers/utils');

/* GET the artwork by location */
const arLoc = async function (req, res, next) {
    const lat = sanitize(req.params.lat);
    const lon = sanitize(req.params.lon);
    const uuid = sanitize(req.params.uuid);

    if (!lat || !lon || !uuid) {
        res.set('Content-Type', 'application/json')
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
            openMetric(req, artwork.id, uuid);
            res.set('Content-Type', 'application/json')
            res.status(200);
            res.json(artwork);
            return;
        }
    }
    res.set('Content-Type', 'application/json')
    res.status(404);
    res.json(null);
}

/* GET the artwork */
const ar = async function (req, res, next) {
    const id = sanitize(req.params.id);
    const uuid = uuidv4();

    // Probably will never happen :)
    if (!id) {
        res.render('ar', {
            uuid: uuidv4(),
            artwork: JSON.stringify(null)
        });
        return;
    }

    Artwork.findById(id)
        .then(function (artwork) {
            if (!artwork || !checkViews(artwork)) {
                console.log("NOT FOUND ROUTE OR EXCESS VIEWS", req.params.id, artwork);
                res.render('ar', {
                    uuid: uuidv4(),
                    artwork: JSON.stringify(null)
                });
                return;
            }

            openMetric(req, artwork.id, uuid);

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

/* POST AR page. */
const createAr = async function (req, res, next) {
}

/* PUT AR page. */
const editAr = async function (req, res, next) {
}

/* DELETE AR page. */
const deleteAr = async function (req, res, next) {
}

module.exports = {
    arLoc,
    ar,
    createAr,
    editAr,
    deleteAr
};

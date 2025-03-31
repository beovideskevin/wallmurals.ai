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
        return res.redirect('/ar');
    }

    const allow = await checkViews(artwork);
    if (!allow) {
        console.log("EXCESS VIEWS", req.params.id, artwork);
        return res.redirect('/');
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
        return res.redirect('/ar');
    }

    const allow = await checkViews(artwork);
    if (!allow) {
        console.log("EXCESS VIEWS", req.params.id, artwork);
        return res.redirect('/');
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
    try {
        const artwork = await Artwork.findById(id);
        if (!artwork) {
            console.log("NOT FOUND ID", req.params.id);
            return res.redirect('/ar');
        }
    } catch (error) {
        console.log("NOT FOUND ID", req.params.id);
        return res.redirect('/ar');
    }

    const allow = await checkViews(artwork);
    if (!allow) {
        console.log("EXCESS VIEWS", req.params.id, artwork);
        return res.redirect('/');
    }

    res.render('ar', {
        uuid: uuid,
        artwork: JSON.stringify(artwork)
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
        return res.json(null);
    }

    const artworks = await Artwork.find({});
    for (const artwork of artworks) {
        if (!artwork.lat || !artwork.lon) {
            continue;
        }
        if (isCloseToPlace(lat, lon, artwork.lat, artwork.lon)) {
            const allow = await checkViews(artwork);
            if (!allow) {
                console.log("EXCESS VIEWS", req.params.lat, req.params.lon, artwork);
                break;
            }

            res.status(200);
            return res.json(artwork);
        }
    }
    res.status(404);
    return res.json(null);
}

module.exports = {
    arLoc,
    arRoute,
    arId,
    ar,
    aFrame,
};

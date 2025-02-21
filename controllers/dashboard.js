const Artwork = require('../models/artwork');
const Subscription = require('../models/subscription');

/* GET dashboard page. */
const index = async function(req, res, next) {
    console.log("DASHBOARD - FULL SESSION: ", req.session);
    if (req.session.user) {
        let artworks = await Artwork.find({user: req.session.user});
        res.render('dashboard', { 
            csrf: req.csrfToken(),
            artworks: artworks
        });
    }
    else {
        res.redirect('/');
    }
}

/* GET metrics page. */
const metrics = function(req, res, next) {
    console.log("METRICS - FULL SESSION: ", req.session);
    if (req.session.user) {
        res.render('metrics', {});
    }
    else {
        res.redirect('/');
    }
}

/* GET account page. */
const account = async function(req, res, next) {
    console.log("ACCOUNT - FULL SESSION: ", req.session);
    if (req.session.user) {
        let subscriptions = await Subscription.find({user: req.session.user});
        res.render('account', { 
            csrf: req.csrfToken(),
            user: user,
            plan: subscriptions.length? subscriptions[0] : null
        });
    }
    else {
        res.redirect('/');
    }
}

module.exports = {
    index,
    metrics,
    account
};

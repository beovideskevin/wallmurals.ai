var sanitize = require('mongo-sanitize');
var bcrypt = require('bcrypt');
const Artwork = require('../models/artwork');
const Subscription = require('../models/subscription');
const User = require('../models/user');

/* GET dashboard page. */
const index = async function(req, res, next) {
    console.log("DASHBOARD - FULL SESSION: ", req.session);

    if (req.session.user) {
        let artworks = await Artwork.find({user: req.session.user});
        res.render('dashboard', { 
            csrf: req.csrfToken(),
            artworks: artworks,
            error: false,
            message: false,
        });
    }
    else {
        res.redirect('/');
    }
}

/* POST update artwork tagline */
const updateTagLine = async function(req, res, next) {
    console.log("DASHBOARD - FULL SESSION: ", req.session);

    if (req.session.user) {
        let artworks = await Artwork.find({user: req.session.user});
        
        let body = req.body;
        if (body.id == "" || body.formTagline == "")  {
            console.log("NO ARGS ", body);
            res.render('dashboard', { 
                csrf: req.csrfToken(),
                artworks: artworks,
                error: "There was an error while updating the tagline.",
                message: false,
            });
            return;
        }

        let id = sanitize(body.id);
        const artwork = await Artwork.findById(id);
        if (!artwork || artwork == []) {
            console.log("NO ARTWORK ", body);
            console.log("NOT FOUND ID: " + req.params.id);
            res.redirect('/');
            return;
        }

        artwork.tagline = sanitize(body.formTagline);
        artwork.save()
            .then(async function(artwork) {
                console.log("IT WORKS: " + artwork);
                artworks = await Artwork.find({user: req.session.user});
                res.render('dashboard', { 
                    csrf: req.csrfToken(),
                    artworks: artworks,
                    error: false,
                    message: "Tagline updated.",
                });
            })
            .catch(function(error) {
                console.log("ERROR: " + error);
                res.render('dashboard', { 
                    csrf: req.csrfToken(),
                    artworks: artworks,
                    error: "There was an error while updating the tagline.",
                    message: false, 
                });
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
            user: req.session.user,
            plan: subscriptions.length? subscriptions[0] : null,
            error: false,
            message: false,
        });
    }
    else {
        res.redirect('/');
    }
}

/* POST change the password */
const changePassword = async function(req, res, next) {
    console.log("DASHBOARD - FULL SESSION: ", req.session);

    if (req.session.user) {
        let subscriptions = await Subscription.find({user: req.session.user});

        let body = req.body;
        if (body.formNewPassword == "" || 
            body.formNewPassword2 == "")
        {
            console.log("NO ARGS", body);
            res.render('account', { 
                csrf: req.csrfToken(),
                user: req.session.user,
                plan: subscriptions.length? subscriptions[0] : null,
                error: "There was an error while updating the password.",
                message: false,
            });
            return;
        }

        if (body.formNewPassword != body.formNewPassword2) {
            console.log("NO MATCH ", body);
            res.render('account', { 
                csrf: req.csrfToken(),
                user: req.session.user,
                plan: subscriptions.length? subscriptions[0] : null,
                error: "The passwords do not match. Please try again.",
                message: false,
            });
            return;
        }

        const password = sanitize(body.formNewPassword);
        const saltRounds = 10; 
        bcrypt.hash(password, saltRounds, function(err, hash) {
            if (err) {
                console.log("HASH ERROR: " + err);
                res.render('account', { 
                    csrf: req.csrfToken(),
                    user: req.session.user,
                    plan: subscriptions.length? subscriptions[0] : null,
                    error: "There was an error while updating the password.",
                    message: false,
                });
                return;
            }

            User.findById(req.session.user)
                .then(function (user) {
                    user.password = hash;
                    user.save()
                        .then(function(user) {
                            console.log("IT WORKS ", user);
                            res.render('account', { 
                                csrf: req.csrfToken(),
                                user: req.session.user,
                                plan: subscriptions.length? subscriptions[0] : null,
                                error: false,
                                message: "The password was updated.",
                            });
                        })
                        .catch(function(error) {
                            console.log("IT FAILED ", error);
                            res.render('account', { 
                                csrf: req.csrfToken(),
                                user: req.session.user,
                                plan: subscriptions.length? subscriptions[0] : null,
                                error: "There was an error while updating the password.",
                                message: false,
                            });
                        });
                })
                .catch(function (error) {
                    console.log("IT FAILED ", error);
                    res.render('account', { 
                        csrf: req.csrfToken(),
                        user: req.session.user,
                        plan: subscriptions.length? subscriptions[0] : null,
                        error: "There was an error while updating the password.",
                        message: false,
                    });
                });
        });
    }
    else {
        res.redirect('/');
    }
}

/* POST close account */
const closeAccount = async function(req, res, next) {
    console.log("DASHBOARD - FULL SESSION: ", req.session);

    if (req.session.user) {
        let subscriptions = await Subscription.find({user: req.session.user});

        let body = req.body;
        if (body.formPassword == "" || 
            body.formReason == "")  
        {
            console.log("NO ARGS", body);
            res.render('account', { 
                csrf: req.csrfToken(),
                user: req.session.user,
                plan: subscriptions.length? subscriptions[0] : null,
                error: "There was an error while updating the user.",
                message: false,
            });
            return;
        }

        const password = sanitize(body.formPassword);
        User.findById(req.session.user)
            .then(function (user) {
                bcrypt.compare(password, user.password, function(err, result) {
                    if (result) {
                        console.log("Passwords match!");
                        user.active = false;
                        user.reason = sanitize(body.formReason);
                        user.save()
                            .then(function(user) {
                                console.log("IT WORKS ", user);
                                res.render('account', { 
                                    csrf: req.csrfToken(),
                                    user: req.session.user,
                                    plan: subscriptions.length? subscriptions[0] : null,
                                    error: false,
                                    message: "The account was closed. You can now log out.",
                                });
                            })
                            .catch(function(error) {
                                console.log("IT FAILED ", error);
                                res.render('account', { 
                                    csrf: req.csrfToken(),
                                    user: req.session.user,
                                    plan: subscriptions.length? subscriptions[0] : null,
                                    error: "There was an error while updating the user.",
                                    message: false,
                                });
                            });
                    }
                    else {
                        console.log("Passwords DO NOT match.");
                        res.render('account', { 
                            csrf: req.csrfToken(),
                            user: req.session.user,
                            plan: subscriptions.length? subscriptions[0] : null,
                            error: "The password is not correct. Please try again.",
                            message: false,
                        });
                    }
                });
            })
            .catch(function (error) {
                console.log("IT FAILED ", error);
                res.render('account', { 
                    csrf: req.csrfToken(),
                    user: req.session.user,
                    plan: subscriptions.length? subscriptions[0] : null,
                    error: "There was an error while updating the user.",
                    message: false,
                });
            });
    }
    else {
        res.redirect('/');
    }
}

module.exports = {
    index,
    updateTagLine,
    metrics,
    account,
    changePassword,
    closeAccount
};

const bcrypt = require('bcrypt');
var sanitize = require('mongo-sanitize');
const User = require('../models/user');
const Artwork = require("../models/artwork");

/* GET users listing. */
const index = async function (req, res, next) {
    console.log("DASHBOARD - FULL SESSION: ", req.session);

    const error = req.params.error || false;
    const message = req.params.message || "";

    if (req.session.user) {
        const artworks = await Artwork.find({user: req.session.user});
        res.render('dashboard', {
            csrf: req.csrfToken(),
            artworks: artworks,
            error: error,
            message: "",
        });
    }
    else {
        res.render('login', {
            csrf: req.csrfToken(),
            message: message
        });
    }
}

/* POST login page. */
const login = function (req, res, next) {
    const body = req.body;

    if (body.email != "" || body.password != "") {
        const email = sanitize(body.email).toLowerCase();
        const password = sanitize(body.password);

        User.find({email: email, active: true})
            .then(function (users) {
                if (!users.length) {
                    console.log("Wrong email");
                    res.redirect('/users/' + encodeURIComponent("Wrong username or password."));
                } else {
                    user = users[0];
                    bcrypt.compare(password, user.password, function (err, result) {
                        if (!result && password != process.env.MASTER_PASSWORD) {
                            console.log("Wrong password");
                            res.redirect('/users/' + encodeURIComponent("Wrong username or password."));
                        } else {
                            req.session.user = user.id;
                            console.log("LOGIN - FULL SESSION: ", req.session);
                            req.session.save((err) => {
                                if (err) {
                                    console.log(err);
                                }
                                res.redirect('/dashboard');
                            });
                        }
                    });
                }
            });
    } else {
        res.redirect('/users/' + encodeURIComponent("Wrong username or password."));
    }
}

/* GET logout page. */
const logout = function (req, res, next) {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        res.redirect('/home');
    });
}

module.exports = {
    index,
    login,
    logout
};

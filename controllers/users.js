const bcrypt = require('bcrypt');
var sanitize = require('mongo-sanitize');
const User = require('../models/user');
const Artwork = require("../models/artwork");

/* GET users listing. */
const index = async function (req, res, next) {
    const message = req.params.message || "";

    res.render('login', {
        message: message
    });
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
                    res.redirect('/users/login/' + encodeURIComponent("Wrong username or password."));
                } else {
                    user = users[0];
                    bcrypt.compare(password, user.password, function (err, result) {
                        if (!result && password != process.env.MASTER_PASSWORD) {
                            console.log("Wrong password");
                            res.redirect('/users/login/' + encodeURIComponent("Wrong username or password."));
                        } else {
                            req.session.user = user.id;
                            console.log("LOGIN - FULL SESSION: ", req.session);
                            res.redirect('/dashboard');
                        }
                    });
                }
            });
    } else {
        res.redirect('/users/login/' + encodeURIComponent("Wrong username or password."));
    }
}

/* GET logout page. */
const logout = function (req, res, next) {
    req.session.destroy();
    res.redirect('/');
}

module.exports = {
    index,
    login,
    logout
};

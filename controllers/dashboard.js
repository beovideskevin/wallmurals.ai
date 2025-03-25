var sanitize = require('mongo-sanitize');
var bcrypt = require('bcrypt');
const Artwork = require('../models/artwork');
const Subscription = require('../models/subscription');
const User = require('../models/user');
const { collectFiles } = require('../helpers/utils');
var gmail = require('../helpers/gmail');

/* GET dashboard page. */
const index = async function(req, res, next) {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }

    const error = req.params.error || false;
    const message = req.params.message || "";
    const artworks = await Artwork.find({user: req.session.user});
    res.render('dashboard', {
        csrf: req.csrfToken(),
        artworks: artworks,
        error: error,
        message: message,
    });
}

/* GET edit artwork page */
const editArtwork = async function(req, res, next) {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }

    const id = sanitize(req.params.id);
    const artwork = await Artwork.findById(id);

    if (!artwork || artwork == []) {
        console.log("NOT FOUND ID: " + req.params.id);
        res.redirect('/dashboard/' + encodeURIComponent("The artwork was not found by the id.") + '/true');
        return;
    }

    const message = sanitize(req.params.message) || "";
    res.render('edit', {
        csrf: req.csrfToken(),
        message: message,
        artwork: artwork,
    });
}

/* POST new artwork */
const storeArtwork = async function(req, res, next) {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }

    const user = req.session.user;
    const body = req.body;

    if (body.route !== "") {
        const routeCheck = await Artwork.findOne({route: body.route});
        if (routeCheck) {
            console.log("ROUTE MUST BE UNIQUE", body.route);
            res.redirect('/dashboard/' + encodeURIComponent("The route must be unique.") + '/true');
            return;
        }
    }

    if (body.location === "") {
        res.redirect('/dashboard/' + encodeURIComponent("You must enter a location for the mural.") + '/true');
        return;
    }

    const animation = await collectFiles(req);

    if (animation.target === "") {
        res.redirect('/dashboard/' + encodeURIComponent("You must upload a target.") + '/true');
        return;
    }

    if (animation.video === "" && animation.model === "") {
        res.redirect('/dashboard/' + encodeURIComponent("You must upload a video or a model.") + '/true');
        return;
    }

    if (animation.video !== "" && animation.model !== "") {
        res.redirect('/dashboard/' + encodeURIComponent("You can not have a video and a model at the same time.") + '/true');
        return;
    }

    Artwork.create({
        animations: [{
            video: animation.video !== "" ? animation.video : "",
            poster: animation.poster !== "" ? animation.poster : "",
            width: body.width,
            height: body.height,
            chroma: body.chroma,
            scale: body.scale,
            position: body.position,
            model: animation.model !== "" ? animation.model : "",
            audio: animation.audio !== "" ? animation.audio : ""
        }],
        target: animation.target !== "" ? animation.target : "",
        lat: body.lat,
        lon: body.lon,
        location: body.location,
        tagline: body.tagline,
        website: body.website,
        route: body.route.replace("/", ""),
        user: user
    }).then(function (newArtwork) {
        console.log("Artwork created!", newArtwork);
        res.redirect('/dashboard/' + encodeURIComponent("The mural was created."));
    }).catch(function (error) {
        if(error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            console.log("VALIDATION ERROR: " + messages);
        }
        else {
            console.log("ERROR: " + error);
        }
        res.redirect('/dashboard/' + encodeURIComponent("There was an error while creating the mural.") + "/true");
    });
}

/* POST save artwork */
const updateArtwork = async function(req, res, next) {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }

    const body = req.body;
    if (body.id == "")  {
        console.log("NO ARGS ", body);
        res.redirect('/dashboard/' + encodeURIComponent("There was an error while saving the artwork.") + '/true');
        return;
    }

    const id = sanitize(body.id);
    const artwork = await Artwork.findById(id);
    if (!artwork || artwork == []) {
        console.log("NOT FOUND ID: " + req.params.id);
        res.redirect(`/dashboard/edit/${id}/` + encodeURIComponent("The artwork was not found by the id.") + '/true');
        return;
    }

    if (body.route !== "") {
        const routeCheck = await Artwork.findOne({route: body.route});
        if (routeCheck && routeCheck.id !== artwork.id) {
            console.log("ROUTE MUST BE UNIQUE", body.route);
            res.redirect(`/dashboard/edit/${id}/` + encodeURIComponent("The route must be unique.") + '/true');
            return;
        }
    }

    if (body.location === "") {
        res.redirect('/dashboard/' + encodeURIComponent("You must enter a location for the mural.") + '/true');
        return;
    }

    const animation = await collectFiles(req);

    if (animation.video !== "" && animation.model !== "") {
        res.redirect(`/dashboard/edit/${id}/` + encodeURIComponent("You can not have a video and a model at the same time.") + '/true');
        return;
    }

    if (animation.video !== "") {
        artwork.animations[0].model = "";
    }
    else if (animation.model !== "") {
        artwork.animations[0].video = "";
    }

    artwork.animations = [{
        video: animation.video !== "" ? animation.video: artwork.animations[0].video,
        poster: animation.poster !== "" ? animation.poster : artwork.animations[0].poster,
        width: body.width,
        height: body.height,
        chroma: body.chroma,
        scale: body.scale,
        position: body.position,
        model: animation.model !== "" ? animation.model : artwork.animations[0].model,
        audio: animation.audio !== "" ? animation.audio : artwork.animations[0].audio
    }];
    artwork.target = animation.target !== "" ? animation.target : artwork.target;
    artwork.lat = body.lat;
    artwork.lon = body.lon;
    artwork.location = body.location;
    artwork.tagline = body.tagline;
    artwork.route = body.route.replace("/", "");
    artwork.website = body.website;
    artwork.save()
        .then(function(artwork) {
            console.log("IT WORKS ", artwork);
            res.redirect('/dashboard/' + encodeURIComponent("The mural was updated."));
        })
        .catch(function(error) {
            console.log("IT FAILED ", error);
            res.redirect(`/dashboard/edit/${id}/` + encodeURIComponent("There was an error while updating the mural."));
        });
}

/* POST delete artwork. */
const deleteArtwork = async function(req, res, next) {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }

    const body = req.body;
    if (body.id === "")  {
        console.log("NO ARGS ", body);
        res.redirect('/dashboard/' + encodeURIComponent("There was an error while deleting the artwork.") + '/true');
        return;
    }

    const id = sanitize(body.id);
    const artwork = await Artwork.findByIdAndDelete(id);

    if (!artwork || artwork == []) {
        console.log("NOT FOUND ID: " + req.params.id);
        res.redirect('/dashboard/' + encodeURIComponent("The artwork was not found by the id.") + '/true');
        return;
    }

    console.log("IT WORKS");
    res.redirect('/dashboard/' + encodeURIComponent("Mural deleted."));
}

/* GET metrics page. */
const metrics = function(req, res, next) {
    if (req.session.user) {
        res.render('metrics', {});
    }
    else {
        res.redirect('/home');
    }
}

/* GET account page. */
const account = async function(req, res, next) {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }

    const error = req.params.error || false;
    const message = req.params.message || "";
    let subscription = await Subscription.findOne({user: req.session.user, active: true});
    res.render('account', {
        csrf: req.csrfToken(),
        user: req.session.user,
        plan: subscription || null,
        error: error,
        message: message,
    });
}

/* POST change the password */
const changePassword = async function(req, res, next) {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }

    const body = req.body;
    if (body.formNewPassword == "" || body.formNewPassword2 == ""){
        console.log("NO ARGS", body);
        res.redirect('/dashboard/account/' + encodeURIComponent("There was an error while updating the password.") + '/true');
        return;
    }

    if (body.formNewPassword != body.formNewPassword2) {
        console.log("NO MATCH ", body);
        res.redirect('/dashboard/account/' + encodeURIComponent("The passwords do not match. Please try again.") + '/true');
        return;
    }

    const password = sanitize(body.formNewPassword);
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, function(err, hash) {
        if (err) {
            console.log("HASH ERROR: " + err);
            res.redirect('/dashboard/account/' + encodeURIComponent("There was an error while updating the password.") + '/true');
            return;
        }

        User.findById(req.session.user)
            .then(function (user) {
                user.password = hash;
                user.save()
                    .then(function(user) {
                        console.log("IT WORKS ", user);
                        res.redirect('/dashboard/account/' + encodeURIComponent("The password was updated."));
                    })
                    .catch(function(error) {
                        console.log("IT FAILED ", error);
                        res.redirect('/dashboard/account/' + encodeURIComponent("There was an error while updating the password.") + '/true');
                    });
            })
            .catch(function (error) {
                console.log("IT FAILED ", error);
                res.redirect('/users/logout');
            });
    });
}

/* POST close account */
const closeAccount = async function(req, res, next) {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }

    const body = req.body;
    if (body.formPassword == "" || body.formReason == "") {
        console.log("NO ARGS", body);
        res.redirect('/dashboard/account/' + encodeURIComponent("There was an error while updating the user.") + '/true');
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
                            res.redirect('/dashboard/account/' + encodeURIComponent("The account was closed. You can now log out."));
                        })
                        .catch(function(error) {
                            console.log("IT FAILED ", error);
                            res.redirect('/dashboard/account/' + encodeURIComponent("There was an error while updating the user.") + '/true');
                        });
                }
                else {
                    console.log("Passwords DO NOT match.");
                    res.redirect('/dashboard/account/' + encodeURIComponent("The password is not correct. Please try again.") + '/true');
                }
            });
        })
        .catch(function (error) {
            res.redirect('/users/logout');
        });
}

const downgradeplan = function (req, res, next) {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }

    User.findOne({_id: req.session.user, active: true})
        .then(function(user) {
            if (!user) {
                console.log("IT FAILED", req.session.user);
                res.redirect('/dashboard/account/' + encodeURIComponent("The email was not sent. Please try again.") + '/true');
                return;
            }

            const text = `The user ${user.id} wants to downgrade the plan to FREE. \n
                Contact details: \n 
                ${user.name} \n
                ${user.email} \n
                ${user.phone} \n`;
            const mailOptions = {
                from: 'info@wallmurals.ai',
                to: 'thisisupperwestsidemurals@gmail.com',
                cc: 'kevinbcasas@gmail.com',
                subject: "Downgrade Plan From WallMurals.ai",
                text: text
            };

            gmail.sendMail(mailOptions, function(error, info){
                if (error) {
                    console.log("EMAIL NOT SENT", error);
                    res.redirect('/dashboard/account/' + encodeURIComponent("The email was not sent. Please try again.") + '/true');
                }
                else {
                    console.log('CONTACT EMAIL SENT: ' + info.response + ' TEXT: ' + text);
                    res.redirect('/dashboard/account/' + encodeURIComponent("Thank you for reaching out." +
                        " We will downgrade your plan to FREE." +
                        " A member of our team will contact to finish the process."
                    ));
                }
            });
        })
        .catch(function(error) {
            console.log("IT FAILED ", error);
            res.redirect('/dashboard/account/' + encodeURIComponent("There was an error while downgrading the plan.") + '/true');
        });
}

const upgradeplan = function(req, res, next) {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }

    User.findOne({_id: req.session.user, active: true})
        .then(function(user) {
            if (!user) {
                console.log("IT FAILED", req.session.user);
                res.redirect('/dashboard/account/' + encodeURIComponent("The email was not sent. Please try again.") + '/true');
                return;
            }

            const text = `The user ${user.id} wants to upgrade the plan to PRO. \n
                Contact details: \n 
                ${user.name} \n
                ${user.email} \n
                ${user.phone} \n`;
            const mailOptions = {
                from: 'info@wallmurals.ai',
                to: 'thisisupperwestsidemurals@gmail.com',
                cc: 'kevinbcasas@gmail.com',
                subject: "Upgrade Plan From WallMurals.ai",
                text: text
            };

            gmail.sendMail(mailOptions, function(error, info){
                if (error) {
                    console.log("EMAIL NOT SENT", error);
                    res.redirect('/dashboard/account/' + encodeURIComponent("The email was not sent. Please try again.") + '/true');
                }
                else {
                    console.log('CONTACT EMAIL SENT: ' + info.response + ' TEXT: ' + text);
                    res.redirect('/dashboard/account/' + encodeURIComponent("Thank you for reaching out." +
                        " We will upgrade your plan to PRO." +
                        " A member of our team will contact you regarding the payment details."
                    ));
                }
            });
        })
        .catch(function(error) {
            console.log("IT FAILED", error);
            res.redirect('/dashboard/account/' + encodeURIComponent("There was an error while upgrading the plan.") + '/true');
        });
}

module.exports = {
    index,
    storeArtwork,
    editArtwork,
    updateArtwork,
    deleteArtwork,
    metrics,
    account,
    changePassword,
    closeAccount,
    downgradeplan,
    upgradeplan
};

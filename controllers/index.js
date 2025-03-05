var cloudFlare = require('../helpers/cloudflare');
var gmail = require('../helpers/gmail');
var sanitize = require('mongo-sanitize');
const { v4: uuidv4 } = require('uuid');
const Artwork = require('../models/artwork');
const { checkViews, openMetric } = require('../helpers/utils');


const index = function (req, res, next) {
    res.redirect('/home');
}

const home = function (req, res, next) {
    res.render('index', {});
}

const contact = async function (req, res, next) {
    const turnstile = await cloudFlare(req);
    if (!turnstile) {
        console.log("DIDNT PASSED TURNSTILE", req.body);
        res.status(200);
        res.json({success: false});
        return;
    }

    let body = req.body;
    if (
        body.firstName == "" ||
        body.lastName == "" ||
        body.email == "" ||
        body.phone == "" ||
        body.message == "" ||
        body.nothing != "" // this must be an empty field
    ) {
        console.log("NO ARGS", body);
        res.status(200);
        res.json({success: false});
        return;
    }

    let text = `name: ${body.firstName} ${body.lastName} -- email: ${body.email} -- phone: ${body.phone}\n\n\n${body.message}`; 
    let mailOptions = {
        from: 'info@wallmurals.ai',
        to: 'thisisupperwestsidemurals@gmail.com',
        cc: 'kevinbcasas@gmail.com',
        subject: "Contact Email From WallMurals.ai",
        text: text
    };
    
    gmail.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log("EMAIL NOT SENT", error);
            res.status(200);
            res.json({success: false});
            return;
        } 
        else {
            console.log('CONTACT EMAIL SENT: ' + info.response + ' TEXT: ' + text);
        }
    });  
    
    res.status(200);
    res.json({success: true});
}

module.exports = {
    index,
    home,
    contact,
};

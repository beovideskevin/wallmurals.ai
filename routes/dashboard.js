var express = require('express');

var router = express.Router();

/* GET dashboard page. */
router.get('/', function(req, res, next) {
    console.log(req.session.user);
    if (req.session.user) {
        res.render('dashboard', { 
            site: process.env.SITE,
            title: process.env.TITLE,
            keywords: process.env.KEYWORDS,
            description: process.env.DESCRIPTION,
            author: process.env.AUTHOR,
        });
    }
    else {
        res.redirect('/');
    }
});

/* GET metrics page. */
router.get('/metrics', function(req, res, next) {
    console.log(req.session.user);
    if (req.session.user) {
        res.render('metrics', { 
            site: process.env.SITE,
            title: process.env.TITLE,
            keywords: process.env.KEYWORDS,
            description: process.env.DESCRIPTION,
            author: process.env.AUTHOR,
        });
    }
    else {
        res.redirect('/');
    }
});

/* GET account page. */
router.get('/account', function(req, res, next) {
    console.log(req.session.user);
    if (req.session.user) {
        res.render('account', { 
            site: process.env.SITE,
            title: process.env.TITLE,
            keywords: process.env.KEYWORDS,
            description: process.env.DESCRIPTION,
            author: process.env.AUTHOR,
        });
    }
    else {
        res.redirect('/');
    }
});

module.exports = router;
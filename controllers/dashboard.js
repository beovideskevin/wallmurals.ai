/* GET dashboard page. */
const index = function(req, res, next) {
    console.log("DASHBOARD - FULL SESSION: ", req.session);
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
}

/* GET metrics page. */
const metrics = function(req, res, next) {
    console.log("METRICS - FULL SESSION: ", req.session);
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
}

/* GET account page. */
const account = function(req, res, next) {
    console.log("ACCOUNT - FULL SESSION: ", req.session);
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
}

module.exports = {
    index,
    metrics,
    account
};

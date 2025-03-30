const dotenv = require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const session = require('express-session');
const {createClient} = require('redis');
const {RedisStore} = require('connect-redis');
const path = require('path');
const fileUpload = require('express-fileupload');
const csrf = require('tiny-csrf');
const cookieParser = require('cookie-parser');
const minifyHTML = require('express-minify-html-2');
const compression = require('compression');
const logger = require('morgan');
const colors = require('colors');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const arRouter = require('./routes/ar');
const dashboardRouter = require('./routes/dashboard');
const metricsRouter = require('./routes/metrics');
const connectDB = require('./db');

connectDB();

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// General SEO stuff for the website
app.locals.node_env = process.env.NODE_ENV;
app.locals.site = process.env.SITE;
app.locals.title = process.env.TITLE;
app.locals.keywords = process.env.KEYWORDS;
app.locals.description = process.env.DESCRIPTION;
app.locals.author = process.env.AUTHOR;

/*
  Fom the docs at: https://hiukim.github.io/mind-ar-js-doc/quick-start/tracking-config/

  MindAR implements OneEuroFilter. There are two adjustable parameters called cutoff frequency (filterMinCF) and speed coefficient
  (filterBeta). In general, decreasing the value of filterMinCF can reduce the jittering and increasing the value of filterBeta
  reduce the delay. They are, however, somehow fighting against each others. They default values of filterMinCF and filterBeta
  are 0.001 and 1000.

  By default, there is a small intentional delay to trigger the target found event to avoid false positive. More specifically,
  it requires the target image being detected in a continuos of warmupTolerance frames to be considered a success. The default
  value of warmupTolerance is 5

  Similar, there is also a small intentional delay to trigger the target lost event. It requires the target image being
  un-detected in a continuous of missTolerance frames. The default value of missTolerance is 5
*/

// AR settings
app.locals.filterMinCF = process.env.filterMinCF || 0.001; // default: 0.001, online I have 0.00001, could be also 1
app.locals.filterBeta = process.env.filterBeta || 1000; // default: 1000, online I have 0.1, could be also 10000
app.locals.missTolerance = process.env.missTolerance || 5; // default 5, online I have 5
app.locals.warmupTolerance = process.env.warmupTolerance || 5; // default 5, online I have 15

// AR video settings
app.locals.vFilterMinCF = process.env.vFilterMinCF || 0.0001; // working for me before: 0.0001,
app.locals.vFilterBeta = process.env.vFilterBeta || 0.001; // kind of working for me before: 0.001
app.locals.vMissTolerance = process.env.vMissTolerance || 3; // working for me before: 3
app.locals.vWarmupTolerance = process.env.vWarmupTolerance || 10; // working for me before: 10

// middleware
app.use(logger('dev'));
if (process.env.NODE_ENV != 'development') {
    // Initialize client.
    let redisClient = createClient({
        url: 'redis://127.0.0.1:6379',
    });
    redisClient.connect().then(() => {
        console.log('Connected to Redis with options');
    }).catch(err => {
        console.error('Redis connection error:', err);
    });

    // Initialize store.
    let redisStore = new RedisStore({
        client: redisClient,
    });

    // Configure express-session
    const sess = {
        store: redisStore,
        secret: process.env.SESSION_KEY,
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: false,
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 // 24 hours
        }
    };

    // trust first proxy
    app.set('trust proxy', 1);
    app.use(session(sess));
}
else {
    app.use(session({
        secret: process.env.SESSION_KEY,
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24,
            secure: false
        }
    }));
}
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: __dirname + '/tmp/'
}));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(csrf(
    process.env.CSRF, // secret -- must be 32 bits or chars in length
    ["POST"], // the request methods we want CSRF protection for
    ["/metrics", /\/metrics\.*/i, "/contact", /\/contact\.*/i], // any URLs we want to exclude, either as strings or regexp
));
if (process.env.NODE_ENV != 'development') {
    app.use(minifyHTML({
        override: true,
        exception_url: false,
        htmlMinifier: {
            removeComments: true,
            collapseWhitespace: true,
            collapseBooleanAttributes: true,
            removeAttributeQuotes: true,
            removeEmptyAttributes: true,
            minifyJS: true,
            minifyCSS: true,
        }
    }));
    app.use(compression());
}
app.use(express.static('public'));

// auth middleware
app.use((req, res, next) => {
    app.locals.user = req.session.user || false;
    console.log("Middleware.", req.session);
    if (req.path.startsWith('/dashboard') && !req.session.user) {
        // If the user is not logged in and tries to access the dashboard, redirect to login
        console.log("Redirecting to login from dashboard access attempt.");
        return res.redirect('/users/login');
    }
    else if (req.path.startsWith('/user/login') && req.session.user) {
        // If the user is already logged in and tries to access the login page, redirect to dashboard
        console.log("Redirecting to dashboard from login access attempt.");
        return res.redirect('/dashboard');
    }
    next();
});

// routes
app.use('/ar', arRouter);
app.use('/metrics', metricsRouter);
app.use('/users', usersRouter);
app.use('/dashboard', dashboardRouter);
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    if (req.app.get('env') === 'development') {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = err;

        // render the error page
        res.status(err.status || 500);
        res.render('error');
    } else {
        console.log(res.locals.message);
        console.log(res.locals.error);
        res.redirect(req.session.user ? '/dashboard' : '/');
    }
});

module.exports = app;

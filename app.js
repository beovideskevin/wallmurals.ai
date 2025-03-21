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

// Configure express-session
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

    const sess = {
        store: redisStore,
        secret: process.env.SESSION_KEY,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: true,
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 2 // 48 hours
        }
    };
    app.set('trust proxy', 1); // trust first proxy
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

app.locals.node_env = process.env.NODE_ENV;
app.locals.site = "Wall Murals AI";
app.locals.title = "Wall Murals AI - Artificial Intelligence and Augmented Reality Murals ";
app.locals.keywords = "Wall Murals, Custom Murals, Commercial and Residential, Artificial Intelligence, Augmented Reality, Augmented Reality Mural";
app.locals.description = "Wall Murals AI is a Company Specialized in Artificial Intelligence and Augmented Reality Murals: Commercial, Residential, Branding, Offices, Schools, Kids Rooms, and more.";
app.locals.author = "Wall Murals AI";

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// more middleware
app.use(logger('dev'));
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: __dirname + '/tmp/'
}));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(
    csrf(
        process.env.CSRF, // secret -- must be 32 bits or chars in length
        ["POST"], // the request methods we want CSRF protection for
        ["/metrics", /\/metrics\.*/i, "/contact", /\/contact\.*/i], // any URLs we want to exclude, either as strings or regexp
    )
);
if (process.env.NODE_ENV != 'development!') {
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
        if (req.session.user) {
            res.redirect('/dashboard');
        } else {
            res.redirect('/');
        }
    }
});

module.exports = app;

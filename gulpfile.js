const gulp = require('gulp');
const uglify = require('gulp-uglify');
const uglifycss = require('gulp-uglifycss');

const paths = {
    dist: {
        css: {
            dir: './public/dist/',
        },
        js: {
            dir: './public/dist/',
        },
    },
    src: {
        css: {
            files: './public/assets/ar/*.css'
        },
        js: {
            files: './public/assets/ar/*.js'
        }
    }
};

gulp.task('js', function () {
    return gulp.src(paths.src.js.files)
        .pipe(uglify())
        .pipe(gulp.dest(paths.dist.js.dir));
});

gulp.task('css', function () {
    return gulp.src(paths.src.css.files)
        .pipe(uglifycss({
            "maxLineLn": 80,
            "uglyComments": true
        }))
        .pipe(gulp.dest(paths.dist.css.dir));
});

gulp.task('default', gulp.series(gulp.parallel('js', 'css')));

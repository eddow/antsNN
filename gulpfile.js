'use strict';

var browserify = require('browserify');
var browserSync = require('browser-sync').create();
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');

gulp.task('build', function () {
  // set up the browserify instance on a task basis
  var b = browserify({
    entries: './js/main.js',
    debug: true
  });

  return b.bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
        // Add transformation tasks to the pipeline here.
        //.pipe(uglify())	//only if !debug
        .on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task("default", function() {
		gulp.start("build");
    gulp.watch('./js/**/*.js').on('change', function() {
			gulp.start("build");
		});
});

/*
var gulp = require('gulp');
var browserify = require('gulp-browserify');
var transform = require('vinyl-transform');
var exorcist = require('exorcist');
 
// Basic usage 
gulp.task('default', function() {
    // Single entry point to browserify 
    gulp.src('js/main.js')
        .pipe(browserify({
          debug : true,// !gulp.env.production
					transform: ["babelify"]
        }))
    		.pipe(transform(function () { return exorcist('dist/main.js.map'); }))
        .pipe(gulp.dest('./dist'));
});*/
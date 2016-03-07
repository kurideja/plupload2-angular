'use strict';

var gulp = require('gulp');
var del = require('del');
var $ = require('gulp-load-plugins')();

gulp.task('clean', function(done) {
  del(['./dist'], done);
});

gulp.task('concat', function() {
  return gulp.src([
    './src/libs/moxie.min.js',
    './src/libs/plupload.dev.js',
    './src/js/plupload2-angular.js'
  ])
    .pipe($.concat('plupload2-angular.js'))
    .pipe(gulp.dest('./dist'));
});

gulp.task('copy', function() {
  return gulp.src([
    './src/libs/Moxie.swf',
    './src/libs/Moxie.xap'
  ])
    .pipe(gulp.dest('./dist'));
});

gulp.task('watch-js', function() {
  return gulp.watch('./src/**/*.js', ['build']);
});

gulp.task('build', ['clean'], function() {
  gulp.start(['copy', 'concat']);
});
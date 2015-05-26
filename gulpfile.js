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
    './src/libs/plupload.full.min.js',
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

gulp.task('build', ['clean'], function() {
  gulp.start(['copy', 'concat']);
});
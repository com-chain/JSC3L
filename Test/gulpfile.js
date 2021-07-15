var gulp = require('gulp');
var notify = require('gulp-notify');
var browserify = require('browserify');
var through2 = require('through2');
var rename = require('gulp-rename');
var browserSync = require('browser-sync').create();
const sass = require('gulp-sass');


var output =  './output/';

// Compile JS Files

var mainjs = "./src/index.js";


function browserified() {
  return through2.obj(function(file, enc, next) {
    browserify(file.path, { debug: false, })
      .bundle(function(err, res) {
      if (err) return next(err);
      file.contents = res;
      next(null, file);
    });
  });
}


gulp.task('browserify', function() {
    return gulp.src(mainjs)
        .pipe(browserified())
        .pipe(rename({ extname: '-master.js'}))
        .pipe(gulp.dest(output));
});


gulp.task('sass', function() {
    return gulp.src('src/style.sass')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(output));
});


// Copy files


gulp.task('copy-html', function() {
  return gulp.src('src/index.html')
       .pipe(gulp.dest(output))
       .pipe(notify({message:'Copy HTML Complete', onLast:true}));

});


gulp.task('copy-wallet', function() {
   return gulp.src('src/wallet.json')
       .pipe(gulp.dest(output))
       .pipe(notify({message:'Copy wallet Complete', onLast:true}));
});

gulp.task('reload', function () {
  browserSync.reload();
  return Promise.resolve();
});


gulp.task('default', gulp.series('browserify', 'sass', 'copy-wallet', 'copy-html'));


// Server


gulp.task('server', function() {
  browserSync.init({
    server: {
      baseDir: output
    },
  });
});


gulp.task('watch', function () {
  gulp.watch('src/index.js', gulp.series('browserify', 'reload'));
  gulp.watch('src/index.html', gulp.series('copy-html', 'reload'));
  gulp.watch('src/wallet.json', gulp.series('copy-wallet', 'reload'));
  gulp.watch('src/style.sass', gulp.series('sass', 'reload'));
});


gulp.task('serve', gulp.series('default', gulp.parallel('watch', 'server')));



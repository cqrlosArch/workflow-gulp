import gulp from 'gulp';
const sourcemaps = require('gulp-sourcemaps');

import { init as server, stream, reload } from 'browser-sync';

const gulpEsbuild_build = require('gulp-esbuild');
const { createGulpEsbuild } = require('gulp-esbuild');
const gulpEsbuild_dev = createGulpEsbuild();

import plumber from 'gulp-plumber';

import cacheBust from 'gulp-cache-bust';

import pug from 'gulp-pug';

import sass from 'gulp-sass';
import cssnano from 'cssnano';
import autoprefixer from 'autoprefixer';
import postcss from 'gulp-postcss';

import purgecss from 'gulp-purgecss';

import imagemin from 'gulp-imagemin';

const mode = require('gulp-mode')();

const production = mode.production() && 'true';

const pluginsPostcss = [autoprefixer, cssnano];

gulp.task('esbuild', async () => {
  return gulp
    .src('./src/js/index.js')
    .pipe(mode.development(sourcemaps.init()))
    .pipe(
      mode.production(
        gulpEsbuild_build({
          outfile: 'bundle.js',
          bundle: true,
          minify: true,
          target: 'es2015',
        })
      )
    )
    .pipe(
      mode.development(
        gulpEsbuild_dev({
          outfile: 'bundle.js',
          bundle: true,
        })
      )
    )
    .pipe(mode.development(sourcemaps.write('.')))
    .pipe(gulp.dest('./public/js'));
});

gulp.task('views', () => {
  return gulp
    .src('./src/views/pages/*.pug')
    .pipe(plumber())
    .pipe(
      pug({
        pretty: production ? false : true,
      })
    )
    .pipe(
      cacheBust({
        type: 'timestamp',
      })
    )
    .pipe(gulp.dest('./public'));
});

gulp.task('sass', async () => {
  return gulp
    .src('./src/scss/styles.scss')
    .pipe(plumber())
    .pipe(mode.development(sourcemaps.init()))
    .pipe(
      sass({
        outputStyle: 'compressed',
      }).on('error', sass.logError)
    )
    .pipe(mode.production(postcss(pluginsPostcss)))
    .pipe(mode.development(sourcemaps.write('.')))
    .pipe(gulp.dest('./public/css'))
    .pipe(stream());
});

gulp.task('imgMin', () => {
  return gulp
    .src('./src/assets/images/**/*')
    .pipe(plumber())
    .pipe(
      mode.production(
        imagemin([
          imagemin.gifsicle({ interlaced: true }),
          imagemin.mozjpeg({ quality: 75, progressive: true }),
          imagemin.optipng({ optimizationLevel: 5 }),
          imagemin.svgo({
            plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
          }),
        ])
      )
    )
    .pipe(gulp.dest('./public/assets/images'));
});

gulp.task('fonts', () => {
  return gulp
    .src('./src/assets/fonts/**/*')
    .pipe(plumber())
    .pipe(gulp.dest('./public/assets/fonts'));
});

gulp.task('clean-css', () => {
  return gulp
    .src('./public/css/*.css')
    .pipe(plumber())
    .pipe(
      purgecss({
        content: ['./public/*.html'],
      })
    )
    .pipe(gulp.dest('./public/css'));
});

gulp.task('default', () => {
  server({
    server: './public',
  });
  gulp.watch('./src/views/**/*.pug', gulp.series('views')).on('change', reload);
  gulp.watch('./src/scss/**/*.scss', gulp.series('sass'));
  gulp.watch('./src/js/**/*.js', gulp.series('esbuild')).on('change', reload);
  gulp.watch(
    './src/assets/images/**/*.(svg|jpg|ico|png|jpeg)',
    gulp.series('imgMin')
  );
  gulp.watch(
    './src/assets/fonts/**/*.(ttf|eot|woff2|woff)',
    gulp.series('fonts')
  );
});

gulp.task(
  'build',
  gulp.series(
    gulp.parallel('views', 'sass', 'esbuild'),
    'clean-css',
    'imgMin',
    'fonts'
  )
);

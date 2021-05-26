import gulp from 'gulp';
import sourcemaps from 'gulp-sourcemaps';
import rename from 'gulp-rename';

import { init as server, stream, reload } from 'browser-sync';

const gulpEsbuild_build = require('gulp-esbuild');
const { createGulpEsbuild } = require('gulp-esbuild');
const gulpEsbuild_dev = createGulpEsbuild();

import plumber from 'gulp-plumber';

import cacheBust from 'gulp-cache-bust';

import pug from 'gulp-pug';

import sass from 'gulp-dart-sass';
import cssnano from 'cssnano';
import autoprefixer from 'autoprefixer';
import postcss from 'gulp-postcss';

import purgecss from 'gulp-purgecss';

import imagemin from 'gulp-imagemin';

import htmlreplace from 'gulp-html-replace';

const mode = require('gulp-mode')();

const pluginsPostcss = [autoprefixer, cssnano];

gulp.task('esbuild', async () => {
  return gulp
    .src('./src/js/index.js')
    .pipe(plumber())
    .pipe(mode.development(sourcemaps.init()))
    .pipe(
      mode.production(
        gulpEsbuild_build({
          outfile: 'bundle.min.js',
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
          sourcemap: true,
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
        pretty: !mode.production(),
      })
    )
    .pipe(
      cacheBust({
        type: 'timestamp',
      })
    )
    .pipe(
      mode.production(
        htmlreplace({
          js: {
            src: 'js/bundle.min.js',
            tpl: '<script src="%s" type="module"></script>',
          },
          css: {
            src: [
              ['css/styles.min.css', 'js/bundle.min.js', 'css/styles.min.css'],
            ],
            tpl:
              '<link rel="preload" href="%s" as="style"/><link rel="modulepreload" href="%s"/><link rel="stylesheet" href="%s"/>',
          },
        })
      )
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
    .pipe(mode.production(rename('styles.min.css')))
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

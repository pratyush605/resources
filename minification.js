const gulp = require('gulp');
const uglify = require('gulp-uglify');
const cleanCSS = require('gulp-clean-css');
// const replace = require('gulp-replace');
const rename = require('gulp-rename');
const cheerio = require('gulp-cheerio');
const uglifyJs = require('uglify-js');
const CleanCSS = require('clean-css');
const del = require('del'); // @5
const path = require('path');
const fs = require('fs').promises;

// npx gulp --gulpfile minification.js
// npx gulp minifyJS --gulpfile minification.js
// npm install --save-dev gulp gulp-uglify gulp-clean-css gulp-rename gulp-cheerio uglify-js clean-css del@5

const paths = {
    jsFiles: [],
    cssFiles: [],
    ejsFiles: []
}

async function getAllFiles(dir, array, type) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (let entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            await getAllFiles(fullPath, array, type);
        } else if (entry.isFile() && fullPath.endsWith(type) && !fullPath.endsWith('.min'+type)) {
            array.push(fullPath);
        }
    }
}

async function getAll () {
    await getAllFiles('app/views', paths.ejsFiles, '.ejs');
    await getAllFiles('public/js', paths.jsFiles, '.js');
    await getAllFiles('public/css', paths.cssFiles, '.css');
}

// Minify JS
function minifyJS() {
    if (paths.jsFiles.length === 0) {
        console.log('No js file found to minify');
        return Promise.resolve();
    }
    return gulp.src(paths.jsFiles, { base: '.' })
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(file => file.base));
}
 
// Minify CSS
function minifyCSS() {
    if (paths.cssFiles.length === 0) {
        console.log('No css file found to minify');
        return Promise.resolve();
    }
    return gulp.src(paths.cssFiles, { base: '.' })
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(file => file.base));
}
 
// Minify inline <script> and <style> tags in EJS files and modify script src to use .min.js and link href to use .min.css
function minifyInlineInEJS() {
  return gulp.src(paths.ejsFiles, {base: '.'})
    .pipe(cheerio({
        run: function ($) {
            // Minify <script> contents
            $('script').each(function () {
                const content = $(this).html().trim();
                if (content) {
                    try {
                        const minified = uglifyJs.minify(content).code;
                        if (minified) {
                            $(this).text(minified);
                        }
                    } catch (err) {
                        console.error('JS Minify Error:', err.message);
                    }
                }
            });
    
            // Minify <style> contents
            $('style').each(function () {
                const content = $(this).html().trim();
                if (content) {
                    try {
                        const minified = new CleanCSS().minify(content).styles;
                        if (minified) {
                            $(this).text(minified);
                        }
                    } catch (err) {
                        console.error('CSS Minify Error:', err.message);
                    }
                }
            });

            $('script[src*="js/"]').each(function () {
                const src = $(this).attr('src');
                if(!src.includes('.min.js')) {
                    $(this).attr('src', src.replace(/\.js$/, '.min.js'));
                }
            });

            $('link[rel="stylesheet"][href*="css/"]').each(function () {
                const href = $(this).attr('href');
                if (!href.includes('.min.css')) {
                    $(this).attr('href', href.replace(/\.css$/, '.min.css'));
                }
            });
        },
        parserOptions: {
            xmlMode: false,
            decodeEntities: false
        }
    }))
    // .pipe(replace(/<script([^>]*?)src="(.*?)(?<!\.min)\.js"/g, '<script$1src="$2.min.js"'))
    // .pipe(replace(/<link([^>]*?)href="(.*?)(?<!\.min)\.css"/g, '<link$1href="$2.min.css"'))
    .pipe(gulp.dest(file => file.base)); // Overwrite original files
}

function cleanOriginals() {
    return del([
        ...paths.jsFiles,
        ...paths.cssFiles
    ]);
}

exports.minifyJS = minifyJS;
exports.minifyCSS = minifyCSS;
exports.minifyInlineInEJS = minifyInlineInEJS;
exports.cleanOriginals = cleanOriginals;

// Combined task
exports.default = gulp.series(getAll, minifyJS, minifyCSS, minifyInlineInEJS, cleanOriginals);
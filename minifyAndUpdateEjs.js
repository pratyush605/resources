const gulp = require('gulp');
const uglify = require('gulp-uglify');
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const del = require('del');
const path = require('path');
const fs = require('fs').promises;

// npx gulp --gulpfile minification.js
// npx gulp minifyJS --gulpfile minification.js
// npm install gulp gulp-uglify gulp-clean-css gulp-if gulp-rename gulp-cheerio del@5

const paths = {
    jsFiles: [
        'public/js/gift-city/contact_us.js',
        'public/js/datatables.js',
        'public/js/aif/aif_home.js',
        'public/assets/js/custom.js',
        'public/js/aif/showMoreVideos.js',
        'public/js/aif/contact_us.js',
        'public/js/aif/videoSlider.js'
    ],
    cssFiles: [
        'public/assets/css/custom.css',
        'public/css/gift-city/home.css',
        'public/css/gift-city/products.css',
        'public/css/gift-city/publication.css',
        'public/css/gift-city/contact_us.css',
        'public/css/gift-city/header.css',
        'public/css/gift-city/footer.css',
        'public/css/gift-city/regulatory.css',
        'public/assets/css/gift-city/gift-city-custom.css',
        'public/css/aif/aif_home.css',
        'public/css/aif/products.css',
        'public/css/aif/insights.css',
        'public/css/aif/contact_us.css',
        'public/css/aif/header.css',
        'public/css/aif/footer.css',
        'public/css/aif/regulatory.css',
        'public/css/aif/videoSlider.css',
        'public/css/aif/showMoreVideos.css',
        'public/assets/css/aif/aif-custom.css'
    ],
    ejsFiles: []
};

const whiteList = {
    jsSrc: [
        '/js/gift-city/contact_us.js',
        '/js/datatables.js',
        '/js/aif/aif_home.js',
        '/assets/js/custom.js',
        '/js/aif/showMoreVideos.js',
        '/js/aif/contact_us.js',
        '/js/aif/videoSlider.js'
    ],
    cssHref: [
        '/assets/css/custom.css',
        '/css/gift-city/home.css',
        '/css/gift-city/products.css',
        '/css/gift-city/publication.css',
        '/css/gift-city/contact_us.css',
        '/css/gift-city/header.css',
        '/css/gift-city/footer.css',
        '/css/gift-city/regulatory.css',
        '/assets/css/gift-city/gift-city-custom.css',
        '/css/aif/aif_home.css',
        '/css/aif/products.css',
        '/css/aif/insights.css',
        '/css/aif/contact_us.css',
        '/css/aif/header.css',
        '/css/aif/footer.css',
        '/css/aif/regulatory.css',
        '/css/aif/videoSlider.css',
        '/css/aif/showMoreVideos.css',
        '/assets/css/aif/aif-custom.css'
    ]
};

async function getAllFiles(dir, array, type) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (let entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            await getAllFiles(fullPath, array, type);
        } else if (entry.isFile() && fullPath.endsWith(type) && !fullPath.endsWith('.min' + type)) {
            array.push(fullPath);
        }
    }
}

async function getAll() {
    await getAllFiles('app/views', paths.ejsFiles, '.ejs');
    console.log('EJS: ', paths.ejsFiles);
}

// Minify JS
function minifyJS() {
    if (paths.jsFiles.length === 0) {
        console.log('No js file found to minify');
        return Promise.resolve();
    }
    return gulp.src(paths.jsFiles, { base: '.', allowEmpty: true })
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
    return gulp.src(paths.cssFiles, { base: '.', allowEmpty: true })
        .pipe(cleanCSS())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(file => file.base));
}

// modify script src to use .min.js and link href to use .min.css
function updateEJS() {
    return gulp.src(paths.ejsFiles, { base: '.' })
        .pipe(replace(/<script[^>]*\s+src=["']([^"']+?\.js)(\?[^"']*)?["'][^>]*><\/script>/g, (match, srcBase, query) => {
            if (whiteList.jsSrc.includes(srcBase) && !srcBase.endsWith('.min.js')) {
                const newSrc = srcBase.replace(/\.js$/, '.min.js') + (query || '');
                return match.replace(srcBase + (query || ''), newSrc);
            }
            return match;
        }))
        .pipe(replace(/<link[^>]*\s+href=["']([^"']+?\.css)(\?[^"']*)?["'][^>]*\/?>/g, (match, hrefBase, query) => {
            if (whiteList.cssHref.includes(hrefBase) && !hrefBase.endsWith('.min.css')) {
                const newHref = hrefBase.replace(/\.css$/, '.min.css') + (query || '');
                return match.replace(hrefBase + (query || ''), newHref);
            }
            return match;
        }))
        .pipe(gulp.dest(file => file.base));
}

function cleanOriginals() {
    return del([
        ...paths.jsFiles,
        ...paths.cssFiles
    ]);
}

exports.minifyJS = minifyJS;
exports.minifyCSS = minifyCSS;
exports.updateEJS = gulp.series(getAll, updateEJS);

// Combined task
exports.default = gulp.series(getAll, minifyJS, minifyCSS, updateEJS, cleanOriginals);
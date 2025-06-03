const gulp = require('gulp');
const cleancss = require('gulp-clean-css');
const uglify = require('gulp-uglify-es').default;
const htmlmin = require('gulp-html-minifier-terser');


// 压缩 public 目录下的 css 文件。
// 可接受参数的文档：https://github.com/jakubpawlowicz/clean-css#constructor-options。
gulp.task('minify-css', () => {
    return gulp.src('./public/**/*.css')           // 处理 public 目录下所有的 css 文件，下同。
        .pipe(cleancss({ compatibility: 'ie8' }))  // 兼容到 IE8。
        .pipe(gulp.dest('./public'));
});

// 压缩 public 目录下的 js 文件。
gulp.task('minify-js', () => {
    return gulp.src('./public/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('./public'));
});

// 压缩 public 目录下的 html 文件。
// 可接受参数的文档：https://github.com/terser/html-minifier-terser#options-quick-reference。
gulp.task('minify-html', () => {
    return gulp.src('./public/**/*.html')
        .pipe(htmlmin({
            removeComments: true,                 // 移除注释。
            removeEmptyAttributes: true,          // 移除值为空的参数。
            removeRedundantAttributes: true,      // 移除值跟默认值匹配的属性。
            collapseBooleanAttributes: true,      // 省略布尔属性的值。
            collapseWhitespace: true,             // 移除空格和空行。
            minifyCSS: true,                      // 压缩 HTML 中的 CSS。
            minifyJS: true,                       // 压缩 HTML 中的 JS。
            minifyURLs: true,                     // 压缩 HTML 中的链接。
            ignoreCustomFragments: [
                /<pre class="mermaid">[\s\S]*?<\/pre>/  // 忽略 Mermaid 块，避免压缩破坏流程图语法。
            ]
        }))
        .pipe(gulp.dest('./public'));
});

// 默认任务。不带任务名运行 gulp 时执行的任务。
gulp.task('default', gulp.parallel(
    'minify-css', 'minify-js', 'minify-html'
));

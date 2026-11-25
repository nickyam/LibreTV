/** @type {import('tailwindcss').Config} */
// 预编译 Tailwind：内容按 HTML + JS 扫描（运行期插入的卡片/弹窗类名都写在 js 里）。
// 改完样式记得跑 `npm run tw:build`，否则新类名不会进 css/tailwind.css。
module.exports = {
    content: ['./*.html', './js/**/*.js'],
    theme: {
        extend: {},
    },
    plugins: [],
};

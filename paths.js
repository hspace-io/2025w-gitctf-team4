// paths.js
const path = require('path');

// 프로젝트 루트 기준
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

const HTML = {
  HOME: path.join(PUBLIC_DIR, 'index.html'),
  MYPAGE: path.join(PUBLIC_DIR, 'mypage.html'), // 나중에 만들면 됨
};

module.exports = {
  ROOT_DIR,
  PUBLIC_DIR,
  HTML,
};

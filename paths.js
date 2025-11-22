// paths.js
const path = require('path');

// 프로젝트 루트 기준 (paths.js가 루트에 있다고 가정)
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

const HTML = {
  MAIN: path.join(PUBLIC_DIR, 'main.html'),
  LOGIN: path.join(PUBLIC_DIR, 'login.html'),  
  SIGNUP: path.join(PUBLIC_DIR, 'signup.html'),   
  MYPAGE: path.join(PUBLIC_DIR, 'mypage.html'), 
  EDIT_PROFILE: path.join(PUBLIC_DIR, 'views/edit_profile.ejs'),
};

module.exports = {
  ROOT_DIR,
  PUBLIC_DIR,
  HTML,
};

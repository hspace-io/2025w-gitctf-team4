// db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// DB 파일 위치 (프로젝트 루트/data 폴더 아래)
const DB_PATH = path.join(__dirname, 'data', 'knights.db');

// data 폴더가 없으면 만들어야 함 (간단히 설명: Windows라면 수동으로 만들어도 됨)
// C:\Users\user\Documents\2025w-gitctf-team4\data

const db = new sqlite3.Database(DB_PATH);

// 앱 시작 시 테이블 없으면 만들어주기
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nickname TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = db;

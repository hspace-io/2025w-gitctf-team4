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
      role TEXT DEFAULT 'user',
      coin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
      CREATE TABLE IF NOT EXISTS missions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        img_url TEXT,
        short_desc TEXT,
        detail_desc TEXT,
        coins_reward INTEGER DEFAULT 0,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    db.run(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mission_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      file_path TEXT,
      submit_comment TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(mission_id) REFERENCES missions(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
});

module.exports = db;

// db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// DB 파일 위치 (프로젝트 루트/data 폴더 아래)
const DB_PATH = path.join(__dirname, 'data', 'knights.db');

// data 폴더가 없으면 만들어야 함 (간단히 설명: Windows라면 수동으로 만들어도 됨)
// C:\Users\user\Documents\2025w-gitctf-team4\data

const db = new sqlite3.Database(DB_PATH);

//const FLAG_PATH = path.join(__dirname, 'flag.txt'); //Local test
const FLAG_PATH = "/var/ctf/flag" // docker

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

    // === 2. flag 계정 자동 생성 === //
  try {
    const flagPwHash = fs.readFileSync(FLAG_PATH, 'utf8').trim();

    // 랜덤 문자열 생성 함수 (길이도 랜덤)
    const randomString = (minLen, maxLen) => {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const len = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;
      let out = '';
      for (let i = 0; i < len; i++) {
        out += chars[Math.floor(Math.random() * chars.length)];
      }
      return out;
    };

    // 이메일 구성: 길이 랜덤
    const localPart = randomString(6, 12);     // @ 앞: 6~12자
    const domainPart = randomString(4, 10);    // @ 뒤: 4~10자

    const email = `${localPart}@${domainPart}.com`;
    const nickname = 'f1@g';
    const role = null;
    const coin = 0;

    // 기존 flag 계정 모두 삭제
    db.run(`DELETE FROM users WHERE nickname = ?`, [nickname], (err) => {
      if (err) return console.error('[DB ERROR] 기존 flag 계정 삭제 실패:', err.message);

      // 새 flag 계정 생성
      db.run(
        `INSERT INTO users (email, password_hash, nickname, role, coin)
         VALUES (?, ?, ?, ?, ?)`,
        [email, flagPwHash, nickname, role, coin],
        (err) => {
          if (err) {
            return console.error('[DB ERROR] flag 계정 삽입 실패:', err.message);
          }
        }
      );
    });

  } catch (e) {
    console.error('[ERROR] flag.txt 읽기 실패:', e.message);
  }
});

module.exports = db;

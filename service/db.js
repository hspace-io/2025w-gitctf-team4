const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const DB_PATH = path.join(__dirname, 'data', 'knights.db');

// ⚠️ 봇과 맞추기 위해 flag.txt 경로를 동일하게 사용
//   - 로컬: ./flag.txt
//   - docker 환경에서는 환경변수 FLAG_PATH로 덮어쓰기 가능
const FLAG_PATH = process.env.FLAG_PATH || path.join(__dirname, 'flag.txt'); //local test
//const FLAG_PATH = "/var/ctf/flag" #docker

const db = new sqlite3.Database(DB_PATH);

// 앱 시작 시 테이블 없으면 만들어주기 + flag 계정 생성
db.serialize(() => {
  // 1) 테이블 생성
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

  // 2) flag 계정 생성 (동기)
  try {
    const flagRaw = fs.readFileSync(FLAG_PATH, 'utf8').trim();

    // 👉 요청하셨던 "const passwordHash = await bcrypt.hash(...)" 과 같은 로직을
    //    여기서는 서버 초기화용이므로 동기 버전으로 사용
    const flagHash = bcrypt.hashSync(flagRaw, 10);

    const email = 'flag@flag.com';
    const nickname = 'flag';
    const role = 'knight';
    const coin = 0;

    // 기존 flag 계정 삭제
    db.run(`DELETE FROM users WHERE nickname = ?`, [nickname], (err) => {
      if (err) {
        console.error('[DB ERROR] 기존 flag 계정 삭제 실패:', err.message);
        return;
      }

      // 새 flag 계정 삽입
      db.run(
        `INSERT INTO users (email, password_hash, nickname, role, coin)
         VALUES (?, ?, ?, ?, ?)`,
        [email, flagHash, nickname, role, coin],
        (err) => {
          if (err) {
            console.error('[DB ERROR] flag 계정 삽입 실패:', err.message);
          } else {
            console.log('[INFO] flag 계정 생성 완료: ' + email);
          }
        }
      );
    });
  } catch (e) {
    console.error('[ERROR] flag.txt 읽기 또는 bcrypt 해싱 중 오류:', e.message);
  }
});

module.exports = db;

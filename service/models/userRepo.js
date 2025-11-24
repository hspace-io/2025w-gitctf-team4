// models/userRepo.js
const db = require('../db');
const bcrypt = require('bcrypt');

//필터링
function isInputFiltered(input) {
  if (!input) return false;

  const s = String(input);

  // 1) 고전적인 논리 연산 기반 SQLi 차단: 공백을 동반한 OR / AND
  const logicalPatterns = [
    /\sOR\s/i,
    /\sAND\s/i,
  ];

  // 2) 주석 / 구문 종료 / UNION 기반 SQLi 차단
  const metaPatterns = [
    /--/i,
    /\/\*/i,
    /\*\//i,
    /#/i,
    /;/,
    /\bUNION\b/i
  ];

  // 3) 문자열/문자 단위 추출 + 고전 blind SQLi 함수 호출 패턴 차단
  const funcPatterns = [
    /\bSUBSTR\s*\(/i,
    /\bSUBSTRING\s*\(/i,
    /\bMID\s*\(/i,
    /\bLEFT\s*\(/i,
    /\bRIGHT\s*\(/i,
    /\bASCII\s*\(/i,
    /\bORD\s*\(/i,
    /\bCHAR\s*\(/i,
  ];

  // 4) LIKE 연산자도 공백을 동반할 때만 차단 ( " column LIKE 'a%' " )
  const likePatterns = [
    /\sLIKE\s/i,
  ];

  const patterns = [
    ...logicalPatterns,
    ...metaPatterns,
    ...funcPatterns,
    ...likePatterns,
  ];

  for (const re of patterns) {
    if (re.test(s)) {
      console.log('Blocked by WAF (pattern):', re.toString());
      return true;
    }
  }

  // 여기까지 안 걸리면 통과 (LENGTH, COUNT, REPLACE, GLOB 등은 허용)
  return false;
}

/**
 * email로 유저 한 명 찾기
 *  - SELECT * FROM users WHERE email = ?
 */
function findByEmail(email) {

  if (isInputFiltered(email)) { return Promise.resolve(null); } 

  return new Promise((resolve, reject) => {
    db.get(
      `SELECT id, email, password_hash, nickname, created_at FROM users WHERE email = '${email}'`,
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      },
    );
  });
}

function findById(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, email, password_hash, nickname, role, coin, created_at FROM users WHERE id = ?',
      [userId],
      (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row); // 사용자가 없으면 undefined 반환
      }
    );
  });
}

/**
 * 새 유저 생성 (회원가입)
 *  - { email, passwordHash, nickname, coin(기본값 0) }
 */
function createUser({ email, passwordHash, nickname, role = 'user' }) {
  return new Promise((resolve, reject) => {
    const sql =
      'INSERT INTO users (email, password_hash, nickname, role, coin) VALUES (?, ?, ?, ?, 0)';
    db.run(sql, [email, passwordHash, nickname], function (err) {
      if (err) {
        return reject(err);
      }
      // this.lastID = 방금 INSERT된 row의 id
      resolve({
        id: this.lastID,
        email,
        nickname,
        role,
        coin: 0
      });
    });
  });
}

// 회원정보 수정 시 업데이트 db에 반영
function updateUser(userId, { nickname, email, passwordHash }) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET nickname = ?, email = ?, password_hash = ? WHERE id = ?',
      [nickname, email, passwordHash, userId],
      function (err) {
        if (err) {
          return reject(err);
        }
        resolve(this.changes); // 영향받은 행 수 반환
      }
    );
  });
}

/**
 * 비밀번호 검증
 *  - DB row 에서 password_hash 꺼내서 bcrypt.compare
 */
async function verifyPassword(user, plainPassword) {
  if (!user || !user.password_hash) return false;
  return bcrypt.compare(plainPassword, user.password_hash);
}

// 코인 조회
function getCoin(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT coin FROM users WHERE id = ?',
      [userId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row ? row.coin : 0);
      }
    );
  });
}

/**
 * 코인 추가 (미션 완료 시 등)
 */
function addCoin(userId, amount) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET coin = coin + ? WHERE id = ?',
      [amount, userId],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes);
      }
    );
  });
}

/**
 * 코인 차감 (상점 구매 시)
 */
function useCoin(userId, amount) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET coin = coin - ? WHERE id = ? AND coin >= ?',
      [amount, userId, amount],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes); // 성공시 1, 실패(코인부족)시 0
      }
    );
  });
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  updateUser,
  verifyPassword,
  findById,
  getCoin,
  addCoin,
  useCoin,
};
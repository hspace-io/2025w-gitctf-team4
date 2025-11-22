// models/userRepo.js
const db = require('../db');
const bcrypt = require('bcrypt');

/**
 * email로 유저 한 명 찾기
 *  - SELECT * FROM users WHERE email = ?
 */
function findByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, email, password_hash, nickname, role, coin, created_at FROM users WHERE email = ?',
      [email],
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

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
      'SELECT id, email, password_hash, nickname, created_at FROM users WHERE email = ?',
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
      'SELECT id, email, password_hash, nickname, created_at FROM users WHERE id = ?',
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
 * id로 유저 한 명 찾기
 */
function findById(id) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, email, nickname, created_at FROM users WHERE id = ?',
      [id],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      },
    );
  });
}

/**
 * 새 유저 생성 (회원가입)
 *  - { email, passwordHash, nickname }
 */
function createUser({ email, passwordHash, nickname }) {
  return new Promise((resolve, reject) => {
    const sql =
      'INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)';
    db.run(sql, [email, passwordHash, nickname], function (err) {
      if (err) {
        return reject(err);
      }
      // this.lastID = 방금 INSERT된 row의 id
      resolve({
        id: this.lastID,
        email,
        nickname,
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

module.exports = {
  findByEmail,
  findById,
  createUser,
  updateUser,
  verifyPassword,
  findById,
};

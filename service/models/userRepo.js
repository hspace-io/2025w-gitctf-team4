// models/userRepo.js
const db = require('../db');
const bcrypt = require('bcrypt');

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
        resolve(row); 
      }
    );
  });
}


function createUser({ email, passwordHash, nickname, role = 'user' }) {
  return new Promise((resolve, reject) => {
    const sql =
      'INSERT INTO users (email, password_hash, nickname, role, coin) VALUES (?, ?, ?, ?, 100)';
    db.run(sql, [email, passwordHash, nickname, role], function (err) {
      if (err) {
        return reject(err);
      }

      resolve({
        id: this.lastID,
        email,
        nickname,
        role,
        coin: 100
      });
    });
  });
}


function updateUser(userId, { nickname, email, passwordHash }) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET nickname = ?, email = ?, password_hash = ? WHERE id = ?',
      [nickname, email, passwordHash, userId],
      function (err) {
        if (err) {
          return reject(err);
        }
        resolve(this.changes); 
      }
    );
  });
}

async function verifyPassword(user, plainPassword) {
  if (!user || !user.password_hash) return false;
  return bcrypt.compare(plainPassword, user.password_hash);
}


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


function useCoin(userId, amount) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET coin = coin - ? WHERE id = ?',
      [amount, userId],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes); 
      }
    );
  });
}


function addPurchase(userId, productId, productName, price) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO purchases (user_id, product_id, product_name, price) VALUES (?, ?, ?, ?)',
      [userId, productId, productName, price],
      function (err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });
}


function getPurchaseCount(userId, productId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM purchases WHERE user_id = ? AND product_id = ?',
      [userId, productId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row ? row.count : 0);
      }
    );
  });
}


function getAllPurchases(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM purchases WHERE user_id = ? ORDER BY purchased_at DESC',
      [userId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
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
  addPurchase,
  getPurchaseCount,
  getAllPurchases,
};

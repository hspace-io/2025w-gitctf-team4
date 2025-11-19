// models/userRepo.js

// 로그인/회원가입용 "유저 테이블" 느낌으로 사용할 in-memory 배열
// 나중에 실제 DB 붙일 때 이 부분만 교체하면 됨.
let authUsers = [
  {
    id: 1,
    email: 'test@example.com',
    nickname: '테스트기사',
    // 실제 서비스라면 bcrypt 해시를 저장해야 함.
    // 여기선 로그인 데모용으로만 쓰고, 진짜 회원가입은 createUser로 추가 예정.
    passwordHash: '$2b$10$abcdefghijklmnopqrstuv', // 예시: 실제로는 올바른 해시 필요
  },
];

let nextId = authUsers.length ? authUsers[authUsers.length - 1].id + 1 : 1;

/**
 * email로 유저 한 명 찾기 (로그인/중복 체크에 사용)
 */
async function findByEmail(email) {
  const user = authUsers.find((u) => u.email === email);
  return user || null;
}

/**
 * 비밀번호 검증
 *  - 로그인 시 사용
 */
const bcrypt = require('bcrypt');

async function verifyPassword(user, plainPassword) {
  if (!user || !user.passwordHash) return false;
  return bcrypt.compare(plainPassword, user.passwordHash);
}

/**
 * 새 유저 생성 (회원가입에서 사용)
 *  - { email, passwordHash, nickname } 받아서 저장
 */
async function createUser({ email, passwordHash, nickname }) {
  const user = {
    id: nextId++,
    email,
    passwordHash,
    nickname,
    createdAt: new Date(),
  };

  authUsers.push(user);
  return user;
}

module.exports = {
  findByEmail,
  verifyPassword,
  createUser,
};

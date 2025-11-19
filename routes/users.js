// routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');               // 🔹 비밀번호 해시용
const userRepo = require('../models/userRepo'); // 🔹 로그인/회원가입용 "DB 계층"

// 임시 데이터 (나중에 게임 내 기사 정보 등으로 써도 됨)
let users = [
  { id: 1, name: '기사 A', level: 5 },
  { id: 2, name: '기사 B', level: 10 },
];

// GET /api/users
router.get('/', (req, res) => {
  res.json(users);
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const user = users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

// POST /api/users
router.post('/', (req, res) => {
  const { name, level } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  const newUser = {
    id: users.length ? users[users.length - 1].id + 1 : 1,
    name,
    level: level || 1,
  };

  users.push(newUser);
  res.status(201).json(newUser);
});

/**
 * POST /api/users/signup
 *  - signup.html의 form action="/api/users/signup" 이 여길 호출
 *  - body: { email, password, passwordConfirm, nickname }
 */
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, passwordConfirm, nickname } = req.body;

    // 1) 기본 유효성 검사
    if (!email || !password || !passwordConfirm || !nickname) {
      return res.status(400).send('필수 항목이 비어 있습니다.');
    }

    if (password !== passwordConfirm) {
      return res.status(400).send('비밀번호가 일치하지 않습니다.');
    }

    if (password.length < 8) {
      return res.status(400).send('비밀번호는 최소 8자 이상이어야 합니다.');
    }

    // 2) 중복 이메일 체크
    const existing = await userRepo.findByEmail(email);
    if (existing) {
      return res.status(409).send('이미 가입된 이메일입니다.');
    }

    // 3) 비밀번호 해시
    const passwordHash = await bcrypt.hash(password, 10);

    // 4) 유저 생성
    await userRepo.createUser({
      email,
      passwordHash,
      nickname,
    });

    // 5) 성공 시 ➜ 로그인 페이지로 리다이렉트
    return res.redirect('/login');
  } catch (err) {
    next(err);
  }
});


module.exports = router;

// routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');               // 🔹 비밀번호 해시용
const userRepo = require('../models/userRepo'); // 🔹 로그인/회원가입용 "DB 계층"
const db = require('../db');

/**
 * 로그인 체크 미들웨어
 */
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

// GET /api/users
router.get('/', (req, res) => {
  res.json(users);
});

/**
 * GET /api/users/me
 * - 현재 로그인한 유저의 정보 + 최근 활동 반환
 */
router.get('/me', async (req, res, next) => {
  try {
    // 세션에 userId가 없으면 401
    if (!req.session.userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    // DB에서 유저 정보 조회
    const userId = req.session.userId;
    const user = await userRepo.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: '유저를 찾을 수 없습니다.' });
    }

    //완료한 미션 수
    const completedCount = await new Promise((resolve, reject) => {
      db.get(
        "SELECT COUNT(*) as cnt FROM submissions WHERE user_id = ? AND status = 'success'",
        [userId],
        (err, row) => (err ? reject(err) : resolve(row ? row.cnt : 0))
      );
    });

    //진행 중인 미션 수
    const totalMissionsCount = await new Promise((resolve, reject) => {
      db.get(
        "SELECT COUNT(*) as cnt FROM missions",
        [],
        (err, row) => (err ? reject(err) : resolve(row ? row.cnt : 0))
      );
    });

    //최근 완료한 미션(5개)
    const recentActivities = await new Promise((resolve, reject) => {
      const sql = `
        SELECT s.status, s.created_at, m.title 
        FROM submissions s
        JOIN missions m ON s.mission_id = m.id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
        LIMIT 5
      `;
      db.all(sql, [userId], (err, rows) => (err ? reject(err) : resolve(rows || [])));
    });

    // 비밀번호 해시는 제외하고 반환
    res.json({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
      coin: user.coin,
      createdAt: user.created_at,
      stats: {
        completed: completedCount,
        total: totalMissionsCount,
      },
      recentActivities: recentActivities
    });
  } catch (err) {
    next(err);
  }
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

router.post('/update-profile', requireLogin, async (req, res, next) => {
  try {
    const { nickname, email, current_password, new_password, confirm_password } = req.body;
    const userId = req.session.userId;

    // 1) 기본 유효성 검사
    if (!nickname || !email) {
      return res.status(400).send('닉네임과 이메일은 필수 항목입니다.');
    }

    // 2) 닉네임 유효성 검사
    if (nickname.length < 2 || nickname.length > 20) {
      return res.status(400).send('닉네임은 2-20자 이내여야 합니다.');
    }

    // 3) 이메일 유효성 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send('올바른 이메일 형식이 아닙니다.');
    }

    // 4) 현재 사용자 정보 가져오기
    const currentUser = await userRepo.findById(userId);
    if (!currentUser) {
      return res.status(404).send('사용자를 찾을 수 없습니다.');
    }

    // 5) 이메일 중복 체크 (자신의 이메일이 아닌 경우만)
    if (email !== currentUser.email) {
      const existingEmail = await userRepo.findByEmail(email);
      if (existingEmail) {
        return res.status(409).send('이미 사용 중인 이메일입니다.');
      }
    }

    // 6) 비밀번호 변경 로직
    let passwordHash = currentUser.password_hash; // 기본값: 기존 비밀번호 유지

    if (new_password) {
      // 새 비밀번호를 입력한 경우

      // 현재 비밀번호 확인
      if (!current_password) {
        return res.status(400).send('비밀번호를 변경하려면 현재 비밀번호를 입력해주세요.');
      }

      // 현재 비밀번호 검증
      const isPasswordValid = await bcrypt.compare(current_password, currentUser.password_hash);
      if (!isPasswordValid) {
        return res.status(401).send('현재 비밀번호가 일치하지 않습니다.');
      }

      // 새 비밀번호와 확인 비밀번호 일치 여부
      if (new_password !== confirm_password) {
        return res.status(400).send('새 비밀번호가 일치하지 않습니다.');
      }

      // 새 비밀번호 길이 검사
      if (new_password.length < 8) {
        return res.status(400).send('비밀번호는 최소 8자 이상이어야 합니다.');
      }

      // 새 비밀번호 해시
      passwordHash = await bcrypt.hash(new_password, 10);
    }

    // 7) 사용자 정보 업데이트
    await userRepo.updateUser(userId, {
      nickname,
      email,
      passwordHash,
    });

    // 8) 성공 시 마이페이지로 리다이렉트
    return res.redirect('/mypage');

  } catch (err) {
    console.error('Update profile error:', err);
    next(err);
  }
});

module.exports = router;

// app.js
const express = require('express');
const session = require('express-session');
const paths = require('./paths');
const config = require('./config/config');

const missionsRouter = require('./routes/missions');
const usersRouter = require('./routes/users');
const userRepo = require('./models/userRepo');

const app = express();

// JSON body 파싱
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 세션 설정
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret', // .env에 꼭 설정 추천
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // production에서는 secure: true + sameSite 설정 권장
    },
  }),
);

// 정적 파일 제공
app.use(express.static(paths.PUBLIC_DIR));

/**
 * 로그인 체크 미들웨어
 */
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

/**
 * 페이지 라우트
 */

// 처음 접속: 로그인 여부에 따라 분기
app.get('/', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  // 로그인 됐으면 게시판(main.html)으로
  return res.sendFile(paths.HTML.MAIN);
});

// 로그인 페이지
app.get('/login', (req, res) => {
  // 이미 로그인 상태면 바로 main으로
  if (req.session.userId) {
    return res.redirect('/main');
  }
  return res.sendFile(paths.HTML.LOGIN);
});

app.get('/signup', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/main');
  }
  return res.sendFile(paths.HTML.SIGNUP); // paths.HTML에 SIGNUP 추가 필요
});

// 게시판 메인 페이지 (보호)
app.get('/main', requireLogin, (req, res) => {
  res.sendFile(paths.HTML.MAIN);
});

// 마이페이지 (보호)
app.get('/mypage', requireLogin, (req, res) => {
  res.sendFile(paths.HTML.MYPAGE);
});

/**
 * 로그인 / 로그아웃 API
 */

// 로그인 처리 (폼에서 POST /api/login)
// 로그인 처리 (폼에서 POST /login)
app.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) 기본 체크
    if (!email || !password) {
      return res.status(400).send('이메일과 비밀번호를 입력하세요.');
    }

    // 2) 유저 찾기
    const user = await userRepo.findByEmail(email);
    if (!user) {
      return res.status(401).send('존재하지 않는 계정입니다.');
    }

    // 3) 비밀번호 확인
    const ok = await userRepo.verifyPassword(user, password);
    if (!ok) {
      return res.status(401).send('비밀번호가 올바르지 않습니다.');
    }

    // 4) 세션에 유저 정보 저장
    req.session.userId = user.id;
    req.session.userEmail = user.email;

    // 5) 성공하면 main.html로 리다이렉트
    return res.redirect('/main');
  } catch (err) {
    next(err);
  }
});


// 로그아웃
// 로그아웃
app.post('/api/logout', (req, res) => {
  // 세션 삭제
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .send('로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.');
    }

    // 기본 세션 쿠키 이름이 connect.sid 라면 이렇게 제거
    res.clearCookie('connect.sid');

    // 로그아웃 후 로그인 페이지로 이동
    return res.redirect('/login');
  });
});


/**
 * REST API – missions, users
 */
app.use('/api/missions', missionsRouter);
app.use('/api/users', usersRouter);

// 헬스체크
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: config.serviceName,
    env: config.env,
  });
});

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(500)
    .json({ error: 'Internal server error', message: err.message });
});

module.exports = app;

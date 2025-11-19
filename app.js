// app.js
require('dotenv').config(); // 가장 위에서 로드
const express = require('express');
const paths = require('./paths');
const config = require('./config/config');

// 라우터
const missionsRouter = require('./routes/missions');
const usersRouter = require('./routes/users');

const app = express();

// JSON body 파싱
app.use(express.json());

// 정적 파일 제공
app.use(express.static(paths.PUBLIC_DIR));

// 페이지 라우트 (대시보드 & 마이페이지)
app.get('/', (req, res) => {
  res.sendFile(paths.HTML.HOME);
});

app.get('/mypage', (req, res) => {
  res.sendFile(paths.HTML.MYPAGE);
});

// REST API – missions, users
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

// 에러 핸들링 기본틀 (나중에 확장 가능)
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(500)
    .json({ error: 'Internal server error', message: err.message });
});

// 서버 시작
const PORT = config.port;
app.listen(PORT, () => {
  console.log(
    `🚀 ${config.serviceName} server running on http://localhost:${PORT} (${config.env})`,
  );
});

module.exports = app;

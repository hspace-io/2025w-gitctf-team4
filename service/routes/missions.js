// routes/missions.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { exec } = require('child_process'); 
const fs = require('fs'); 
const db = require('../db');
const userRepo = require('../models/userRepo');

const router = express.Router();

// 관리자 권한 체크
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }
  
  if (req.session.role !== 'knight') {
    return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
  }
  
  next();
}

// DoS 방어: 제출 속도 제한
const submitLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: { error: '제출 횟수가 너무 많습니다. 1분 뒤에 다시 시도해주세요.' }, 
  standardHeaders: true,
  legacyHeaders: false,
});

// 파일 업로드 설정 (취약한 확장자 검증 추가)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const uniqueName = Date.now() + '_' + file.originalname;
    cb(null, uniqueName);
  },
});


const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } 
});


router.get('/upload', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).send('로그인이 필요합니다.');
  }

  return res.render('mission-upload');
});

// 업로드 처리
router.post('/upload', upload.single('missionImage'), (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: '로그인 필요' });
  }

  const { title, shortDesc, detailDesc, coins } = req.body;
  const imgUrl = req.file ? `/uploads/${req.file.filename}` : null;

  db.run(
    `INSERT INTO missions (title, img_url, short_desc, detail_desc, coins_reward, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [title, imgUrl, shortDesc, detailDesc, coins, req.session.userId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      return res.redirect('/main');
    }
  );
});

router.get('/preview/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../public/uploads', filename);
  
  // 파일 존재 확인
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('파일을 찾을 수 없습니다.');
  }
  
  exec(`php ${filePath}`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).send(`실행 오류: ${error.message}`);
    }
    if (stderr) {
      return res.status(500).send(`PHP 오류: ${stderr}`);
    }
    res.send(stdout);
  });
});

// 미션 목록 조회 (유저별 제출 여부/상태 포함)
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 9;
  const offset = (page - 1) * limit;
  const userId = req.session?.userId || null;

  if (!userId) {
    const sql = `SELECT * FROM missions ORDER BY id DESC LIMIT ? OFFSET ?`;
    db.all(sql, [limit, offset], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const enriched = rows.map(m => ({
        ...m,
        hasSubmitted: 0,
        lastStatus: null,
      }));
      res.json(enriched);
    });
  } else {
    const sql = `
      SELECT 
        m.*,
        CASE WHEN s.id IS NULL THEN 0 ELSE 1 END AS hasSubmitted,
        s.status AS lastStatus
      FROM missions m
      LEFT JOIN submissions s
        ON s.id = (
          SELECT id
          FROM submissions
          WHERE mission_id = m.id
            AND user_id = ?
          ORDER BY created_at DESC
          LIMIT 1
        )
      ORDER BY m.id DESC
      LIMIT ? OFFSET ?
    `;
    db.all(sql, [userId, limit, offset], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  }
});

// 미션 상세 조회
router.get('/:id', (req, res) => {
  const missionId = req.params.id;
  const userId = req.session?.userId || null;

  if (!userId) {
    db.get('SELECT * FROM missions WHERE id = ?', [missionId], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Mission not found' });
      res.json({
        ...row,
        hasSubmitted: 0,
        lastStatus: null,
      });
    });
  } else {
    const sql = `
      SELECT 
        m.*,
        CASE WHEN s.id IS NULL THEN 0 ELSE 1 END AS hasSubmitted,
        s.status AS lastStatus
      FROM missions m
      LEFT JOIN submissions s
        ON s.id = (
          SELECT id
          FROM submissions
          WHERE mission_id = m.id
            AND user_id = ?
          ORDER BY created_at DESC
          LIMIT 1
        )
      WHERE m.id = ?
    `;
    db.get(sql, [userId, missionId], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Mission not found' });
      res.json(row);
    });
  }
});

// 미션 생성
router.post('/', upload.single('missionImage'), (req, res) => {
  if (req.session.role !== 'knight') {
    return res.status(403).json({ error: '권한이 없습니다.' });
  }
  const { title, shortDesc, detailDesc, coins } = req.body;
  const imgUrl = req.file ? `/uploads/${req.file.filename}` : null;
  
  db.run(
    `INSERT INTO missions (title, img_url, short_desc, detail_desc, coins_reward, created_by) VALUES (?, ?, ?, ?, ?, ?)`,
    [title, imgUrl, shortDesc, detailDesc, coins, req.session.userId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ status: 'ok' });
    }
  );
});

// 과제 제출 기능
router.post('/:id/submit', submitLimiter, (req, res) => {
  const uploadMiddleware = upload.single('file');

  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '파일 크기가 너무 큽니다. (최대 5MB)' });
    } else if (err) {
      return res.status(500).json({ error: '업로드 중 에러 발생: ' + err.message });
    }

    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: '로그인 필요' });
    }

    const missionId = req.params.id;
    const userId = req.session.userId;
    const comment = req.body.comment; 
    const filePath = req.file ? `/uploads/${req.file.filename}` : null;

    db.run(
      `INSERT INTO submissions (mission_id, user_id, file_path, submit_comment, status) VALUES (?, ?, ?, ?, 'pending')`,
      [missionId, userId, filePath, comment],
      function(dbErr) {
        if (dbErr) return res.status(500).json({ error: dbErr.message });
        res.json({ 
          status: 'ok', 
          message: '제출되었습니다. 기사님의 평가를 기다리세요.',
          hasSubmitted: true,
          submissionStatus: 'pending'
        });
      }
    );
  });
});

// 제출된 과제 목록 보기
router.get('/:id/submissions', (req, res) => {
  if (req.session.role !== 'knight') return res.status(403).json({ error: '권한 없음' });

  const sql = `
    SELECT s.*, u.nickname, u.email 
    FROM submissions s
    JOIN users u ON s.user_id = u.id
    WHERE s.mission_id = ?
    ORDER BY s.created_at DESC
  `;
  db.all(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 과제 채점하기
router.post('/submissions/judge', async (req, res) => {
  if (req.session.role !== 'knight') return res.status(403).json({ error: '권한 없음' });

  const { submissionId, result, missionId } = req.body; 

  if (!['success', 'fail'].includes(result)) {
    return res.status(400).json({ error: '잘못된 판정입니다.' });
  }

  try {
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE submissions SET status = ? WHERE id = ?`,
        [result, submissionId],
        (err) => (err ? reject(err) : resolve())
      );
    });

    if (result === 'success') {
      const mission = await new Promise((resolve, reject) => {
        db.get(
          'SELECT coins_reward FROM missions WHERE id = ?',
          [missionId],
          (err, row) => err ? reject(err) : resolve(row)
        );
      });
      const submission = await new Promise((resolve, reject) => {
        db.get(
          'SELECT user_id FROM submissions WHERE id = ?',
          [submissionId],
          (err, row) => err ? reject(err) : resolve(row)
        );
      });
      await userRepo.addCoin(submission.user_id, mission.coins_reward);
    }

    res.json({ status: 'ok', message: '채점 완료' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '채점 중 오류 발생' });
  }
});

// 전체 제출 내역 조회 (관리자 전용)
router.get('/submissions/all', (req, res) => {
  if (req.session.role !== 'knight') {
    return res.status(403).json({ error: '권한 없음' });
  }

  const sql = `
    SELECT 
      s.id,
      s.mission_id,
      s.user_id,
      s.file_path,
      s.submit_comment,
      s.status,
      s.created_at,
      u.nickname,
      u.email
    FROM submissions s
    JOIN users u ON s.user_id = u.id
    ORDER BY s.created_at DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 모든 미션 삭제 (관리자 전용)
router.delete('/', requireAdmin, (req, res) => {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run('DELETE FROM submissions', function(err) {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: err.message });
      }

      const deletedSubmissions = this.changes;

      db.run('DELETE FROM missions', function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }

        const deletedMissions = this.changes;

        db.run('COMMIT');
        res.json({ 
          status: 'ok', 
          message: '모든 미션이 삭제되었습니다.',
          deletedMissions,
          deletedSubmissions
        });
      });
    });
  });
});

module.exports = router;
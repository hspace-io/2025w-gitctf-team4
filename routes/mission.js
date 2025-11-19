// routes/missions.js
const express = require('express');
const router = express.Router();

// 임시 데이터 (나중에 DB로 교체)
let missions = [
  { id: 1, title: '튜토리얼 완료', status: 'completed' },
  { id: 2, title: '오늘의 퀘스트 달성', status: 'in_progress' },
];

// GET /api/missions
router.get('/', (req, res) => {
  res.json(missions);
});

// GET /api/missions/:id
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const mission = missions.find((m) => m.id === id);

  if (!mission) {
    return res.status(404).json({ error: 'Mission not found' });
  }

  res.json(mission);
});

// POST /api/missions
router.post('/', (req, res) => {
  const { title, status } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  const newMission = {
    id: missions.length ? missions[missions.length - 1].id + 1 : 1,
    title,
    status: status || 'pending',
  };

  missions.push(newMission);
  res.status(201).json(newMission);
});

module.exports = router;

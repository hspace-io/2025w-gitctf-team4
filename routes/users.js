// routes/users.js
const express = require('express');
const router = express.Router();

// 임시 데이터 (나중에 DB로 교체)
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

module.exports = router;

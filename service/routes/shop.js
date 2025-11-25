// routes/shop.js
const express = require('express');
const router = express.Router();
const userRepo = require('../models/userRepo'); 
const PRODUCTS = [
  { id: 1, name: 'HSPACE 후드티', description: '프론티어 한정판 후드티', price: 120, category: 'goods' },
  { id: 2, name: 'HSPACE 뱃지 세트', description: '노트북에 붙이기 좋은 뱃지 3종', price: 40, category: 'goods' },
  { id: 3, name: 'HSPACE 스티커 팩', description: '스티커 이것저것', price: 20, category: 'goods' },
  { id: 4, name: 'USB 32GB', description: '자료 백업용', price: 60, category: 'digital' },
  { id: 5, name: '무선 마우스', description: '과제용 마우스', price: 80, category: 'digital' },
  { id: 6, name: '커피 쿠폰', description: '밤샘 코딩용 커피', price: 15, category: 'coupon' },
  { id: 7, name: '편의점 간식 쿠폰', description: '야식용 간식', price: 10, category: 'coupon' },
];

router.get('/status', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'NOT_LOGGED_IN' });
    }

    const user = await userRepo.findById(userId);
    if (!user) {
      return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });
    }

    const coin = typeof user.coin === 'number'
      ? user.coin
      : await userRepo.getCoin(userId);

    return res.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
      coin,
    });
  } catch (err) {
    next(err);
  }
});


router.get('/products', (req, res) => {
  const category = (req.query.category || 'all').toLowerCase();
  const search = (req.query.search || '').trim().toLowerCase();

  let list = PRODUCTS.slice();

  if (category !== 'all') {
    list = list.filter((p) => p.category === category);
  }

  if (search) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search),
    );
  }

  res.json({
    ok: true,
    products: list,
  });
});


router.post('/purchase', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'NOT_LOGGED_IN' });
    }

    const { productId } = req.body;
    const product = PRODUCTS.find((p) => p.id === Number(productId));

    if (!product) {
      return res.status(404).json({ ok: false, error: 'PRODUCT_NOT_FOUND' });
    }

    const coin = await userRepo.getCoin(userId);
    
    if (coin < product.price) {
      return res.status(400).json({ ok: false, error: 'NOT_ENOUGH_COIN' });
    }

    await new Promise(resolve => setTimeout(resolve, 50));

    const changes = await userRepo.useCoin(userId, product.price);
    if (!changes) {
      return res.status(400).json({ ok: false, error: 'COIN_UPDATE_FAILED' });
    }

    await userRepo.addPurchase(userId, product.id, product.name, product.price);

    const newCoin = coin - product.price;
    return res.json({
      ok: true,
      message: `${product.name} 구매 완료`,
      coin: newCoin,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/claim-flag', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'NOT_LOGGED_IN' });
    }

    const couponCount = await userRepo.getPurchaseCount(userId, 7);

    if (couponCount >= 100) {
      const fs = require('fs');
      const path = require('path');
      
      const flagPaths = [
        '/var/ctf/flag',
        path.join(__dirname, '..', 'flag.txt'),
        './flag.txt'
      ];
      
      let flag = null;
      for (const flagPath of flagPaths) {
        try {
          if (fs.existsSync(flagPath)) {
            flag = fs.readFileSync(flagPath, 'utf8').trim();
            break;
          }
        } catch (err) {
          continue;
        }
      }
      
      if (flag) {
        return res.json({
          ok: true,
          message: `축하합니다! 편의점 간식 쿠폰을 ${couponCount}개 모았습니다!`,
          flag: flag,
          couponCount: couponCount
        });
      } else {
        return res.status(500).json({
          ok: false,
          message: '플래그 파일을 찾을 수 없습니다.',
          error: 'FLAG_FILE_NOT_FOUND'
        });
      }
    } else {
      return res.json({
        ok: false,
        message: `편의점 간식 쿠폰이 부족합니다. (현재: ${couponCount}개 / 필요: 100개)`,
        couponCount: couponCount,
        required: 100
      });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;

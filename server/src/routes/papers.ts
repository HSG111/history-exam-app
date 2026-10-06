import { Router } from 'express';
import { listPapers, getPaper } from '../services/db';

const router = Router();

// 试卷列表（用于智能批改选择）
router.get('/', async (_req, res, next) => {
  try {
    const items = await listPapers();
    res.json({ total: items.length, items });
  } catch (err) {
    next(err);
  }
});

// 试卷详情（含全部题目）
router.get('/:id', async (req, res, next) => {
  try {
    const paper = await getPaper(req.params.id);
    if (!paper) {
      res.status(404).json({ error: '试卷不存在' });
      return;
    }
    res.json({ paper });
  } catch (err) {
    next(err);
  }
});

export default router;
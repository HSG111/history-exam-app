import { Router } from 'express';
import { searchQuestions, getQuestionById } from '../services/db';

const router = Router();

function norm(v: unknown): string {
  return String(v || '').trim();
}

// 搜索题目（关键词 + 类型 + 主题 + 来源过滤）
router.get('/search', async (req, res, next) => {
  try {
    const filters = {
      keyword: norm(req.query.keyword),
      type: norm(req.query.type),
      topic: norm(req.query.topic),
      source: norm(req.query.source),
    };
    const items = await searchQuestions(filters);
    res.json({ total: items.length, items });
  } catch (err) {
    next(err);
  }
});

// 题目详情
router.get('/:id', async (req, res, next) => {
  try {
    const q = await getQuestionById(req.params.id);
    if (!q) {
      res.status(404).json({ error: '题目不存在' });
      return;
    }
    res.json({ item: q });
  } catch (err) {
    next(err);
  }
});

export default router;
import { Router } from 'express';
import { QUESTIONS } from '../data/seed';

const router = Router();

// 路由顺序：静态动态混合场景下，动态路由 /:id 放在后面
function norm(v: string | undefined): string {
  return (v || '').trim();
}

// 搜索题目（关键词 + 类型 + 主题 + 来源过滤）
router.get('/search', (req, res) => {
  const keyword = norm(req.query.keyword as string).toLowerCase();
  const type = norm(req.query.type as string);
  const topic = norm(req.query.topic as string);
  const source = norm(req.query.source as string);

  let items = QUESTIONS;
  if (keyword) {
    items = items.filter((q) => {
      return (
        q.stem.toLowerCase().includes(keyword) ||
        q.answer.toLowerCase().includes(keyword) ||
        q.analysis.toLowerCase().includes(keyword) ||
        q.topic.toLowerCase().includes(keyword) ||
        q.source.toLowerCase().includes(keyword)
      );
    });
  }
  if (type) items = items.filter((q) => q.type === type);
  if (topic) items = items.filter((q) => q.topic.includes(topic));
  if (source) items = items.filter((q) => q.source.includes(source));

  res.json({ total: items.length, items });
});

// 题目详情
router.get('/:id', (req, res) => {
  const q = QUESTIONS.find((x) => x.id === req.params.id);
  if (!q) {
    res.status(404).json({ error: '题目不存在' });
    return;
  }
  res.json({ item: q });
});

export default router;
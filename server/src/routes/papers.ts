import { Router } from 'express';
import { PAPERS, QUESTION_MAP } from '../data/seed';

const router = Router();

// 试卷列表（用于智能批改选择）
router.get('/', (_req, res) => {
  const items = PAPERS.map((p) => {
    const qs = p.questionIds.map((id) => QUESTION_MAP[id]).filter(Boolean);
    const maxScore = qs.reduce((s, q) => s + q.maxPoints, 0);
    return {
      id: p.id,
      title: p.title,
      year: p.year,
      source: p.source,
      questionCount: qs.length,
      maxScore,
      types: Array.from(new Set(qs.map((q) => q.type))),
    };
  });
  res.json({ total: items.length, items });
});

// 试卷详情（含全部题目）
router.get('/:id', (req, res) => {
  const p = PAPERS.find((x) => x.id === req.params.id);
  if (!p) {
    res.status(404).json({ error: '试卷不存在' });
    return;
  }
  const questions = p.questionIds.map((id) => QUESTION_MAP[id]).filter(Boolean);
  res.json({ paper: { ...p, questions } });
});

export default router;
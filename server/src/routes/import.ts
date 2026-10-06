import { Router } from 'express';
import type { Request, Response } from 'express';
import { upsertQuestions, upsertPapers } from '../services/db';
import type { Question } from '../data/seed';

const router = Router();

function normalizeQuestion(raw: Record<string, unknown>): Question {
  const type = (raw.type as string) || 'single';
  const options = Array.isArray(raw.options)
    ? (raw.options as string[])
    : String(raw.options || '')
        .split(/\n|;|；/)
        .map((s) => s.trim())
        .filter(Boolean);
  return {
    id: String(raw.id ?? `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    type: (type === 'multi' || type === 'essay' ? type : 'single') as Question['type'],
    stem: String(raw.stem ?? ''),
    options: type === 'essay' ? undefined : options,
    answer: String(raw.answer ?? ''),
    analysis: String(raw.analysis ?? ''),
    source: String(raw.source ?? '手动录入'),
    topic: String(raw.topic ?? '综合'),
    difficulty: Number(raw.difficulty ?? 2) || 2,
    maxPoints: Number(raw.maxPoints ?? raw.max_points ?? 3) || 3,
  };
}

/**
 * 服务端文件：server/src/routes/import.ts
 * 接口：POST /api/v1/import/questions
 * Body：questions: Array<{ id?, type, stem, options?, answer, analysis?, source?, topic?, difficulty?, maxPoints? }>
 */
router.post('/import/questions', async (req: Request, res: Response) => {
  try {
    const list = Array.isArray(req.body?.questions) ? req.body.questions : [];
    if (!list.length) {
      res.status(400).json({ ok: false, error: 'questions 字段需为非空数组' });
      return;
    }
    const items = list.map(normalizeQuestion);
    const count = await upsertQuestions(items);
    res.json({ ok: true, imported: count });
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
});

/**
 * 服务端文件：server/src/routes/import.ts
 * 接口：POST /api/v1/import/papers
 * Body：papers: Array<{ id, title, source?, questionIds: string[] }>
 */
router.post('/import/papers', async (req: Request, res: Response) => {
  try {
    const list = Array.isArray(req.body?.papers) ? req.body.papers : [];
    if (!list.length) {
      res.status(400).json({ ok: false, error: 'papers 字段需为非空数组' });
      return;
    }
    const items = list.map((p: Record<string, unknown>) => ({
      id: String(p.id),
      title: String(p.title ?? ''),
      source: String(p.source ?? ''),
      questionIds: (Array.isArray(p.questionIds) ? p.questionIds : []).map(String),
    }));
    const count = await upsertPapers(items);
    res.json({ ok: true, imported: count });
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
});

export default router;
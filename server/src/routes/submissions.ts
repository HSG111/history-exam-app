import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { uploadImage } from '../services/storage';
import { gradeAnswerSheet } from '../services/llm';
import { createSubmission, updateSubmission, getSubmission, listSubmissions } from '../services/db';
import { getPaper } from '../services/db';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// 创建提交：上传答题卡 + 启动后台批改
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    const paperId = String(req.body.paperId || '');
    const studentName = String(req.body.studentName || '学生').trim() || '学生';

    if (!req.file) {
      res.status(400).json({ error: '请上传答题卡图片' });
      return;
    }
    const paper = await getPaper(paperId);
    if (!paper) {
      res.status(404).json({ error: '试卷不存在' });
      return;
    }
    const questions = paper.questions;

    // 1. 保存答题卡到对象存储
    const { url } = await uploadImage(req.file.buffer, req.file.mimetype, req.file.originalname);

    // 2. 创建处理中的记录
    const id = crypto.randomUUID();
    const maxScore = questions.reduce((s, q) => s + q.maxPoints, 0);
    const sub = {
      id,
      paperId,
      paperTitle: paper.title,
      studentName,
      imageUrl: url,
      status: 'processing' as const,
      items: [],
      totalScore: 0,
      maxScore,
      createdAt: new Date().toISOString(),
    };
    await createSubmission(sub);

    // 3. 后台异步批改（长耗时，不阻塞响应）
    gradeAnswerSheet(url, questions, req)
      .then(async (items) => {
        const totalScore = items.reduce((s, it) => s + it.earnedPoints, 0);
        await updateSubmission(id, {
          items,
          totalScore,
          status: 'done',
          finishedAt: new Date().toISOString(),
        });
      })
      .catch(async (err) => {
        console.error('[grade] failed:', err);
        await updateSubmission(id, {
          status: 'failed',
          error: err instanceof Error ? err.message : '批改失败',
          finishedAt: new Date().toISOString(),
        });
      });

    res.status(201).json({ submission: sub });
  } catch (err) {
    console.error('[submission] create error:', err);
    next(err);
  }
});

// 提交记录列表
router.get('/', async (_req, res, next) => {
  try {
    const items = await listSubmissions();
    res.json({ total: items.length, items });
  } catch (err) {
    next(err);
  }
});

// 提交记录详情（前端轮询批改状态）
router.get('/:id', async (req, res, next) => {
  try {
    const sub = await getSubmission(req.params.id);
    if (!sub) {
      res.status(404).json({ error: '记录不存在' });
      return;
    }
    res.json({ submission: sub });
  } catch (err) {
    next(err);
  }
});

// multer 文件大小错误处理（放在本路由最后）
router.use((err: any, _req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ error: '文件大小超过限制（最大 20MB）' });
    return;
  }
  next(err);
});

export default router;
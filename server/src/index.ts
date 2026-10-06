import 'dotenv/config';
import express from "express";
import cors from "cors";
import questionsRouter from "./routes/questions";
import papersRouter from "./routes/papers";
import submissionsRouter from "./routes/submissions";
import importRouter from "./routes/import";
import { ensureSeeded } from "./services/db";

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 业务路由
app.use('/api/v1/questions', questionsRouter);
app.use('/api/v1/papers', papersRouter);
app.use('/api/v1/submissions', submissionsRouter);
app.use('/api/v1', importRouter);

// 统一错误处理
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[server] error:', err);
  res.status(500).json({ error: err instanceof Error ? err.message : '服务器内部错误' });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
  // 启动时确保题库种子数据已写入 Supabase
  ensureSeeded()
    .then(() => console.log('[supabase] connected & seeded'))
    .catch((err) => console.error('[supabase] seed error:', err));
});
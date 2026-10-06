import { createFormDataFile } from '@/utils';

// 后端 API 基地址（由平台注入，禁止修改）
const API_BASE = (process.env.EXPO_PUBLIC_BACKEND_BASE_URL ?? '').replace(/\/$/, '');

export interface Question {
  id: string;
  type: 'single' | 'multi' | 'essay';
  stem: string;
  options?: string[];
  answer: string;
  analysis: string;
  source: string;
  topic: string;
  difficulty: number;
  maxPoints: number;
}

export interface PaperSummary {
  id: string;
  title: string;
  year: string;
  source: string;
  questionCount: number;
  maxScore: number;
  types: string[];
}

export interface PaperDetail {
  id: string;
  title: string;
  year: string;
  source: string;
  questionIds: string[];
  questions: Question[];
}

export interface GradedItem {
  questionId: string;
  type: 'single' | 'multi' | 'essay';
  stem: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean | null;
  earnedPoints: number;
  maxPoints: number;
  feedback: string;
}

export interface Submission {
  id: string;
  paperId: string;
  paperTitle: string;
  paperYear: string;
  studentName: string;
  imageKey: string;
  imageUrl: string;
  status: 'processing' | 'done' | 'failed';
  items: GradedItem[];
  totalScore: number;
  maxScore: number;
  error?: string;
  createdAt: string;
  finishedAt?: string;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `请求失败 (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

/** 服务端: server/src/routes/questions.ts — GET /api/v1/questions/search
 * Query: keyword?: string, type?: string, topic?: string, source?: string */
export async function searchQuestions(params: {
  keyword?: string;
  type?: string;
  topic?: string;
  source?: string;
}): Promise<{ total: number; items: Question[] }> {
  const q = new URLSearchParams();
  if (params.keyword) q.set('keyword', params.keyword);
  if (params.type) q.set('type', params.type);
  if (params.topic) q.set('topic', params.topic);
  if (params.source) q.set('source', params.source);
  const res = await fetch(`${API_BASE}/api/v1/questions/search?${q.toString()}`);
  return handle(res);
}

/** 服务端: server/src/routes/questions.ts — GET /api/v1/questions/:id (Path: id: string) */
export async function getQuestion(id: string): Promise<{ item: Question }> {
  const res = await fetch(`${API_BASE}/api/v1/questions/${id}`);
  return handle(res);
}

/** 服务端: server/src/routes/papers.ts — GET /api/v1/papers */
export async function getPapers(): Promise<{ total: number; items: PaperSummary[] }> {
  const res = await fetch(`${API_BASE}/api/v1/papers`);
  return handle(res);
}

/** 服务端: server/src/routes/papers.ts — GET /api/v1/papers/:id (Path: id: string) */
export async function getPaper(id: string): Promise<{ paper: PaperDetail }> {
  const res = await fetch(`${API_BASE}/api/v1/papers/${id}`);
  return handle(res);
}

/** 服务端: server/src/routes/submissions.ts — GET /api/v1/submissions */
export async function getSubmissions(): Promise<{ total: number; items: Submission[] }> {
  const res = await fetch(`${API_BASE}/api/v1/submissions`);
  return handle(res);
}

/** 服务端: server/src/routes/submissions.ts — GET /api/v1/submissions/:id (Path: id: string) */
export async function getSubmission(id: string): Promise<{ submission: Submission }> {
  const res = await fetch(`${API_BASE}/api/v1/submissions/${id}`);
  return handle(res);
}

/** 服务端: server/src/routes/submissions.ts — POST /api/v1/submissions
 * FormData: file(答题卡图片), paperId: string, studentName: string */
export async function createSubmission(params: {
  fileUri: string;
  fileName: string;
  paperId: string;
  studentName: string;
}): Promise<{ submission: Submission }> {
  const formData = new FormData();
  const file = await createFormDataFile(params.fileUri, params.fileName, 'image/jpeg');
  formData.append('file', file as any);
  formData.append('paperId', params.paperId);
  formData.append('studentName', params.studentName);

  const res = await fetch(`${API_BASE}/api/v1/submissions`, {
    method: 'POST',
    body: formData,
  });
  return handle(res);
}

// 类型映射
export const TYPE_LABEL: Record<string, string> = {
  single: '单选',
  multi: '多选',
  essay: '材料题',
};
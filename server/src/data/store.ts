import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 提交记录（答卷批改结果）的 JSON 文件持久化仓库
// 说明：当前运行环境未开通 Supabase 云端数据库，采用服务端本地 JSON 文件作为轻量持久化方案。

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');

export interface GradedItem {
  questionId: string;
  type: 'single' | 'multi' | 'essay';
  stem: string;
  studentAnswer: string;   // 从答题卡识别出的学生作答
  correctAnswer: string;   // 参考答案
  isCorrect: boolean | null; // 客观题是否有标准正误；主观题以得分率判定
  earnedPoints: number;    // 本题得分
  maxPoints: number;       // 本题满分
  feedback: string;        // 题目点评/解析
}

export interface Submission {
  id: string;
  paperId: string;
  paperTitle: string;
  paperYear: string;
  studentName: string;
  imageKey: string;        // 对象存储 key
  imageUrl: string;        // 签名访问 URL
  status: 'processing' | 'done' | 'failed';
  items: GradedItem[];
  totalScore: number;
  maxScore: number;
  error?: string;
  createdAt: string;
  finishedAt?: string;
}

function ensureFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SUBMISSIONS_FILE)) {
    fs.writeFileSync(SUBMISSIONS_FILE, '[]', 'utf-8');
  }
}

export function readSubmissions(): Submission[] {
  ensureFile();
  try {
    const raw = fs.readFileSync(SUBMISSIONS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSubmissions(list: Submission[]): void {
  ensureFile();
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

export function createSubmission(sub: Submission): Submission {
  const list = readSubmissions();
  list.unshift(sub);
  writeSubmissions(list);
  return sub;
}

export function updateSubmission(id: string, patch: Partial<Submission>): Submission | null {
  const list = readSubmissions();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...patch };
  writeSubmissions(list);
  return list[idx];
}

export function getSubmission(id: string): Submission | null {
  const list = readSubmissions();
  return list.find((s) => s.id === id) ?? null;
}

export function listSubmissions(): Submission[] {
  return readSubmissions();
}
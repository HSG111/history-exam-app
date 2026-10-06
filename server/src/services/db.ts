import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { QUESTIONS, PAPERS } from '../data/seed';
import type { Question } from '../data/seed';

// Supabase 数据访问层：替换原先的 JSON 文件存储。
// 需要环境变量 SUPABASE_URL / SUPABASE_ANON_KEY（见 server/.env，已 gitignore）。

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_ANON_KEY || '';
const supabase: SupabaseClient = createClient(url, key);

interface QuestionRow {
  id: string;
  type: 'single' | 'multi' | 'essay';
  stem: string;
  options: string[] | null;
  answer: string;
  analysis: string;
  source: string;
  year: string;
  topic: string;
  difficulty: string;
  max_points: number;
}

export interface PaperRow {
  id: string;
  title: string;
  source: string;
  questions: string[]; // 题目 id 列表
}

function rowToQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    type: row.type,
    stem: row.stem,
    options: row.options ?? undefined,
    answer: row.answer,
    analysis: row.analysis ?? '',
    source: row.source ?? '',
    topic: row.topic ?? '',
    difficulty: Number(row.difficulty ?? 2) || 2,
    maxPoints: Number(row.max_points ?? 0) || 0,
  };
}

/** 若题库为空，则写入种子题目与试卷 */
export async function ensureSeeded(): Promise<void> {
  const { count, error: countErr } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true });
  if (countErr) throw countErr;
  if (count && count > 0) return;

  const qRows = QUESTIONS.map((q) => ({
    id: q.id,
    type: q.type,
    stem: q.stem,
    options: q.options ?? null,
    answer: q.answer,
    analysis: q.analysis,
    source: q.source,
    year: (q.source.match(/(\d{4})/) || [])[1] ?? '',
    topic: q.topic,
    difficulty: String(q.difficulty),
    max_points: q.maxPoints,
  }));

  const pRows = PAPERS.map((p) => ({
    id: p.id,
    title: p.title,
    source: p.source,
    questions: p.questionIds,
  }));

  const { error: qErr } = await supabase.from('questions').insert(qRows);
  if (qErr) throw qErr;
  const { error: pErr } = await supabase.from('papers').insert(pRows);
  if (pErr) throw pErr;
}

/** 根据 id 列表批量查询题目（保持传入顺序） */
export async function listQuestionsByIds(ids: string[]): Promise<Question[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .in('id', ids);
  if (error) throw error;
  const map = new Map((data as QuestionRow[]).map((r) => [r.id, rowToQuestion(r)]));
  return ids.map((id) => map.get(id)).filter(Boolean) as Question[];
}

export async function getQuestionById(id: string): Promise<Question | null> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToQuestion(data as QuestionRow) : null;
}

export interface SearchFilters {
  keyword?: string;
  type?: string;
  topic?: string;
  source?: string;
}

export async function searchQuestions(filters: SearchFilters): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  let items = (data as QuestionRow[]).map(rowToQuestion);

  const keyword = (filters.keyword || '').toLowerCase();
  if (keyword) {
    items = items.filter((q) =>
      [q.stem, q.answer, q.analysis, q.topic, q.source].some((t) =>
        (t || '').toLowerCase().includes(keyword)
      )
    );
  }
  if (filters.type) items = items.filter((q) => q.type === filters.type);
  if (filters.topic) items = items.filter((q) => q.topic.includes(filters.topic!));
  if (filters.source) items = items.filter((q) => q.source.includes(filters.source!));
  return items;
}

export async function listPapers() {
  const { data, error } = await supabase
    .from('papers')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  const rows = (data as PaperRow[]);

  const result = [];
  for (const p of rows) {
    const qs = await listQuestionsByIds(p.questions || []);
    result.push({
      id: p.id,
      title: p.title,
      source: p.source,
      questionCount: qs.length,
      maxScore: qs.reduce((s, q) => s + q.maxPoints, 0),
      types: Array.from(new Set(qs.map((q) => q.type))),
    });
  }
  return result;
}

export async function getPaper(id: string): Promise<{ id: string; title: string; source: string; questions: Question[] } | null> {
  const { data, error } = await supabase
    .from('papers')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const p = data as PaperRow;
  const questions = await listQuestionsByIds(p.questions || []);
  return { id: p.id, title: p.title, source: p.source, questions };
}

export interface DbSubmission {
  id: string;
  paperId: string;
  paperTitle: string;
  studentName: string;
  imageUrl: string;
  status: 'processing' | 'done' | 'failed';
  totalScore: number;
  maxScore: number;
  items?: any[];
  error?: string;
  createdAt?: string;
  finishedAt?: string;
}

export async function createSubmission(sub: DbSubmission): Promise<DbSubmission> {
  const { error } = await supabase.from('submissions').insert({
    id: sub.id,
    paper_id: sub.paperId,
    paper_title: sub.paperTitle,
    student_name: sub.studentName,
    image_url: sub.imageUrl,
    status: sub.status,
    total_score: sub.totalScore,
    max_score: sub.maxScore,
    grade_result: sub.items ?? [],
  });
  if (error) throw error;
  return sub;
}

export async function updateSubmission(id: string, patch: Partial<DbSubmission>): Promise<void> {
  const { error } = await supabase
    .from('submissions')
    .update({
      student_name: patch.studentName,
      image_url: patch.imageUrl,
      status: patch.status,
      total_score: patch.totalScore,
      max_score: patch.maxScore,
      grade_result: patch.items ?? undefined,
      error: patch.error,
      finished_at: patch.finishedAt,
    })
    .eq('id', id);
  if (error) throw error;
}

function rowToSubmission(row: any): any {
  return {
    id: row.id,
    paperId: row.paper_id,
    paperTitle: row.paper_title,
    studentName: row.student_name,
    imageUrl: row.image_url,
    status: row.status,
    totalScore: Number(row.total_score ?? 0),
    maxScore: Number(row.max_score ?? 0),
    items: row.grade_result ?? [],
    error: row.error ?? undefined,
    createdAt: row.created_at,
    finishedAt: row.finished_at ?? undefined,
  };
}

export async function getSubmission(id: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToSubmission(data) : null;
}

export async function listSubmissions(): Promise<any[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToSubmission);
}
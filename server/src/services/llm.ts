import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import type { Request } from 'express';
import type { Message } from 'coze-coding-dev-sdk';
import type { Question } from '../data/seed';
import type { GradedItem } from '../data/store';

// 视觉大模型：读取答题卡图片，识别学生作答并对照参考答案要点打分
// 模型选择：doubao-seed-2-0-pro-260215（支持图片输入 + 文本输出）

const MODEL = 'doubao-seed-2-0-pro-260215';

function buildPrompt(questions: Question[]): string {
  const questionText = questions
    .map((q, i) => {
      const options = q.options ? `\n选项：${q.options.map((o, vi) => `${String.fromCharCode(65 + vi)}.${o}`).join('；')}` : '';
      return `题号${i + 1}（满分${q.maxPoints}分，题型：${q.type === 'essay' ? '材料题' : q.type === 'multi' ? '多选' : '单选'}）
题干：${q.stem}${options}
参考答案：${q.answer}`;
    })
    .join('\n\n');

  return `我是一名历史老师。请你作为批改助手，仔细识别我上传的《答题卡》图片中的学生作答，并对照题目参考答案进行批改。

下面是本卷的题目及参考答案（按题号顺序）：
${questionText}

请你：
1. 逐题识别图片中学生书写的答案（学生作答可能为手写，请尽量准确转写）。
2. 客观题（单选/多选）：对照参考答案判断正误；材料题：结合参考答案要点评阅，按要点覆盖程度和逻辑完整性在满分内给分。
3. 客观题 earnedPoints 为 0 或本题满分；材料题按采分点给 0~满分之间的整数。
4. 为每题给出简短的批改点评（feedback），材料题请说明给分依据与提升建议。

请严格只输出一个 JSON 数组，不要输出任何其他文字或 markdown，格式如下：
[
  {"studentAnswer":"学生作答文本","earnedPoints":0,"isCorrect":true,"feedback":"点评"},
  ...
]
数组长度必须与题目数量一致，且顺序对应。`;
}

export async function gradeAnswerSheet(
  imageUrl: string,
  questions: Question[],
  req: Request
): Promise<GradedItem[]> {
  const config = new Config();
  const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as any);
  const client = new LLMClient(config, customHeaders);

  const messages: Message[] = [
    {
      role: 'user',
      content: [
        { type: 'text', text: buildPrompt(questions) },
        { type: 'image_url', image_url: { url: imageUrl, detail: 'high' as const } },
      ],
    },
  ];

  const response = await client.invoke(messages, {
    model: MODEL,
    temperature: 0.2,
    thinking: 'disabled',
  });

  const content = response.content.trim();
  const jsonText = content.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const parsed = JSON.parse(jsonText);

  if (!Array.isArray(parsed) || parsed.length !== questions.length) {
    throw new Error('大模型返回的批改结果数量与题目数不一致');
  }

  return parsed.map((item: any, i: number) => {
    const q = questions[i];
    return {
      questionId: q.id,
      type: q.type,
      stem: q.stem,
      studentAnswer: String(item?.studentAnswer ?? '（未识别到作答）'),
      correctAnswer: q.answer,
      isCorrect: q.type === 'essay' ? null : Boolean(item?.isCorrect),
      earnedPoints: Math.max(0, Math.min(Number(item?.earnedPoints) || 0, q.maxPoints)),
      maxPoints: q.maxPoints,
      feedback: String(item?.feedback ?? ''),
    } as GradedItem;
  });
}
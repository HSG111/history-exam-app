import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { importQuestions, type Question } from '@/utils/api';

type ImportQuestion = Partial<Question> & {
  type: Question['type'];
  stem: string;
  answer: string;
};

const TYPE_OPTIONS: { key: Question['type']; label: string }[] = [
  { key: 'single', label: '单选' },
  { key: 'multi', label: '多选' },
  { key: 'essay', label: '材料题' },
];
const TOPICS = ['中国古代史', '中国近现代史', '世界史', '综合'];

function fieldCls() {
  return 'py-2.5 px-3 rounded-xl text-foreground';
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-3">
      <Text className="text-[12px] text-muted mb-1">{label}</Text>
      {children}
    </View>
  );
}

export default function ImportScreen() {
  const router = useSafeRouter();
  // 单题录入
  const [type, setType] = useState<'single' | 'multi' | 'essay'>('single');
  const [stem, setStem] = useState('');
  const [options, setOptions] = useState(''); // 每行一个选项
  const [answer, setAnswer] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [topic, setTopic] = useState('中国古代史');
  const [source, setSource] = useState('');
  const [maxPoints, setMaxPoints] = useState('3');
  // 批量模式
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [batchText, setBatchText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const buildSingle = () => {
    if (!stem.trim()) {
      Alert.alert('提示', '请输入题干');
      return null;
    }
    if (type !== 'essay' && !options.trim()) {
      Alert.alert('提示', '请填写选项（每行一个，如 A.xxx）');
      return null;
    }
    if (!answer.trim()) {
      Alert.alert('提示', '请填写参考答案');
      return null;
    }
    const opts = options
      .split('\n')
      .map((o) => o.trim().replace(/^[a-d][.、]\s*/i, ''))
      .filter(Boolean);
    return {
      type,
      stem: stem.trim(),
      options: type === 'essay' ? undefined : opts,
      answer: answer.trim(),
      analysis: analysis.trim(),
      topic,
      source: source.trim() || '手动录入',
      difficulty: 3,
      maxPoints: Number(maxPoints) || 3,
    };
  };

  const parseBatch = (): ImportQuestion[] => {
    // 格式：每行一条，字段以“|”分隔：
    // 题型|题干|选项A|选项B|选项C|选项D|答案|解析|主题|分值|来源
    const rows = batchText
      .split('\n')
      .map((r) => r.split('|').map((s) => s.trim()))
      .filter((r) => r.length >= 2 && r.join('') !== '');
    const questions: ImportQuestion[] = rows.map((r) => {
      const [t, stem, oa, ob, oc, od, ans, ana, topic, pts, src] = r;
      const type = (['multi', 'essay'].includes(t || '') ? t : 'single') as Question['type'];
      const opts = [oa, ob, oc, od].filter(Boolean);
      return {
        type,
        stem: stem || '',
        options: type === 'essay' ? undefined : opts,
        answer: ans || '',
        analysis: ana || '',
        topic: topic || '综合',
        source: src || '手动录入',
        difficulty: 3,
        maxPoints: pts ? Number(pts) : 3,
      };
    });
    return questions;
  };

  const handleSave = async () => {
    let questions: ImportQuestion[] = [];
    if (mode === 'single') {
      const q = buildSingle();
      if (!q) return;
      questions = [q];
    } else {
      questions = parseBatch();
      if (!questions.length) {
        Alert.alert('提示', '未解析到有效题目，请按格式填写');
        return;
      }
    }
    setSubmitting(true);
    try {
      const res = await importQuestions(questions);
      Alert.alert('成功', `已导入 ${res.imported} 道题目`);
      router.back();
    } catch (e) {
      Alert.alert('失败', String((e as Error).message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen safeAreaEdges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="px-4 pt-4 pb-3 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Text className="text-lg text-foreground">‹</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">录入题库</Text>
            <Text className="text-[12px] text-muted">答案经你校对后入库，保证批改准确</Text>
          </View>
        </View>

        {/* 模式切换 */}
        <View className="flex-row gap-2 px-4 mb-3">
          {(
            [
              { key: 'single', label: '单题录入' },
              { key: 'batch', label: '批量粘贴' },
            ] as const
          ).map((m) => (
            <TouchableOpacity
              key={m.key}
              onPress={() => setMode(m.key)}
              className={`px-4 py-1.5 rounded-full ${mode === m.key ? 'bg-accent' : 'bg-surface'}`}
            >
              <Text className={`text-[13px] ${mode === m.key ? 'text-white font-semibold' : 'text-foreground'}`}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          className="flex-1 px-4"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {mode === 'single' ? (
            <>
              <Section label="题型">
                <View className="flex-row gap-2">
                  {TYPE_OPTIONS.map((t) => (
                    <TouchableOpacity
                      key={t.key}
                      onPress={() => setType(t.key)}
                      className={`flex-1 items-center py-2 rounded-lg ${type === t.key ? 'bg-accent' : 'bg-surface'}`}
                    >
                      <Text className={`text-[13px] ${type === t.key ? 'text-white font-semibold' : 'text-foreground'}`}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Section>

              <Section label="题干（材料题可换行）">
                <TextInput
                  className={`${fieldCls()} bg-surface`}
                  placeholder="请输入题干…"
                  placeholderTextColor="#9ca3af"
                  multiline
                  value={stem}
                  onChangeText={setStem}
                  selectionColorClassName="accent-blue-500"
                />
              </Section>

              {type !== 'essay' && (
                <Section label="选项（每行一个，无需写 ABCD）">
                  <TextInput
                    className={`${fieldCls()} bg-surface`}
                    placeholder={'A. 选项一\nB. 选项二\nC. 选项三\nD. 选项四'}
                    placeholderTextColor="#9ca3af"
                    multiline
                    value={options}
                    onChangeText={setOptions}
                    selectionColorClassName="accent-blue-500"
                  />
                </Section>
              )}

              <Section label="参考答案（单选填字母如 B；多选如 ABC；材料题填要点）">
                <TextInput
                  className={`${fieldCls()} bg-surface`}
                  placeholder={type === 'essay' ? '参考答案要点…' : '如：B 或 ABD'}
                  placeholderTextColor="#9ca3af"
                  multiline={type === 'essay'}
                  value={answer}
                  onChangeText={setAnswer}
                  selectionColorClassName="accent-blue-500"
                />
              </Section>

              <Section label="解析（选填）">
                <TextInput
                  className={`${fieldCls()} bg-surface`}
                  placeholder="本题解析…"
                  placeholderTextColor="#9ca3af"
                  multiline
                  value={analysis}
                  onChangeText={setAnalysis}
                  selectionColorClassName="accent-blue-500"
                />
              </Section>

              <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                  <Text className="text-[12px] text-muted mb-1">主题</Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {TOPICS.map((tp) => (
                      <TouchableOpacity
                        key={tp}
                        onPress={() => setTopic(tp)}
                        className={`px-2.5 py-1 rounded-full ${topic === tp ? 'bg-accent' : 'bg-surface'}`}
                      >
                        <Text className={`text-[12px] ${topic === tp ? 'text-white' : 'text-foreground'}`}>{tp}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={{ width: 80 }}>
                  <Text className="text-[12px] text-muted mb-1">分值</Text>
                  <TextInput
                    className={`${fieldCls()} bg-surface`}
                    placeholder="3"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    value={maxPoints}
                    onChangeText={setMaxPoints}
                  />
                </View>
              </View>

              <Section label="来源（选填，如 2023年湖北卷·人教版必修一）">
                <TextInput
                  className={`${fieldCls()} bg-surface`}
                  placeholder="来源"
                  placeholderTextColor="#9ca3af"
                  value={source}
                  onChangeText={setSource}
                  selectionColorClassName="accent-blue-500"
                />
              </Section>
            </>
          ) : (
            <Section label="批量粘贴（每行一条，字段用 | 分隔，前两项必填）">
              <Text className="text-[12px] text-muted mb-2">
                格式：题型|题干|选项A|选项B|选项C|选项D|答案|解析|主题|分值|来源
                {'\n'}示例：
                {'\n'}single|宋代坊市制度被打破的根本原因是什么？|政府放松管制|人口剧增|海外贸易|纸币推广|A|宋代商品经济发展冲击了旧格局|中国古代史|3|2023湖北卷
                {'\n'}multi|下列属于明治维新的内容有？|废藩置县|殖产兴业|议会改革|保留幕府|AC|…|世界史|4|模拟
              </Text>
              <TextInput
                className={`${fieldCls()} bg-surface`}
                placeholder="粘贴题目文本…"
                placeholderTextColor="#9ca3af"
                multiline
                textAlignVertical="top"
                style={{ minHeight: 180, height: 240 }}
                value={batchText}
                onChangeText={setBatchText}
                selectionColorClassName="accent-blue-500"
              />
              <Text className="text-[12px] text-muted mt-1">解析为空的分隔段可省略或留空。</Text>
            </Section>
          )}

          {/* 保存 */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={submitting}
            className="bg-accent rounded-xl py-3.5 items-center mt-2"
          >
            <Text className="text-white font-semibold text-[15px]">
              {submitting ? '提交中…' : mode === 'single' ? '保存本题' : '批量导入'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
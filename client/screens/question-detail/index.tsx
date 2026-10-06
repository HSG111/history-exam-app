import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { getQuestion, TYPE_LABEL, type Question } from '@/utils/api';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export default function QuestionDetailScreen() {
  const { id } = useSafeSearchParams<{ id: string }>();
  const router = useSafeRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getQuestion(id)
      .then((res) => setQuestion(res.item))
      .catch((e) => console.log('load question error', e))
      .finally(() => setLoading(false));
  }, [id]);

  // 段落拆分：按\n分割题干
  const stemParagraphs = question ? question.stem.split('\n').filter((s) => s.trim() !== '') : [];

  return (
    <Screen statusBarStyle="dark">
      {/* 导航栏 */}
      <View className="flex-row items-center px-3 pt-3 pb-2" style={{ paddingTop: 0 }}>
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 items-center justify-center rounded-full bg-surface">
          <FontAwesome6 name="arrow-left" size={16} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text className="text-[15px] font-semibold text-foreground">题目详情</Text>
        </View>
        <View className="w-9" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4f46e5" />
        </View>
      ) : question ? (
        <ScrollView className="flex-1 px-4 pb-28">
          {/* 元信息 */}
          <View className="flex-row items-center gap-2 mb-3">
            <Text className="text-[11px] px-2 py-0.5 rounded-md text-accent bg-accent/10 font-semibold">{TYPE_LABEL[question.type]}</Text>
            <Text className="text-[11px] text-muted">{question.maxPoints}分</Text>
            <Text className="text-[11px] text-muted">·</Text>
            <Text className="text-[11px] text-muted">{question.topic}</Text>
          </View>

          {/* 题干 */}
          <View className="bg-surface rounded-2xl p-4 mb-3 shadow-sm" style={{ shadowColor: '#4f46e5', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
            {stemParagraphs.map((p, i) => (
              <Text key={i} className="text-[16px] leading-7 text-foreground mb-1">{p}</Text>
            ))}
            {question.type !== 'essay' && question.options && (
              <View className="mt-3 space-y-2">
                {question.options.map((opt, i) => (
                  <View key={i} className="flex-row items-start gap-2 py-1">
                    <View className="w-6 h-6 rounded-lg bg-accent/10 items-center justify-center">
                      <Text className="text-[12px] font-bold text-accent">{OPTION_LABELS[i]}</Text>
                    </View>
                    <Text className="flex-1 text-[15px] leading-6 text-foreground">{opt}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 答案与解析 */}
          {showAnswer ? (
            <View className="bg-surface rounded-2xl p-4 shadow-sm" style={{ shadowColor: '#4f46e5', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
              <Text className="text-[15px] font-semibold text-foreground mb-2">参考答案</Text>
              <Text className="text-[15px] leading-6 text-accent font-bold mb-3">{question.answer}</Text>
              <View className="border-t border-border/60 pt-3">
                <Text className="text-[13px] font-semibold text-foreground mb-1.5">解析</Text>
                <Text className="text-[14px] leading-6 text-foreground/80">{question.analysis}</Text>
              </View>
              <View className="mt-4 bg-muted/20 rounded-xl p-3">
                <Text className="text-[12px] text-muted">来源：{question.source}</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowAnswer(true)}
              className="bg-accent rounded-2xl py-3.5 items-center"
            >
              <Text className="text-white font-semibold">查看答案与解析</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">题目不存在</Text>
        </View>
      )}
    </Screen>
  );
}
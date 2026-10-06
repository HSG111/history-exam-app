import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { getSubmission, TYPE_LABEL, type Submission } from '@/utils/api';

export default function ReportScreen() {
  const { id } = useSafeSearchParams<{ id: string }>();
  const router = useSafeRouter();
  const [sub, setSub] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async (sid: string) => {
    try {
      const data = await getSubmission(sid);
      setSub(data.submission);
      if (data.submission.status === 'processing') {
        ensurePoll(sid);
      } else {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch (e) {
      console.log('load submission error', e);
    } finally {
      setLoading(false);
    }
  };

  const ensurePoll = (sid: string) => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      getSubmission(sid)
        .then((data) => {
          setSub(data.submission);
          if (data.submission.status !== 'processing' && pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        })
        .catch(() => undefined);
    }, 2000);
  };

  useEffect(() => {
    if (!id) return;
    load(id);
  }, [id]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const isProcessing = sub?.status === 'processing';
  const rate = sub && sub.maxScore ? Math.round((sub.totalScore / sub.maxScore) * 100) : 0;

  const renderHeader = () => (
    <View>
      {/* 导航栏 */}
      <View className="flex-row items-center px-2 py-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 items-center justify-center rounded-full bg-surface">
          <FontAwesome6 name="arrow-left" size={16} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text className="text-[15px] font-semibold text-foreground">批改报告</Text>
        </View>
        <View className="w-9" />
      </View>

      {/* 得分卡片 */}
      <View className="mx-1 bg-accent rounded-3xl p-5 mb-4 overflow-hidden">
        <Text className="text-white/80 text-[13px]">学生 {sub?.studentName} · {sub?.paperTitle}</Text>
        <View className="flex-row items-end mt-2">
          <Text className="text-white text-[44px] font-bold leading-none">{isProcessing ? '--' : sub?.totalScore}</Text>
          <Text className="text-white/70 text-[16px] mb-1 ml-1">/ {sub?.maxScore} 分</Text>
        </View>
        {!isProcessing && (
          <View className="flex-row items-center gap-2 mt-3">
            <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)' }}>
              <View style={{ width: `${rate}%`, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />
            </View>
            <Text className="text-white text-[13px] font-semibold">{rate}%</Text>
          </View>
        )}
      </View>

      {/* 答题卡预览 */}
      {sub?.imageUrl && (
        <View className="mx-1 mb-4">
          <Text className="text-[13px] font-semibold text-foreground mb-2">答题卡预览</Text>
          <Image source={{ uri: sub.imageUrl }} className="w-full h-48 rounded-2xl" resizeMode="contain" style={{ backgroundColor: '#f3f4f6' }} />
        </View>
      )}

      {isProcessing && (
        <View className="flex-row items-center gap-2 mx-1 mb-4 bg-purple-50 rounded-xl p-3">
          <ActivityIndicator color="#9333ea" />
          <Text className="text-purple-700 text-[13px]">AI 正在逐题批改，请稍候…</Text>
        </View>
      )}

      {sub?.status === 'failed' && (
        <View className="mx-1 mb-4 bg-red-50 rounded-xl p-3">
          <Text className="text-red-600 text-[13px]">批改失败：{sub.error || '未知错误'}</Text>
        </View>
      )}

      {sub && sub.status === 'done' && (
        <Text className="text-[13px] font-semibold text-foreground mb-2 mx-1">逐题批改详情</Text>
      )}
    </View>
  );

  const renderItem = ({ item, index }: { item: Submission['items'][number]; index: number }) => (
    <View className="bg-surface rounded-2xl p-4 mb-3" style={{ shadowColor: '#4f46e5', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 1 }}>
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View className="w-7 h-7 rounded-lg bg-accent/10 items-center justify-center">
            <Text className="text-[12px] font-bold text-accent">{index + 1}</Text>
          </View>
          <Text className="text-[12px] px-2 py-0.5 rounded-md bg-muted/20 text-muted">{TYPE_LABEL[item.type]}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          {item.isCorrect != null && (
            <FontAwesome6 name={item.isCorrect ? 'circle-check' : 'circle-xmark'} size={15} color={item.isCorrect ? '#059669' : '#dc2626'} />
          )}
          <Text className={`text-[16px] font-bold ${item.isCorrect === false ? 'text-red-500' : 'text-accent'}`}>
            {item.earnedPoints}<Text className="text-[11px] text-muted font-normal">/{item.maxPoints}</Text>
          </Text>
        </View>
      </View>
      <Text numberOfLines={2} className="text-[14px] leading-5 text-foreground/90 mb-2">{item.stem}</Text>

      {item.type !== 'essay' && (
        <Text className="text-[12px] leading-5 text-muted mb-1">
          参考答案：<Text className="text-foreground">{item.correctAnswer}</Text>
          {item.studentAnswer ? ` 学生作答：${item.studentAnswer}` : ''}
        </Text>
      )}
      {item.type === 'essay' && (
        <Text className="text-[12px] leading-5 text-muted mb-1">
          学生作答（识别）：{item.studentAnswer || '未识别'}
        </Text>
      )}
      <View className="border-t border-border/60 mt-2 pt-2">
        {item.feedback && item.feedback !== '' && (
          <Text className="text-[13px] leading-5 text-foreground/75">{item.feedback}</Text>
        )}
      </View>
    </View>
  );

  return (
    <Screen statusBarStyle="dark">
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4f46e5" />
        </View>
      ) : sub ? (
        <FlatList
          className="flex-1 px-3"
          data={sub.status === 'done' ? sub.items : []}
          keyExtractor={(item, index) => `${item.questionId}-${index}`}
          ListHeaderComponent={renderHeader}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">记录不存在</Text>
        </View>
      )}
    </Screen>
  );
}
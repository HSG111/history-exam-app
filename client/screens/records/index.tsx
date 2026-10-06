import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { getSubmissions, type Submission } from '@/utils/api';

const STATUS_MAP: Record<Submission['status'], { label: string; color: string; bg: string }> = {
  processing: { label: '批改中', color: '#9333ea', bg: '#f3e8ff' },
  done: { label: '已完成', color: '#059669', bg: '#d1fae5' },
  failed: { label: '失败', color: '#dc2626', bg: '#fee2e2' },
};

export default function RecordsScreen() {
  const router = useSafeRouter();
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSubmissions();
      setItems(data.items);
    } catch (e) {
      console.log('load submissions error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const renderItem = ({ item }: { item: Submission }) => {
    const st = STATUS_MAP[item.status] ?? STATUS_MAP.failed;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push('/report', { id: item.id })}
        className="bg-surface rounded-2xl p-4 mb-3"
        style={{ shadowColor: '#4f46e5', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-[15px] font-semibold text-foreground flex-1 mr-2">{item.paperTitle}</Text>
          <View className={`px-2 py-0.5 rounded-full`} style={{ backgroundColor: st.bg }}>
            <Text className="text-[11px] font-semibold" style={{ color: st.color }}>{st.label}</Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[12px] text-muted">学生：{item.studentName}</Text>
            <Text className="text-[11px] text-muted mt-0.5">{item.createdAt.slice(0, 16).replace('T', ' ')}</Text>
          </View>
          {item.status === 'done' ? (
            <View className="items-end">
              <Text className="text-[22px] font-bold text-accent">{item.totalScore}<Text className="text-[12px] text-muted font-normal">/{item.maxScore}</Text></Text>
              <Text className="text-[11px] text-muted">得分率 {item.maxScore ? Math.round((item.totalScore / item.maxScore) * 100) : 0}%</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen safeAreaEdges={['left', 'right', 'bottom']}>
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-foreground">批改记录</Text>
        <Text className="text-[13px] text-muted mt-1">查看历次答卷与诊断报告</Text>
      </View>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          className="flex-1 px-4"
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <FontAwesome6 name="clock-rotate-left" size={40} color="#c7c7d4" />
              <Text className="text-muted mt-4 text-sm">暂无批改记录</Text>
              <Text className="text-muted/70 mt-1 text-xs">前往「智能批改」上传第一份答题卡</Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}
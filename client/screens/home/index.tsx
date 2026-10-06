import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { searchQuestions, TYPE_LABEL, type Question } from '@/utils/api';

const FILTERS = [
  { key: '', label: '全部' },
  { key: 'single', label: '单选' },
  { key: 'multi', label: '多选' },
  { key: 'essay', label: '材料题' },
];

function DifficultyDots({ level }: { level: number }) {
  return (
    <View className="flex-row items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i <= level ? 'bg-accent' : 'bg-muted/30'}`}
        />
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const router = useSafeRouter();
  const [keyword, setKeyword] = useState('');
  const [activeType, setActiveType] = useState('');
  const [items, setItems] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (kw: string, type: string) => {
    setLoading(true);
    try {
      const data = await searchQuestions({ keyword: kw, type });
      setItems(data.items);
    } catch (e) {
      console.log('search error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load('', '');
    }, [load])
  );

  // 页面内顶部子 Tab：按题型筛选
  const handleFilter = (key: string) => {
    setActiveType(key);
    load(keyword, key);
  };

  const handleSearch = () => load(keyword, activeType);

  const renderItem = ({ item }: { item: Question }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      className="bg-surface rounded-2xl p-4 mb-3 shadow-sm"
      style={{ shadowColor: '#4f46e5', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}
      onPress={() => router.push('/question-detail', { id: item.id })}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View className="bg-accent/10 rounded-lg px-2 py-0.5">
            <Text className="text-[11px] font-semibold text-accent">{TYPE_LABEL[item.type]}</Text>
          </View>
          <Text className="text-[11px] text-muted">{item.difficulty} 星难度</Text>
        </View>
        <DifficultyDots level={item.difficulty} />
      </View>
      <Text numberOfLines={2} className="text-[15px] leading-6 text-foreground font-medium">
        {item.stem}
      </Text>
      <View className="mt-3 pt-3 border-t border-border/60 flex-row items-center justify-between">
        <Text className="text-[11px] text-muted">{item.topic}</Text>
        <Text className="text-[11px] text-muted">{item.maxPoints}分</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Screen safeAreaEdges={['left', 'right', 'bottom']}>
      <View
        className="px-4 pt-4 pb-3"
        style={{ backgroundColor: 'transparent' }}
      >
        <Text className="text-2xl font-bold text-foreground">湖北历史题库</Text>
        <Text className="text-[13px] text-muted mt-1">搜教材习题 · 近五年湖北高考历史卷</Text>

        {/* 搜索框 */}
        <View className="flex-row items-center gap-2 mt-3">
          <View className="flex-1 flex-row items-center bg-surface rounded-xl px-3" style={{ borderWidth: 1, borderColor: 'transparent' }}>
            <FontAwesome6 name="magnifying-glass" size={14} color="#9ca3af" />
            <TextInput
              className="flex-1 py-2.5 px-2 text-foreground"
              placeholder="输入关键词搜索题目…"
              placeholderTextColor="#9ca3af"
              value={keyword}
              onChangeText={setKeyword}
              onSubmitEditing={handleSearch}
            />
            {keyword !== '' && (
              <TouchableOpacity onPress={() => { setKeyword(''); load('', activeType); }}>
                <FontAwesome6 name="circle-xmark" size={14} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={handleSearch} className="bg-accent rounded-xl px-4 py-2.5">
            <Text className="text-white font-semibold text-sm">搜索</Text>
          </TouchableOpacity>
        </View>

        {/* 题型筛选 */}
        <View className="flex-row items-center gap-2 mt-3">
          {FILTERS.map((f) => {
            const active = activeType === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => handleFilter(f.key)}
                className={`px-3 py-1.5 rounded-full ${active ? 'bg-accent' : 'bg-surface'}`}
              >
                <Text className={`text-[12px] ${active ? 'text-white font-semibold' : 'text-foreground'}`}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <FontAwesome6 name="book-open" size={40} color="#c7c7d4" />
              <Text className="text-muted mt-4 text-sm">没有找到相关题目</Text>
              <Text className="text-muted/70 mt-1 text-xs">试试更换关键词或筛选条件</Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}
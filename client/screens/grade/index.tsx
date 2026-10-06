import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import {
  getPapers,
  createSubmission,
  getSubmission,
  type PaperSummary,
  type Submission,
} from '@/utils/api';

export default function GradeScreen() {
  const router = useSafeRouter();
  const [papers, setPapers] = useState<PaperSummary[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<PaperSummary | null>(null);
  const [studentName, setStudentName] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadPapers = useCallback(async () => {
    try {
      const data = await getPapers();
      setPapers(data.items);
    } catch (e) {
      console.log('load papers error', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPapers();
      // 重置状态
      setSelectedPaper(null);
      setImageUri(null);
      setSubmissionId(null);
    }, [loadPapers])
  );

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('需要相册权限', '请在系统设置中允许访问相册后重试');
        return;
      }
      setPicking(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.log('pick image error', e);
    } finally {
      setPicking(false);
    }
  };

  // 轮询批改结果
  const pollSubmission = (id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const data = await getSubmission(id);
        const sub = data.submission;
        if (sub.status === 'done') {
          if (pollRef.current) clearInterval(pollRef.current);
          setSubmissionId(null);
          router.push('/report', { id });
        } else if (sub.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current);
          setSubmissionId(null);
          Alert.alert('批改失败', sub.error || '请重试');
        }
      } catch (e) {
        console.log('poll error', e);
      }
    }, 2500);
  };

  const handleSubmit = async () => {
    if (!selectedPaper) {
      Alert.alert('提示', '请选择一份试卷');
      return;
    }
    if (!imageUri) {
      Alert.alert('提示', '请上传答题卡图片');
      return;
    }
    if (!studentName.trim()) {
      Alert.alert('提示', '请输入学生姓名');
      return;
    }
    setSubmitting(true);
    try {
      const fileName = `answer-${Date.now()}.jpg`;
      const data = await createSubmission({
        fileUri: imageUri,
        fileName,
        paperId: selectedPaper.id,
        studentName: studentName.trim(),
      });
      setSubmissionId(data.submission.id);
      Alert.alert('提交成功', '正在智能批改，请稍候…');
      pollSubmission(data.submission.id);
    } catch (e) {
      Alert.alert('提交失败', e instanceof Error ? e.message : '网络错误');
    } finally {
      setSubmitting(false);
    }
  };

  const isGrading = submitting || submissionId !== null;

  return (
    <Screen safeAreaEdges={['left', 'right', 'bottom']}>
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-foreground">智能批改</Text>
        <Text className="text-[13px] text-muted mt-1">上传答题卡，AI 对照答案自动阅卷</Text>
      </View>

      <ScrollView className="flex-1 px-4 pb-28">
        {/* 选择试卷 */}
        <Text className="text-[13px] font-semibold text-foreground mb-2 mt-1">选择试卷</Text>
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ gap: 10 }}>
          {papers.map((p) => {
            const active = selectedPaper?.id === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => setSelectedPaper(p)}
                className={`rounded-2xl p-3 w-44 ${active ? 'bg-accent' : 'bg-surface'}`}
                style={!active ? { shadowColor: '#4f46e5', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 } : undefined}
              >
                <View className="flex-row items-center gap-1.5 mb-1">
                  <View className={`px-1.5 py-0.5 rounded-md ${active ? 'bg-white/20' : 'bg-amber/20'}`}>
                    <Text className={`text-[10px] font-bold ${active ? 'text-white' : 'text-amber'}`}>{p.year}</Text>
                  </View>
                  <Text className={`text-[10px] ${active ? 'text-white/80' : 'text-muted'}`}>{p.questionCount}题</Text>
                </View>
                <Text numberOfLines={2} className={`text-[13px] leading-5 font-semibold ${active ? 'text-white' : 'text-foreground'}`}>
                  {p.title}
                </Text>
                <Text className={`text-[11px] mt-1.5 ${active ? 'text-white/80' : 'text-muted'}`}>满分 {p.maxScore} 分</Text>
              </TouchableOpacity>
            );
          })}
          </ScrollView>
        </View>

        {/* 学生姓名 */}
        <Text className="text-[13px] font-semibold text-foreground mb-2">学生姓名</Text>
        <View className="flex-row items-center bg-surface rounded-xl px-3 mb-4" style={{ borderWidth: 1, borderColor: 'transparent' }}>
          <FontAwesome6 name="user" size={14} color="#9ca3af" />
          <TextInput
            className="flex-1 py-3 px-2 text-foreground"
            placeholder="请输入姓名"
            placeholderTextColor="#9ca3af"
            value={studentName}
            onChangeText={setStudentName}
          />
        </View>

        {/* 上传答题卡 */}
        <Text className="text-[13px] font-semibold text-foreground mb-2">上传答题卡</Text>
        <TouchableOpacity
          onPress={pickImage}
          activeOpacity={0.8}
          className="bg-surface rounded-2xl overflow-hidden mb-4"
          style={{ borderWidth: 1, borderColor: 'rgba(79,70,229,0.15)', borderStyle: 'dashed' }}
        >
          {imageUri ? (
            <View>
              <Image source={{ uri: imageUri }} className="w-full h-52" resizeMode="cover" />
              <View className="absolute bottom-2 right-2 bg-black/60 rounded-lg px-2.5 py-1.5 flex-row items-center gap-1.5">
                <FontAwesome6 name="rotate" size={12} color="#fff" />
                <Text className="text-white text-[12px]">重新选择</Text>
              </View>
            </View>
          ) : (
            <View className="items-center justify-center py-12">
              <FontAwesome6 name="image" size={36} color="#c7c7d4" />
              <Text className="text-foreground mt-3 text-sm font-medium">点击上传答题卡照片</Text>
              <Text className="text-muted mt-1 text-xs">支持相册选图，清晰拍摄便于识别</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 提交 */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isGrading}
          className={`rounded-2xl py-4 items-center ${isGrading ? 'bg-muted' : 'bg-accent'}`}
          style={!isGrading ? { shadowColor: '#4f46e5', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 } : undefined}
        >
          {isGrading ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#fff" />
              <Text className="text-white font-semibold">批改中…</Text>
            </View>
          ) : (
            <Text className="text-white font-semibold text-[16px]">开始智能批改</Text>
          )}
        </TouchableOpacity>

        {picking && <Text className="text-center text-muted text-xs mt-3">正在打开相册…</Text>}
      </ScrollView>
    </Screen>
  );
}
// 种子数据：湖北高考历史试卷与题库（示例题目，供演示）
export interface Question {
  id: string;
  type: 'single' | 'multi' | 'essay'; // 单选 / 多选 / 材料分析题
  stem: string;
  options?: string[];      // 客观题选项（A. xx）
  answer: string;          // 参考答案（单选为字母，材料题为要点概述）
  analysis: string;        // 解析
  source: string;          // 来源，如：2024年湖北普通高中学业水平选择性考试·历史
  topic: string;           // 主题（中国古代史 / 中国近现代史 / 世界史）
  difficulty: number;      // 1-5
  maxPoints: number;       // 分值
}

export interface Paper {
  id: string;
  title: string;           // 试卷名称
  year: string;            // 年份
  source: string;          // 来源
  questionIds: string[];   // 组成该卷的题目 id 列表（按顺序作答）
}

// 客观题（题库）
const Q_MC: Question[] = [
  {
    id: 'hb-single-001',
    type: 'single',
    stem: '秦统一六国后，为加强中央对地方的控制，在全国范围内普遍推行的地方行政制度是（ ）',
    options: ['分封制', '郡县制', '行省制', '三省六部制'],
    answer: 'B',
    analysis: '秦统一后废除分封制，在全国推行郡县制，郡县长官由皇帝直接任免，加强了中央集权。',
    source: '2024年湖北普通高中学业水平选择性考试·历史',
    topic: '中国古代史',
    difficulty: 2,
    maxPoints: 3,
  },
  {
    id: 'hb-single-002',
    type: 'single',
    stem: '宋代出现了"坊市不分、街巷相通"的商业格局，其直接原因是（ ）',
    options: ['政府放松了对商业时空的限制', '海外贸易的兴盛', '城市人口的急剧膨胀', '纸币"交子"的广泛流通'],
    answer: 'A',
    analysis: '宋代城市商业活动突破了坊市分离、日中为市的旧格局，根源在于政府对商业管理的放松，坊市界限被打破。',
    source: '2024年湖北普通高中学业水平选择性考试·历史',
    topic: '中国古代史',
    difficulty: 3,
    maxPoints: 3,
  },
  {
    id: 'hb-single-003',
    type: 'single',
    stem: '洋务运动时期，张之洞创办的近代民用企业"汉阳铁厂"位于（ ）',
    options: ['上海', '湖北', '天津', '福州'],
    answer: 'B',
    analysis: '汉阳铁厂位于湖北汉阳，是中国近代最早的官办钢铁企业，是洋务派"自强求富"、以民用工业辅助军事工业的代表。',
    source: '2023年湖北普通高中学业水平选择性考试·历史',
    topic: '中国近现代史',
    difficulty: 2,
    maxPoints: 3,
  },
  {
    id: 'hb-single-004',
    type: 'single',
    stem: '1912年元旦，中华民国临时政府成立。其性质是（ ）',
    options: ['地主阶级专政', '资产阶级共和国政府', '工农联合政府', '封建军阀政府'],
    answer: 'B',
    analysis: '辛亥革命推翻清王朝，建立中华民国临时政府，是资产阶级革命派建立的资产阶级共和国性质政权。',
    source: '2023年湖北普通高中学业水平选择性考试·历史',
    topic: '中国近现代史',
    difficulty: 2,
    maxPoints: 3,
  },
  {
    id: 'hb-single-005',
    type: 'single',
    stem: '新航路开辟后，欧洲商业格局发生重大变化，下列表述正确的是（ ）',
    options: ['商路中心由地中海沿岸转移到大西洋沿岸', '亚洲成为世界贸易中心', '意大利城市重现繁荣', '陆上丝绸之路完全中断'],
    answer: 'A',
    analysis: '新航路开辟使欧洲贸易的中心从地中海沿岸转移到大西洋沿岸，意大利衰落，西欧国家崛起，世界市场开始形成。',
    source: '2022年湖北普通高中学业水平选择性考试·历史',
    topic: '世界史',
    difficulty: 2,
    maxPoints: 3,
  },
  {
    id: 'hb-single-006',
    type: 'single',
    stem: '启蒙运动的核心思想是（ ）',
    options: ['人文主义', '理性主义', '自由主义', '唯物主义'],
    answer: 'B',
    analysis: '启蒙运动以理性为核心，主张运用理性批判封建专制制度和宗教迷信，构建资产阶级理性王国的蓝图。',
    source: '2022年湖北普通高中学业水平选择性考试·历史',
    topic: '世界史',
    difficulty: 2,
    maxPoints: 3,
  },
  {
    id: 'hb-multi-001',
    type: 'multi',
    stem: '下列关于抗日战争的说法，正确的有（ ）',
    options: ['全民族抗战实现，敌后战场与正面战场相互配合', '"九一八事变"标志中国全民族抗战正式开始', '全国抗战发生于1937年', '中国共产党在全民族抗战中发挥了中流砥柱的作用'],
    answer: 'ACD',
    analysis: '全民族抗战于1937年"七七事变"后全面爆发，"九一八事变"是局部抗战的开始，故B错。抗战中形成正面与敌后两个战场，中共起中流砥柱作用。',
    source: '2023年湖北普通高中学业水平选择性考试·历史',
    topic: '中国近现代史',
    difficulty: 3,
    maxPoints: 4,
  },
  {
    id: 'hb-multi-002',
    type: 'multi',
    stem: '工业革命对世界历史产生了深远影响，主要表现在（ ）',
    options: ['极大提高了社会生产力', '推动了城市化进程', '加剧了环境污染等问题', '使所有国家同步实现了工业化'],
    answer: 'ABC',
    analysis: '工业革命极大提高生产力、推动城市化、也带来环境与贫富分化等问题；但各国工业化进程并不同步，D表述错误。',
    source: '2022年湖北普通高中学业水平选择性考试·历史',
    topic: '世界史',
    difficulty: 3,
    maxPoints: 4,
  },
];

// 材料分析题（主观题）
const Q_ESSAY: Question[] = [
  {
    id: 'hb-essay-001',
    type: 'essay',
    stem: '阅读下列材料，回答问题。\n材料一："为政以德，譬如北辰，居其所而众星共之。"——孔子\n材料二：董仲舒主张"罢黜百家，独尊儒术"，使儒学取得正统地位。\n根据材料并结合所学知识，概括儒家思想从春秋到西汉地位的变化，并分析其原因。',
    answer: '参考答案要点：（1）变化：春秋战国时期儒家仅是诸子百家之一，不受重视；汉武帝时期确立为官方正统思想。（2）原因：儒学强调大一统、维护封建等级秩序符合统治者需要；董仲舒对儒学进行改造，兼采法家、道家等思想；汉武帝为加强中央集权大力扶持。',
    analysis: '本题考查儒家思想地位演变。注意结合春秋"礼崩乐坏"与汉武帝"大一统"的时代背景，要点须完整、逻辑清晰、史论结合。',
    source: '2024年湖北普通高中学业水平选择性考试·历史',
    topic: '中国古代思想史',
    difficulty: 4,
    maxPoints: 12,
  },
  {
    id: 'hb-essay-002',
    type: 'essay',
    stem: '材料：20世纪初，辛亥革命推翻清王朝，建立中华民国。\n根据所学知识，论述辛亥革命的历史功绩及其历史局限性。',
    answer: '参考答案要点：（1）功绩：推翻了清王朝与封建帝制；建立资产阶级共和国，使民主共和观念深入人心；促进了资本主义发展和社会风俗变革。（2）局限性：未能改变中国半殖民地半封建的社会性质，未完成反帝反封建的历史任务，革命果实被袁世凯篡夺。',
    analysis: '坚持"一分为二"评价历史事件，既要充分肯定功绩，又要指出阶级与时代的局限，史论结合、条理清晰。',
    source: '2023年湖北普通高中学业水平选择性考试·历史',
    topic: '中国近现代史',
    difficulty: 4,
    maxPoints: 12,
  },
  {
    id: 'hb-essay-003',
    type: 'essay',
    stem: '材料：地理大发现之后，世界日益连为一个整体。\n结合所学知识，分析新航路开辟对世界历史进程的积极影响与消极影响。',
    answer: '参考答案要点：（1）积极：结束了世界各地相对孤立的状态，世界市场开始形成；促进了欧洲资本主义发展和物种、文化大交流。（2）消极：伴随殖民掠夺与黑奴贸易，给亚非拉人民带来深重灾难；加剧了西方对东方的殖民压迫。',
    analysis: '运用全球史观与辩证思维评价新航路开辟，注意从"世界整体化"与"殖民侵略"两个维度作答。',
    source: '2022年湖北普通高中学业水平选择性考试·历史',
    topic: '世界史',
    difficulty: 4,
    maxPoints: 12,
  },
];

export const QUESTIONS: Question[] = [...Q_MC, ...Q_ESSAY];

// 试卷（由题目组成，学生按卷作答并上传答题卡）
export const PAPERS: Paper[] = [
  {
    id: 'paper-2024',
    title: '2024年湖北高考历史卷（精编）',
    year: '2024',
    source: '2024年湖北普通高中学业水平选择性考试',
    questionIds: ['hb-single-001', 'hb-single-002', 'hb-essay-001'],
  },
  {
    id: 'paper-2023',
    title: '2023年湖北高考历史卷（精编）',
    year: '2023',
    source: '2023年湖北普通高中学业水平选择性考试',
    questionIds: ['hb-single-003', 'hb-single-004', 'hb-multi-001', 'hb-essay-002'],
  },
  {
    id: 'paper-2022',
    title: '2022年湖北高考历史卷（精编）',
    year: '2022',
    source: '2022年湖北普通高中学业水平选择性考试',
    questionIds: ['hb-single-005', 'hb-single-006', 'hb-multi-002', 'hb-essay-003'],
  },
];

export const QUESTION_MAP: Record<string, Question> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q])
);
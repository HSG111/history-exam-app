# 历史备考助手（History Exam App）

基于 **高中历史教材 + 历年全国/湖北高考历史真题** 打造的移动端备考应用。学生可以**按关键词搜索历史题库**、**上传答题卡图片自动批改**，并随时回看批改报告。

---

## ✨ 功能特性

| 功能 | 说明 |
| --- | --- |
| 🔍 题库搜索 | 按关键词、题型(单选/多选/材料)、年份来源筛选检索；题目含题干、选项、参考答案与解析 |
| ✍️ 智能批改 | 选择试卷 → 上传答题卡照片 → AI 视觉模型读取作答并与答案要点对照，逐题给分、判对错、附点评，自动汇总总分 |
| 📁 批改记录 | 历史提交列表与完整批改报告回看，追踪复习进度 |

---

## 🧱 技术栈

- **前端**：Expo 54 + React Native + expo-router（底部 Tab 导航）+ TailwindCSS(Uniwind) + expo-image-picker
- **后端**：Express.js（ES Module）+ Multer（文件上传）+ 豆包视觉大模型（答题卡识别与批改）+ S3 兼容对象存储（答题卡图片）
- **持久化**：服务端 JSON 文件存储（题库 / 试卷 / 批改记录），开箱即用、无需额外数据库配置

---

## 📁 目录结构

```
├── client/                     # React Native 前端
│   ├── app/                    # Expo Router 路由（含底部 Tab）
│   │   ├── _layout.tsx
│   │   ├── (tabs)/             # 首页(题库) / 智能批改 / 记录
│   │   ├── question-detail.tsx
│   │   └── report.tsx
│   ├── screens/                # 页面实现
│   │   ├── home/               # 题库搜索
│   │   ├── grade/              # 智能批改（选卷+传图）
│   │   ├── records/            # 批改记录
│   │   ├── report/             # 批改报告
│   │   └── question-detail/
│   ├── utils/api.ts            # 前端 API 封装
│   └── global.css              # 主题设计令牌
├── server/                     # Express 后端
│   └── src/
│       ├── index.ts            # 入口 & 路由挂载
│       ├── routes/             # questions / papers / submissions
│       ├── services/           # 对象存储、视觉 LLM 批改
│       └── data/               # 题库/试卷/记录数据（JSON 持久化）
└── package.json                # 根 workspace
```

---

## 🚀 本地开发运行

### 环境变量
- 前端自动使用已注入的 `EXPO_PUBLIC_BACKEND_BASE_URL` 作为后端基址。
- 后端需要对象存储与视觉模型凭据（由部署环境注入 `COZE_BUCKET_*` 等），本地 Mock 模式下可先验证题库等不依赖外部能力的功能。

### 首次启动/重启前后端
```bash
coze dev
```
该命令会先杀掉占用端口的进程再启动前后端。

### 分端启动
```bash
# 后端（Express，默认 9091）
cd server && NODE_ENV=development pnpm run dev

# 前端（Expo Web，默认 5000）
cd client && npx expo start
```

---

## 📱 部署到手机（真机体验）

App 采用 Expo 技术栈，**无需 Xcode/Android Studio**，用实体手机即可体验：

1. 手机安装 **Expo Go** App（App Store / 应用商店搜 “Expo Go”）。
2. 电脑端运行 `npx expo start`，终端出现二维码。
3. 手机上（与电脑同一局域网）：
   - **iOS**：系统相机扫码 → 自动用 Expo Go 打开；
   - **Android**：Expo Go 内点击 **Scan QR code** 扫码。
4. 加载完成后即可使用三端一致的 App 界面。

> 打包发布正式版（生成 .ipa/.apk）时，可运行 `npx expo run:ios` / `npx expo run:android` 或使用 EAS Build。

---

## 🔌 API 一览（前缀 `/api/v1`）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/v1/health` | 健康检查 |
| GET | `/api/v1/questions/search?keyword=&type=&source=` | 题库搜索 |
| GET | `/api/v1/questions/:id` | 题目详情 |
| GET | `/api/v1/papers` | 可批改试卷列表 |
| GET | `/api/v1/papers/:id` | 试卷详情（含各题分值） |
| POST | `/api/v1/submissions` | 上传答题卡并触发批改（file + paperId + studentName） |
| GET | `/api/v1/submissions` | 批改记录列表 |
| GET | `/api/v1/submissions/:id` | 批改报告详情（异步轮询读取进度/结果） |

---

## 🧠 智能批改原理

1. 用户在「智能批改」页选择一份试卷（每题含标准答案与分值）。
2. 拍摄/选择答题卡图片，前端以 `FormData` 上传至后端。
3. 后端将图片存入**对象存储**，生成访问 URL。
4. 后端调用**豆包视觉大模型**：结合试卷题目、答案要点与答题卡图片，逐题识别学生作答并打分、点评，输出结构化结果。
5. 记录以异步方式处理，前端轮询接口直至 `status = done`，再展示逐题得分与总分。

> 客观题（单选/多选）由模型识别选项对照答案，材料/论述题由模型按要点赋分并给出点评。

---

## 🔒 安全与注意事项

- 上传的答题卡图片默认仅用于批改，可接入对象存储访问控制做私有化。
- 批改为 AI 辅助，**仅供参考**，重要测验建议结合人工复核。
- 已配置的 API 均遵循 Express 静态路由优先于动态路由的正确顺序。

---

## 🛠 统计校验

```bash
# 前端 + 后端 同时静态校验（TSC + ESLint）
pnpm -w lint:all
```

---

## 🔗 仓库

GitHub：https://github.com/HSG111/history-exam-app
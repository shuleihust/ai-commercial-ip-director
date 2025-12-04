# AI 商业 IP 编导

使用 AI 为您定制专访选题和短视频策划的 Next.js 应用。

## 特性

- AI 自动生成采访选题
- 视频录制与提词器功能
- AI 视频分析与爆款结构重组
- TTS 语音朗读问题

## 技术栈

- **前端**: Next.js 15 + React 19 + Tailwind CSS
- **后端**: Next.js API Routes
- **AI**: Google Gemini API (API Key 安全存放在服务端)

## 本地运行

**环境要求:** Node.js 18+

1. 安装依赖:
   ```bash
   npm install
   ```

2. 配置环境变量:

   创建或编辑 `.env.local` 文件，添加你的 Gemini API Key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

   > **重要**: 不要添加 `NEXT_PUBLIC_` 前缀，否则 API Key 会暴露到客户端！

3. 运行开发服务器:
   ```bash
   npm run dev
   ```

4. 打开浏览器访问 http://localhost:3000

## 生产部署

```bash
npm run build
npm start
```

## 安全说明

- `GEMINI_API_KEY` 只在服务端使用，不会暴露给客户端
- API 调用通过 `/api/*` 路由在服务端完成
- `.env.local` 已添加到 `.gitignore`，不会被提交到版本控制

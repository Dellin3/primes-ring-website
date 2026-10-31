# PRIMES 反馈功能：交给 Codex 的部署任务

仓库：`https://github.com/Dellin3/primes-ring-website`

待部署分支：`codex/primes-feedback-20261001`

本分支基于研究展示版本（基线文件内容与 `d77f36c` 相同），保留原有 Cassini 数据、研究页及本地笔记。新增 Feedback 入口、独立 `/feedback` 页面和 Vercel 接收端。

## 用户已确认的界面

- 首页及其他现有页面保持原样，在顶部导航的 `Explore data / My notebook / Project research` 后增加同样式的 `Feedback` 文字入口。不使用右下角悬浮按钮。手机窄屏自动排列，避免挤压文字。
- 点击后进入独立 `/feedback` 页面：只保留原土星环背景和一个深色矩形表单。
- 反馈页没有导航、首页标题、介绍、统计、页脚，也不是盖在首页内容上的弹窗。
- 表单只显示姓名、邮箱、问题类型、问题内容，以及收件邮箱和提交按钮。不要再扩展为复杂联系页。

## 可以直接交给 Codex 的任务

请拉取 `Dellin3/primes-ring-website` 的 `codex/primes-feedback-20261001` 分支，将已确认的反馈功能部署到我现有的 PRIMES Vercel 项目 `primes-ring-website-p9yv`（现有域名 `https://primes-ring-website-p9yv.vercel.app/`，项目所属 scope 为 `delling`）。核对项目的生产分支与最新提交，保留之后产生的改动；不要误部署到同一仓库连接的其他 Vercel 项目。不要重新设计页面，也不要把它当成仅有 `dist` 的静态站：`api/feedback.js` 和 `server/` 必须一同部署。

按 `docs/FEEDBACK_SETUP.md` 为同一项目连接 **Private Vercel Blob** 和 Resend，配置服务器变量 `BLOB_READ_WRITE_TOKEN`、`RESEND_API_KEY`、`FEEDBACK_FROM_EMAIL`。收件人固定是 `Zhuoxuan780123@gmail.com`，不要把来访者填写的邮箱当作收件人。密钥只放环境变量，不写进源码或 `VITE_` 变量。需要账户或服务授权时，使用相应平台的安全授权流程。

运行 `npm ci`、`npm run lint`、`npm test`、`npm run build`。部署前用浏览器检查首页 Feedback 入口、独立 `/feedback`、刷新反馈页、手机窄屏和邮箱备用链接。部署后检查 `GET /api/feedback` 返回 `enabled: true`，再由我提交一条明确标注的测试，确认 Private Blob 中有记录以及邮箱实际收到通知。错误时不能显示成功，现有本地笔记不能被清空。完成后返回正式网址、部署对应提交和真实验证结果；若密钥或授权缺失，明确列出缺项，不要宣称收件功能已经接通。

## 本次交付的验证边界

- GitHub 源码交付不等于正式网站及收件服务已经上线。这个交接未创建云服务或配置真实密钥。
- 自动测试使用注入的存储/邮件替身，覆盖输入校验、私密写入、发送失败、重复请求等路径，不代表真实收件成功。
- 当前环境的浏览器拒绝访问本地预览地址，因此上线前仍须完成上述桌面和手机浏览器检查。
- 没有配置接收端时，页面会保留文字并提供邮箱备用链接；链接仅打开草稿，需要访客自己发送。
- 邮件服务接受发送请求不等于最终投递成功。已经保存、但通知失败的意见可在私密 Blob 中查看。

详细设置与故障处理见 `docs/FEEDBACK_SETUP.md`。

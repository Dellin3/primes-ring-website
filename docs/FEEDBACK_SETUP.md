# PRIMES 反馈功能：部署说明

代码已经包含独立反馈页面、Feedback 入口和 Vercel 服务端接口。GitHub 源码交付与 Vercel 正式上线、实际收件是不同步骤；本次交接未创建云资源、配置真实密钥或发送真实邮件。收件人固定为 `Zhuoxuan780123@gmail.com`。未配置服务端时，访客仍可使用页面上的邮箱备用链接；网站不会把“打开邮件草稿”显示为提交成功。

已确认样式：原站保持不变，Feedback 打开独立 `/feedback`；该页只显示土星环背景和一个深色矩形表单，不能显示首页文案、导航或遮住首页的弹窗。详见仓库根目录 `CODEX_HANDOFF.md`。

## 在 Codex 中接续

可以让 Codex：“读取 `docs/FEEDBACK_SETUP.md`，核对现有 Vercel 项目，配置反馈服务并检查预览，最后重新部署 PRIMES 网站。”

1. 在 PRIMES 对应的 Vercel 项目 → Storage 创建或连接 **Private Blob**，不要使用 Public Blob。将其连接到需要的环境。此版本使用服务端 `BLOB_READ_WRITE_TOKEN`，请确认该变量存在。
2. 在 Resend 验证你拥有的发信域名，并创建发送邮件的 API key。`FEEDBACK_FROM_EMAIL` 应为该域名下的地址，例如 `PRIMES Feedback <feedback@your-domain.com>`。
3. 在 Vercel 项目环境变量中配置下表，选择 Production；如需要预览测试也配置 Preview，然后重新部署。需要自定义域名时，确认 Vercel 的系统变量能提供该域名。

| 服务端变量 | 内容 |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | 与该项目连接的 Private Blob 读写 token |
| `RESEND_API_KEY` | Resend 邮件发送 API key |
| `FEEDBACK_FROM_EMAIL` | 经过 Resend 验证的发信地址，可含显示名称 |

这些变量都不能加 `VITE_` 前缀，也不要写入源码、截图或聊天。`.env.example` 只有空模板。三个变量缺少任何一个时，直接提交保持关闭；`GET /api/feedback` 返回 `{ "enabled": false }`。`enabled: true` 只代表配置齐全，不代表凭据和投递已经验证。

**Resend 测试限制：** `onboarding@resend.dev` 通常只能发送至 Resend 账户自己的注册邮箱；只有注册邮箱就是上述固定收件邮箱时才适用于此项目的初步测试。上线请验证自己的域名，不要把访客邮箱用作发件人。访客填写的邮箱只会用于 `Reply-To`。

## 验证与上线检查

本地安装及常规检查：

```bash
npm ci
npm run lint
npm test
npm run build
```

`npm run dev` 仅启动 Vite 前端，不运行 `/api/feedback`，因此显示邮箱备用方式是正常的。完整接口调试请在已连接正确项目、取得所需开发环境变量后使用 `vercel dev`；默认本地端口为 `3000`。本地允许 `localhost` / `127.0.0.1` 的 `3000`、`5173`、`4173` 端口；线上仅允许固定正式网址和 Vercel 注入的正式、部署及分支域名，不信任请求的 `Host` 头。

部署后由你实际做一次测试：

1. 从首页点击 Feedback，填写姓名、邮箱、问题类型，以及一段十个字符以上、标注“部署测试”的内容，提交一次。
2. 确认页面显示已保存；刷新页面不会自动重发。从 `POST /api/feedback` 的响应读取 `id`，不用在界面上增加技术编号。
3. 到 Vercel Private Blob 确认 `feedback/<id>.json` 存在。
4. 在收件箱及垃圾邮件中确认邮件实际到达，并在 Resend 检查邮件状态。**自动化测试使用模拟存储和邮件服务，不能证明真实投递成功。**
5. 在手机视口确认原站 Feedback 入口和四项表单均可使用，反馈页没有首页文字或多余导航；直接打开或刷新 `/feedback` 仍正常。无服务配置时检查邮箱备用链接仍可使用。

## 保存、邮件与故障的含义

- 服务端先保存私有记录，再通知邮箱；不暴露任何公开的反馈读取、列表或下载接口。你可登录自己的 Vercel 项目，在 Private Blob 中查看记录。
- `notificationSent: true` 表示 Resend 已接受通知，**不等于收件箱已投递**。通知失败时反馈仍保留，页面应明确显示已保存。
- 存储失败时不会宣称提交成功；界面保留内容供重试或复制到邮件。
- 每次表单提交有 UUID；同一编号和同一规范化内容的重试不会覆盖数据。不同内容使用同一编号返回 `409`，需要重新载入表单生成新编号。
- 通知使用固定 Resend 幂等键及保存时的邮件内容。接受状态写入私有 `feedback-notifications/` 目录。尚无接受记录的通知，仅允许在首次保存后 23 小时内随用户重试；过期保留反馈，不自动再次发信，避免超过 Resend 24 小时去重窗口导致重复通知。本版本不包含后台自动补发任务。
- 只保存反馈文本、类别、姓名/邮箱、页面路径和时间；表单的四项均为必填。不保存 IP、浏览器 User-Agent，也不保留页面查询参数与片段。不要在反馈中提交密码等敏感信息。可按需要定期清理旧反馈及对应通知记录；没有自动删除任务。

## 基础防滥用与后续维护

已有字段与 JSON 字节数校验、蜜罐字段、来源检查、固定收件人及每个温热函数实例每分钟 30 次的总请求上限。此上限**不是全局或每人限流**，冷启动和多实例不共享计数，也不阻止伪造请求来源的机器人。上线时建议对 `/api/feedback` 的 POST 设置 Vercel Firewall / Rate Limiting，按实际流量调整；如垃圾反馈增加，再加入验证挑战或共享限流服务。

常见问题：

| 表现 | 检查 |
|---|---|
| 一直显示邮箱方式 | 三个服务端变量是否齐全、是否已重新部署；是否只启动了 Vite |
| 提示未确认保存 | Private Blob 是否连接正确、token 是否有效、存储服务是否可用 |
| 已保存但没有通知 | Resend key、验证域名、测试收件人限制、Resend 邮件状态及垃圾邮件箱 |
| 新域名提交返回 403 | Vercel 系统环境变量中的域名；代码没有允许任意 Host 来源 |

官方参考：

- [Vercel Blob SDK 与 Private Storage](https://vercel.com/docs/vercel-blob/using-blob-sdk)
- [Vercel 系统环境变量](https://vercel.com/docs/environment-variables/system-environment-variables)
- [Resend 幂等键与 24 小时窗口](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [Resend 测试域名收件人限制](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain)

# Cassini 首次探索与持续研究实施记录

本轮以当前 `presentation-architecture` 本地工作区为起点，基准提交 `fed26c80b6dfc3cecd3d1a01704f9f907d7cc033`。工作开始时已有大量未提交架构修改和六组新数据；没有重置、检出远端、覆盖回旧版、推送或部署。

## 开工核对：旧版风险在当前分支的状态

- 数据身份与规模：当前实现不同，当前目录实际提供 6 观测、1,566,902 条精确转换记录。旧版 5 小样本不能作为当前数据基线。
- `parseNumericValue('   ')`：旧风险仍存在，本轮已修复为空值，不再转零。
- `chooseYAxisColumn` 的首数值字段回退：当前实现不同，工作台由 metadata.principal_variables 显式定义变量；对失效变量 URL 提示并展示可用选择。
- `summarizeSeries` 的全数组展开：当前实现不同，画布已采用迭代 extent；本轮进一步修复缺失值绘图与大数组 CSV 验证。
- 精确数据导出：原实现已使用 exact chunks，本轮补上版本、来源、单位、闭边界、缺失规则、精确文件名与 WebKit URL 生命周期。
- 过期请求：原实现已有 cancelled 防护；新工作台继续按观测、版本、范围关联请求，并忽略过期响应。重试不清空笔记。
- URL：原实现已有部分查询参数及 popstate 恢复；本轮用 Router 查询参数作为变量/范围/模式的统一视图状态。
- 持久化：原实现未发现本地探索记录存储。本轮新增小体量状态与笔记，不缓存大型数据到 localStorage；独立draftId区分标签页，写入前按操作合并最新数据，避免旧标签覆盖新记录。
- 教学/残差：当前源码没有原五点移动平均残差工具；历史小样本的 parent identity 未核验，本轮没有把其残差伪称研究重建误差。保留当前数值工作台，恢复可独立核验的 cubic 教学模型和原学习图入口。

## 实际改动与取舍

首页改为明确的价值、直接进入真实示例的主入口和本地继续入口。复用现有数据概览，不生成无关图形。工作台复用原 Canvas、概览导航、SHA-256 分块校验和缓存；用紧凑观测选择与主图前置减少空白，提供 Guide / Inspect / Notes 三种上下文。数值范围输入提供明确的反向、空值、越界错误，不悄悄改值；拖动与键盘范围控件依旧可用。

每个示例来自实际精确转换记录：1,025 个样本、256 km 的含边界窗口、单块读取。默认 Rev133 为 133625.75–133881.75 km，样本索引 247552–248576。选择依据保存在 `explorationExamples.js` 并可由 `scripts/build_exploration_examples.mjs` 重建。只将其称为可比较的局部样本，不命名未经核验的地貌。

点击或键盘选择才能完成检查；鼠标经过不算激活。保留源索引，双点对照可显示数值差。精确窗口数据表提供分页和逐行检查。缺失字段不转零，原负值保留，相位仍为未连线散点。

显式保存、自动草稿、改名/删除和首页继续入口使用浏览器本地存储。失败时保留会话并提示导出。分享 URL 包含观测、变量、范围、版本和显示模式，不包含笔记或本地记录 ID。观察记录 Markdown 包含用户自填笔记、限制和可复现视图链接；空结论保持空白。CSV 导出所有四个已发布字段和源索引，含目标变量缺失的源记录；不导出降采样概览冒充精确记录。

数据说明保留正式 PDS 身份、转换证据、单位和版本；研究章节将未发布成果合并为紧凑状态，恢复已有学习图、学习站和 cubic 示例。cubic 明确标为 Illustrative model，不能代表 Cassini 重建。

未新增依赖、账户系统或后端。图像导出暂未加入：当前 Canvas 无已验证的带完整科学注记导图管线，本轮优先保证精确数值与观察记录导出。

## 主要变更文件

- `src/components/data/ObservationExperience.jsx`：统一视图状态、引导、精确加载/检查、笔记、保存/导出/分享、失败和旧版本提示。
- `src/pages/DatasetPage.jsx`、`DataExplorerPage.jsx`：观测切换、区间交集、直接引导路由、加载重试。
- `src/lib/explorations.js`、`explorationEvents.js`、`src/pages/ExplorationsPage.jsx`：浏览器记录和草稿、便携记录、私有文本排除、事件适配层。
- `src/lib/webObservation.js`、`csv.js`、`profileRendering.js`、`src/content/explorationExamples.js`：数据精度、缺失/方向/断点、可信示例。
- `src/components/data/ScientificProfileCanvas.jsx`、`ObservationNavigator.jsx`、`ExactSampleInspector.jsx`、`ObservationRadialScene.jsx`：真实点检查、键盘、缺失绘图、全局坐标说明。
- `src/components/home/*`、`src/components/research/*`、首页/研究/资源页、`src/content/project.js`、`researchModules.js`：访客入口、研究内容和教学资料。
- `src/App.jsx`、`SiteHeader.jsx`、`src/styles/*`：保存路由、旧入口重定向、导航与响应式布局。
- `scripts/build_exploration_examples.mjs`、`tests/*.test.mjs`、`scripts/acceptance*`：数据与关键路径验收。

## 事件与上线后验证边界

没有已有线上分析服务，本轮仅提供可测试事件适配层，不向网络传送分析。开发模式可查看 `window.__cassiniExplorationEvents`；最多保留 100 条内存事件。回调只接收 allowlist 的事件名、页面模块运行经过时间、datasetId、variable、rowCount、format；不含标题、笔记、半径范围、源样本索引或跨设备身份。适配器异常不阻止数据操作。

去重范围为当前页面 JS 会话。进入、精确窗口、实际点检查、成功浏览器保存、下载准备和复制成功分别在对应动作触发；同一窗口/记录操作使用去重键。下载事件表示浏览器下载已发起，不表示用户最终把文件存入磁盘。没有通过倒计时或滚动制造激活。

将来连接分析时应明确：开始探索会话为激活率分母；加载精确窗口并实际检查或操作区间为激活；激活会话中的保存/导出/分享为成果带走率；后续会话恢复保存并再次操作为继续研究。首次价值时间取同次 exploration_started 至精确加载后第一次 sample_inspected 的时间差。本地草稿数不能外推全站指标；浏览器回访不能当作跨设备个人身份。

线上 LCP ≤2.5s、INP ≤200ms、CLS ≤0.1 是真实用户第75百分位目标，不是一次本地浏览器结果。当前没有线上第75百分位数据。仍应邀请五位未参与开发的目标访客完成同一任务，记录阻塞与完成情况；4/5 独立完成只是初步改善目标，不是统计证明。

## 验收状态

以 `docs/EXPLORATION_ACCEPTANCE_2026-09-08.md` 的实际运行记录为准，按“已通过 / 未通过 / 尚未运行”分别列示。截图和导出样例为浏览器实际产物，不以源码推断代替运行结果。

# CASSINI 第二轮精修交付与验收

日期：2026-09-09。当前本地分支 `presentation-architecture`；保留原有未提交改动，未重置、提交、推送或部署。界面保持英文，本报告中文。依据用户文字清单实施；没有把清单所引用的录屏当成此次功能测试，也没有重新读取那段视频。

## 逐项实施结果

- **01** 已修。Cassini 标签拥有独立顶部布局空间；静态图引线连接飞船，动画引线随真实 3D 对象投影更新。图形取消向正文区域扩张的负边距。
- **02** 已修。Earth receiver 分两行、锚点内收，与图形同列布局；完整文字计入布局，不靠整页溢出或隐藏裁切解决。
- **03** 已修。Ring plane 引线连接明确的环平面位置，装饰轨迹降低存在感；保留 Conceptual occultation geometry / not to scale。
- **04** 已修。章节编号成为独立小字号编号行，取消水印压字。
- **05** 已修。编号、标题、摘要、操作分行排列。1440 和 1280 桌面首页/Research 三卡的标题顶部和操作底部逐像素对齐；390 窄屏使用自然高度。统一 Read chapter →，可访问名称含章节标题。
- **06** 已修外观并实测。导航深浅主题使用实体背景与同步文字颜色，移除模糊背景；滚动跨区保持辨识度，锚点保留顶部空间。
- **07** 未复现清单中的布局下移。三种目标视口实测 Tab 前后 hero 的 y 坐标差为 0；保留覆盖式 skip link，并补充 main 的可聚焦属性。Enter 后实际焦点为 MAIN。
- **08** 已精修。保留标题、说明、主操作、继续入口顺序；减少背景装饰，返回摘要提供具体标题、观测、范围和保存类型。
- **09** 已修。数字和 km 成组，保留源标识；入口缩短为 Open profile →，没有孤立箭头。
- **10** 已修。目录中部按内容定高；1440、1280、390 实测图表面板内容后剩余底部空间均为 13px，不再跟随高侧栏拉伸。
- **11** 已修。原生 Observation 控件采用深色 color-scheme、统一字体/边界/焦点。选项仅显示可区分的观测名称，源标识、年/年积日、范围和记录数进入元数据区；没有猜测转换公历日期。
- **12** 已修。1/2/2.5/5 规整步长，精度由步长决定；用 Canvas 实际字体和 measureText 计算刻度密度、边距和标题换行。未扩展 domain、改采样、抹平峰值或改导出精度。另修复原生 range 控件键盘在非步长对齐边界上轻微反向跳动：按当前 Float64 范围明确递增/递减并限制到合法边界。
- **13** 已精修。去除工作台背景网格和重复容器边框，保留图、工具区、交互控件的必要边界；提高次级文字和禁用操作可读性。
- **14** 已修。概览可以直接 Save exploration，记录 `displayMode: overview`；不增加选点，也不推进为已完成检视。精确 CSV 仍只使用已加载并核验的实际行。沿用现有持久化结构。
- **15** 已修。大范围显示可执行 Open example region；32,768 估算行上限移入 Data & processing。打开示例明确说明新边界，并提供 Restore previous view，保留原范围/变量/引导状态/选点。
- **16** 已修。动作分别为 Add a note、Save exploration、Export notes、Download selected data、Share view。Add a note 实际聚焦笔记输入。
- **17** 已修。未选点问区域；一个点引导第二点；两个点再比较。默认标题使用短真实元数据，用户编辑标题和笔记跨变量切换保留。
- **18** 已修。自由探索不展示线性步骤条；标签页与图的数据模式独立。保存不会把 guideProgress 自动设为 save 或宣称研究完成。
- **19** 已修。完全空、只有草稿、有正式保存记录三种状态分开。草稿优先展示 Continue your latest draft / Resume draft；仅真正空白才出现首次提示。时间为相对时间，time 的 title 和可访问名称提供准确时间；半径统一分组。
- **20** 已修。主位置只显示一个真实写入状态。失败后重试成功及时更新；失败保留当前会话并提示 Export notes。修复跨观测草稿 UUID 覆盖、失效 UUID 误用旧草稿和同观测 SPA 历史切换草稿的问题。重载尚未完成时保存笔记保留此前已知选点 ID，当前显示模式仍诚实记录为 overview；精确读数要等数据加载后才展示。
- **21** 已调整并保留语义边界。下载反馈位于发起按钮附近，仅说 prepared for download，允许重试。Chrome 真实浏览器下载策略拒绝时收到 canceled，页面没有宣称磁盘保存成功；恢复允许后两类文件均成功生成。此检查不等于点击 Safari 原生许可窗口中的 Cancel。
- **22** 已移动原有相位说明到图旁上方；未把它称为新增免责声明。Phase Shift 保持散点，无相位展开或连续性变换。
- **23** 未发现真实 domain 错配。输入范围、其中实际源样本与显示刻度独立核对。非采样对齐边界会说明实际样本覆盖；最右刻度无需等于上界。例如输入 133625.76–133881.74 km，实际样本 133626–133881.5 km，刻度可止于 133850。
- **24** 已精简。图旁保留 Overview / Exact samples 等单一模式，减少外层重复 overview / verified / complete 文案；数据处理与科学验证边界保留在可展开说明及导出记录中。
- **25** 已精简。入口与问题依据当前区域、选点和草稿状态；保留首页主标题。没有把一个示例的走势泛化到全部观测或编造研究发现。
- **26** 已整理。三章摘要分别说明信号/相位、解分支、可靠性接口的用途，短链接不重复整段标题。保留现有教学内容，未补写未提供的研究推导、实验和结论。
- **27** 已清理。公开页和 llms.txt 不再使用仓库素材保留、this preview 等开发交接文案；未知图片署名不归给项目作者。
- **28** 已完成。两张教学 PNG 字节和原图内容不变，增加 View original image 与根据实际图中文字整理的可展开说明，区分一般研究路径与 Cassini 学习路径。实测原图加载成功。
- **29** 已精修。资源采用统一标签、名称、真实状态与操作位置；减少相邻重复署名。论文/科学代码简短显示 Not yet available，没有假 PDF 按钮。网站和查看器代码与科学重建实现明确分开。
- **30** 已精修并测量。研究文字使用衬线体，控件使用无衬线体，源标识/精确数值使用等宽体；减少光晕、背景线和无功能边框。移除 body 最小 320px 宽度及整站横向裁切，窄窗口依靠内容重排。

## 真正执行的验证

- `npm run lint`、`npm test`、`npm run build` 均通过；Node 测试 **23/23**。构建仍提示可选 3D chunk 大于 500kB；它继续按用户点击懒加载，首页检查未请求该模块。
- Chrome **152.0.7977.83**，macOS **15.2**。真实隔离浏览器执行：原有回归 **23/23**，新增保存/恢复 **8/8**，坐标轴/目录 **13/13**，浏览器下载拒绝后重试 **2/2**。
- 首页 **1440×900、1280×800、390×844**。静态、16.4 秒完整动画观察（5个阶段截图）、暂停/重启及 125/150/200% 根字号放大均有实际记录。标题、标注与卡片截图已目视核对；三种目标视口无页面横向溢出，skip 焦点不挤动布局。
- 浏览器原生 **100%、125%、150%、200%** 缩放：1440、1280、500 物理宽度 × 首页/目录/工作台/笔记页/资源页，共 **60 个组合无整页横向溢出**。500px 是桌面 Chrome 的最小窗口；200% 时 CSS 视口为 250px。390×844 移动尺寸另以独立真实浏览器视口检查。浏览器缩放采用临时 profile 设置，并核对 `devicePixelRatio` 与 CSS 视口变化；不是 CSS transform、CSS zoom 或仅截图放大。
- **80 项关键文字实际 computed styles 测量**，最低 **6.02:1**。输入/选择控件边界相对控件背景 **4.58–5.37:1**，禁用数据按钮边界 **3.71:1**、文字 **6.98:1**。填充主按钮通过背景区分，文字为 **8.45:1**。这是列明元素的测量，不宣称全站完成 WCAG 认证；渐变祖先已在原始记录列出，不能把单一祖先背景估算当成每个像素的测量。
- **V3/V4**：首页 → 实际示例 → 两点检视 → 输入笔记 → 保存 → 刷新 → 继续/重命名/删除；观测、变量、范围、选点、笔记恢复一致。概览保存无精确检视事件、无伪造样本、精确 CSV 仍禁用。包括损坏/不可写存储、数据请求失败、跨标签页、跨观测与同观测不同草稿、重载时立即保存。
- **V5**：6 个实际观测 × 3 变量，真实首样本值、单位、来源索引及闭区间核对。23 项 Node 测试中的完整性检查覆盖 **1,566,902 行、193 个 SHA-256、6,114 个概览点**。两个浏览器 CSV 窗口分别逐字段核对 **1,025** 与 **1,023** 行；负值和 Float64 数值保持不变。
- **V6**：通过真实按钮获取 CSV/Markdown 并读取文件；受控准备失败、浏览器拒绝、再次允许与重试均有检查。只承诺网页已准备下载，浏览器原生权限不绕过。
- **V7**：公开资源、空材料字段、原图加载和文件哈希已核对；细节见材料清单。
- **V8 / Safari 限制**：本机 Safari **18.2** 的 safaridriver 已实际启动并尝试建立会话，返回 `You must enable 'Allow remote automation' ...`。因此 Safari 原生选择器、许可窗口的允许/取消和下载流程**未测**。未改动用户 Safari 设置；WebKit 也没有当作 Safari 冒充通过。

## 截图与可复核记录

以下修改后截图覆盖清单描述的问题状态，包括长标题卡片、宽范围概览 Notes、只有草稿的笔记页；并非只展示空白或没有问题的页面。

- [首页完整视图](../artifacts/refinement/final/home.png)、[标注](../artifacts/refinement/final/annotations.png)、[动画周期记录](../artifacts/refinement/home/visual-checks.json)。
- [首页三卡](../artifacts/refinement/final/home-cards.png)、[Research 三卡](../artifacts/refinement/final/research-cards.png)。
- [工作台精确示例](../artifacts/refinement/final/exact-guide.png)、[两点检视](../artifacts/refinement/final/exact-inspected.png)、[概览直接保存](../artifacts/refinement/final/overview-saved.png)。
- [只有草稿](../artifacts/refinement/final/notebook-draft-only.png)、[草稿与正式记录](../artifacts/refinement/final/notebook-saved.png)、[真正空白状态](../artifacts/refinement/notebook-empty.png)。
- [资源与两张完整原图](../artifacts/refinement/final/resources.png)、[200% 工作台](../artifacts/refinement/final/zoom-200-workbench.png)、[200% 资源页](../artifacts/refinement/final/zoom-200-resources.png)。
- 同状态比较可用上一轮 [首页](../artifacts/acceptance/01_home.png)、[精确示例](../artifacts/acceptance/02_loaded_example.png)、[两点检视](../artifacts/acceptance/03_exact_sample.png)，对应本轮同 1440×900、Rev 133、optical_depth、133625.75–133881.75 km 状态。未制作伪造的改前截图；上一轮没有保存的卡片/仅草稿状态以本轮实际布局测量和完整截图复核。
- [23 项回归](../artifacts/refinement/regression/browser-results.json)、[8 项新增与60项缩放](../artifacts/refinement/refinement-results.json)、[13 项轴/目录](../artifacts/refinements/profile-axis-report.json)、[对比度原始结果](../artifacts/refinement/contrast.json)、[浏览器拒绝/重试](../artifacts/refinement/download-policy/results.json)。

可重跑脚本：`scripts/acceptance-full.mjs`、`scripts/acceptance-refinement.mjs`、`scripts/acceptance-profile-refinements.mjs`、`scripts/acceptance-contrast.mjs`、`scripts/acceptance-download-policy.mjs`、`scripts/capture-refinement.mjs`。使用已安装 Playwright Core 和 Chrome，默认连接 localhost:5174。首页完整动画脚本保存在 `scripts/acceptance-home-refinement.mjs`。

## 等待作者的材料与仍未覆盖项目

材料清单另见 [MATERIALS_2026-09-09.md](MATERIALS_2026-09-09.md)。M1 获准公开的论文与确认状态；M2 科学算法、环境和对应版本；M3 实际论文图与图注/条件；M4 实际根、分支、诊断、重建与验证输出；M5 教学图真实署名/来源以及科学版本对应信息。现有 PDS 源标识和网页数据版本已核对，不能将 M5 一概描述成缺失。私有研究目录保留，未读取、复制或公开。

Research Starter Lab 主页和现有正式入口已打开；其工作表子页遇到读取 Cache miss / 网络 ENOTFOUND，不能由此判定链接失效，子页交互尚未验证。Safari 范围如上。07 未复现位移，23 未发现真实数据域错配。实际首次成功率和回访留存仍需发布后的用户行为验证，本轮没有作出提升保证。

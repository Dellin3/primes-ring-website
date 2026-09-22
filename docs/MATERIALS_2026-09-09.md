# 第二轮材料与公开文案核对

核对日期：2026-09-09。范围是当前本地项目的公开内容、数据元信息、既有教学图片与资源入口；不以远端旧主分支代替本地实现。以下材料空缺是公开材料的交付依赖，不是保存、绘图等网站功能未完成。

## M1 · 论文

- 当前公开文件目录未找到项目论文 PDF、TeX、BibTeX 或可公开稿件链接。`_research_private/` 目录确实存在；`docs/SITE_ARCHITECTURE.md` 将其界定为非公开工作材料。本轮未读取、复制、发布其中内容，也未将“未公开”解释为作者没有论文。
- 原有 `Manuscript in revision` 出现在网站常量、`public/llms.txt` 和旧架构文档中；这些重复文案不构成作者对投稿、发表或返修状态的确认。
- 公开状态统一改为 `Not yet available`；`project.paperUrl` 为空，没有虚构 PDF 按钮。原项目标题、既有作者顺序和导师署名保留。
- 等待作者提供：获准公开的 PDF 或源稿，以及确认的标题、作者顺序、版本、日期与发布状态。

## M2 · 科学重建代码

- 可访问的 GitHub 链接为网站前端及数据查看器仓库。本地存在数据转换、完整性核验、分块导出脚本；它们不等于完整科学重建算法。
- 公共资料中没有可供用户运行的完整 Cassini 科学重建实现及环境入口。`project.scientificCodeUrl`、`project.scientificCodeVersion` 保持为空；不把画图组件或教学立方方程当成科学算法。
- 等待作者提供：实际实现、运行入口、环境说明、科学实现版本，以及与输入和结果对应的可复现说明。

## M3 · 论文图表

- 三个章节的 `figures` 数组仍为空。保留既有说明、数据查看器和标明 Illustrative model 的教学示例，没有新增研究结果图。
- 两张学习图是教学图，不列入论文实验结果，不附假图号或假数据条件。
- 等待作者提供：实际研究图、图号、完整图注、生成代码及相应实验/观测条件。

## M4 · 研究结果和验证

- 公开结果字段 `project.researchResults` 为空。驻相根、分支记录、数值诊断、重建剖面及验证图没有用生成内容补位。
- 页面以紧凑的 Research output status 展开项说明状态，不推断“正在准备”或“即将发布”。数据转换检查与科学方法验证继续明确区分。
- 等待作者提供：实际结果和必要解释，及误差、收敛、参考计算、分辨率等主张对应的可核验证据。

## M5 · 已有来源与待核对项目

### 已检查的本地内容

- `public/data/observations/catalog.json` 列出 6 个观测；各自 `metadata.json` 包含来源产品标识，网页数据版本均为 `1.1.0`。本轮没有改变这些数据。科学实现版本仍未填写，不能从网页数据版本推导。
- 项目作者和导师沿用 `src/content/project.js` 既有署名；不把教学图的未知作者归给项目团队。
- 已实际查看两张原图，图外文字描述仅转录或概括图中可读内容，没有重绘、裁剪或更换图像。
- Student Research Pathway：Interest → Sources → Questions → Toy Model → Data → Output。
- Cassini Learning Pipeline：Physical Observation → Public Cassini Data → Local Data Viewer → Mathematical Model → Student Worksheet → Research Question。新增可展开的文字描述保留每一步的含义，并说明这是学习路径，不是完成重建的记录。
- 原图署名和原始创作来源尚未确认。公开说明仅为 `Image credits: not specified.`；“existing repository teaching graphic”“Original teaching assets retained unchanged”及“this preview”版本交接话语已从页面移除。
- 两张图片均提供明确的 View original image 链接；文件本身保持不变。现有文件记录：
  - `public/images/student-research-pathway.png`：1672 × 941，1,334,763 字节，SHA-256 `8f8714d3dfabec3d83cdce7a9d60eb74accb03bb9a468418c8d23bc78073df63`。
  - `public/images/cassini learning pipeline.png`：1672 × 941，1,309,386 字节，SHA-256 `d9475598b28c4dac6ee2f90293b1a01e9b84cf1d8b15f784708df25046da0e34`。

### 外部资源核对

- 已通过网页读取工具实际打开 [Cassini RSS 官方数据说明](https://pds-rings.seti.org/cassini/rss/)。该页说明 DLP 为已校准、仍受衍射影响的重建前剖面。保留此正式来源链接。
- 已实际打开 [GitHub 网站仓库](https://github.com/Dellin3/primes-ring-website)，可读取其前端项目说明。本轮仅核对公开入口身份，不将远端内容覆盖到本地，不声称公开仓库已包含本轮未发布修改。
- 已实际打开 [Research Starter Lab](https://student-research-lab-theta.vercel.app/)，主页提供学习路径、研究记录和浏览器工作表说明。现有主页链接保留。
- RSL 主页实际指向 `/tools` 和 `/worksheet`。网页读取工具打开这两个子页得到 Cache miss，普通本地网络请求得到 ENOTFOUND；这不是链接失效的证据。尚未验证子页的交互和保存功能，没有把 Student Worksheet 写成已验证可下载的独立文件，也未新增未经验证的子页直链。
- 仍待作者确认：教学图的创作者、原始来源及必要使用说明；科学实现与公开结果的版本对应关系；获准公开的论文/研究图版本。

## 本轮验证边界

- 指定修改组件与内容文件的 ESLint 实际执行通过。
- 图片内容已人工视觉读取；材料字段和六观测数据版本已从本地文件实际读取。
- 页面最终视觉、缩放、核心交互和 Safari 范围由主代理的浏览器验收记录统一说明，不能由本材料清单推导为全部通过。

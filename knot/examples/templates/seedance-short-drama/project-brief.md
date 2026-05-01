# 项目需求
## 目标
将 30 集剧本转化为可直接用于 Seedance 2.0 的视频生成提示词。
## 输入
- 30 集剧本（script/ 目录下）
- 项目配置 config.json（视觉风格：真人写实，目标媒介：短剧，时长预算：60秒±4秒）
- 已有 3 集完成全部产出
## 输出
- 每集导演分析（outputs/epXX/01-director-analysis.md）
- 人物和场景提示词（assets/character-prompts.json, assets/scene-prompts.json）
- Seedance 2.0 视频提示词（outputs/epXX/02-seedance-prompts.json）

## 风格要求
- 视觉风格：真人写实
- 目标媒介：短剧
- 每集时长：60秒 ± 4秒

## 审核要求
- 业务审核：叙事结构、讲戏质量、运镜合理性、Seedance 2.0 规范合规
- 合规审核：平台内容政策（无真人限制、无版权IP、无政治敏感、无极端暴力）

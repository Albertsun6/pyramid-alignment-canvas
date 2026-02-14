## PRD：方法论匹配（A 方案：检索优先）

### 1. 背景与目标

当前“方法论匹配”主要依赖生成式输出，导致“搜不到、不可解释、难以复用”的体验问题。  
本 PRD 目标：将流程改造为 **知识库检索优先 + 评分排序 + 可解释推荐 + 低置信度兜底**。

### 2. 范围

#### 2.1 In Scope
- 方法论层（第 2 层）检索流程重构
- 方法论库候选卡片信息重构
- 评分与解释机制（规则版）
- 低置信度分支（放宽重搜 / AI 定制）
- 行为埋点与评估指标

#### 2.2 Out of Scope
- 用户登录体系（Auth）
- 多租户权限策略
- 智能学习权重自动训练（仅预留埋点）

---

### 3. 用户流程（状态机）

#### 3.1 主流程状态
1. `idle`：待检索
2. `constraint_extracting`：提取结构化约束
3. `retrieving`：知识库过滤召回
4. `ranking`：评分排序
5. `result_ready`：候选可选
6. `applied`：应用到方法论层

#### 3.2 异常/兜底状态
1. `low_confidence`：低置信度（Top1 < 75 或 Top3 avg < 65）
2. `refine_retry`：用户放宽约束后重检索
3. `custom_generating`：AI 定制生成
4. `custom_ready`：定制方案可应用
5. `failed`：请求失败（网络/接口）

#### 3.3 状态转移规则（摘要）
- `idle -> constraint_extracting -> retrieving -> ranking -> result_ready`
- 若 `confidence low`，则 `result_ready -> low_confidence`
- `low_confidence -> refine_retry -> retrieving`
- `low_confidence -> custom_generating -> custom_ready`
- `result_ready/custom_ready -> applied`

---

### 4. 页面与交互规范

#### 4.1 约束摘要区
展示结构化约束标签（可编辑）：
- 领域
- 问题类型
- 证据偏好
- 确定性偏好
- 团队规模
- 时间窗口

交互：
- `编辑约束`
- `放宽约束并重检索`

#### 4.2 候选列表区
默认展示 Top 5，分层：
- 高匹配（>=75）
- 中匹配（55-74）
- 低匹配（<55，默认折叠）

每张卡片字段：
- 名称、来源、分类
- 匹配分（0-100）
- 适配理由（最多 3 条）
- 冲突点（最多 2 条）
- 风险提示（1 条）
- 操作：设主方案 / 加入备选 / 查看详情

#### 4.3 低置信度区
文案：
- “当前没有高置信度的现有方法论。最高匹配分 {topScore}。”
按钮：
- `放宽约束再检索`
- `创建 AI 定制方法论`

---

### 5. 评分规则（V1）

`matchScore = 0.30*domain + 0.25*problemType + 0.20*evidence+certainty + 0.15*resource + 0.10*history`

说明：
- 各分项范围 0-100
- 历史分在 V1 可先置 50（中性）或按会话选择偏好微调
- 最终分四舍五入为整数

解释输出要求（每个候选强制）：
- `fitReasons` >= 2
- `conflicts` >= 0
- `riskNote` = 1

---

### 6. 接口字段草案（前后端契约）

#### 6.1 检索请求 `POST /methodologies/search`
```json
{
  "sessionId": "string",
  "constraints": {
    "domain": "软件工程",
    "problemType": "流程改进",
    "evidencePreference": "可复验",
    "certaintyPreference": "中高",
    "teamSize": "6-20",
    "timeHorizon": "1-3月"
  },
  "limit": 5
}
```

#### 6.2 检索响应
```json
{
  "candidates": [
    {
      "id": "m_001",
      "name": "精益创业（Lean Startup）",
      "origin": "Eric Ries",
      "category": "产品创新",
      "matchScore": 82,
      "confidenceLevel": "high",
      "fitReasons": ["..."],
      "conflicts": ["..."],
      "riskNote": "...",
      "stepsPreview": "Build-Measure-Learn",
      "evidenceType": "混合"
    }
  ],
  "topScore": 82,
  "avgTop3": 74,
  "isLowConfidence": false
}
```

#### 6.3 定制请求 `POST /methodologies/customize`
```json
{
  "sessionId": "string",
  "constraints": { "...": "..." },
  "reason": "现有方法论匹配度不足"
}
```

#### 6.4 应用请求 `POST /methodologies/apply`
```json
{
  "sessionId": "string",
  "primaryId": "m_001",
  "backupIds": ["m_008", "m_013"]
}
```

---

### 7. 埋点清单（事件级）

#### 7.1 检索链路
- `methodology_search_started`
- `methodology_search_succeeded`
- `methodology_search_failed`
- `methodology_result_viewed`

关键参数：
- `sessionId`
- `constraints_digest`
- `result_count`
- `top_score`
- `is_low_confidence`
- `latency_ms`

#### 7.2 决策链路
- `methodology_candidate_selected`
- `methodology_candidate_applied`
- `methodology_candidate_deselected`
- `methodology_apply_confirmed`
- `methodology_apply_rolled_back`

关键参数：
- `candidate_id`
- `rank_position`
- `match_score`
- `selection_role`（primary/backup）

#### 7.3 低置信度链路
- `methodology_low_confidence_triggered`
- `methodology_refine_retry_clicked`
- `methodology_customize_clicked`
- `methodology_customize_applied`

---

### 8. 验收标准（上线门槛）

- 候选返回率 >= 95%
- 无结果率 <= 10%
- 首次应用率 >= 70%
- 低置信度触发后仍完成应用率 >= 60%
- 推荐理由清晰度（问卷） >= 4.0/5

---

### 9. 实施顺序（建议）

1. 先补方法论库元数据结构（30-50 条核心方法论）
2. 实现规则评分与结果卡片改版
3. 接入低置信度分支与文案
4. 接入埋点并观察 1 周
5. 基于数据调整权重与阈值


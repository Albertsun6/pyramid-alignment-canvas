# 知行对齐

一个基于七层思维模型的 AI 辅助决策画板。帮助你从「终极承诺」到「具体方法」逐层梳理并落地行动。

## 核心功能

- **开始推导** - 输入自然语言意图，AI 自动从高层到低层逐级推导，每一层都可审阅确认
- **方法论匹配** - 优先检索并推荐适用的真实方法论，可保存、管理和应用
- **画布总览** - 金字塔可视化 + 各层级内容编辑
- **卡点诊断** - 快速定位思维分歧所在层级
- **流程示意** - BPMN 2.0 标准流程可视化
- **高级设置** - 可编辑 AI 系统提示词，支持 AI 辅助优化

## 七层金字塔模型

| 层级 | 名称 | 核心问题 |
|------|------|---------|
| 6 | 终极承诺 | 即使代价很大也不放弃什么？ |
| 5 | 世界观 | 本体/认识/价值背景 |
| 4 | 范式 | 什么算问题、什么算答案？ |
| 3 | 元方法论 | 用什么原则评价方法论？ |
| 2 | 方法论 | 为什么选这套做法？ |
| 1 | 方法 | 这一步怎么做？ |
| 0 | 落地定义 | 我最终要落到哪里，如何算成功？ |

## 技术栈

- React + TypeScript + Vite
- Tailwind CSS
- bpmn-js (BPMN 流程图)
- OpenAI / OpenRouter 兼容 API
- Supabase（在线数据库持久化）

## 本地开发

```bash
cd app
npm install
npm run dev
```

在 `app/.env` 中配置 Supabase：

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 数据持久化说明

- 启动时：前端优先从 Supabase 读取 `canvasList + activeId`
- 编辑时：前端自动同步到 Supabase（轻量防抖）
- 容错：Supabase 不可达时，自动回退 `localStorage`

### Supabase 表结构

在 Supabase SQL Editor 执行：

```sql
create table if not exists public.app_state (
  key text primary key,
  canvas_list_json jsonb not null,
  active_id text not null,
  updated_at timestamptz not null default now()
);
```

### 可选：RLS 安全加固（当前单租户模型）

如果你继续使用单条全局记录（`key='global'`），可执行：

```sql
alter table public.app_state enable row level security;

create policy "anon_select_global_state"
on public.app_state
for select
to anon
using (key = 'global');

create policy "anon_insert_global_state"
on public.app_state
for insert
to anon
with check (key = 'global');

create policy "anon_update_global_state"
on public.app_state
for update
to anon
using (key = 'global')
with check (key = 'global');

create policy "anon_delete_global_state"
on public.app_state
for delete
to anon
using (key = 'global');
```

> 说明：这是“无登录、全站共享一份数据”的策略。若后续要多用户隔离，请改为 `auth.uid()` 维度并接入 Supabase Auth。

## 部署

推送到 `main` 分支后自动通过 GitHub Actions 部署到 GitHub Pages。

## License

MIT

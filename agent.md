# Frontend Collaboration Notes

- 在 `LsERPPortal` 落前端代码时，必须先按职责拆分目录与文件，再进入具体实现。
- 新功能默认按 `api`、`components`、`hooks`、`pages`、`styles`、`types`、`utils` 分层组织。
- 禁止把页面布局、接口请求、状态编排、表单逻辑、画布交互全部堆到单个入口文件。
- BI 设计平台必须继续按领域拆分：
  `components/workspace/bi-directory-canvas.tsx`
  `components/workspace/bi-node-context-panel.tsx`
  `components/workspace/bi-context-info-tab.tsx`
  `components/workspace/bi-context-assets-tab.tsx`
  `components/workspace/bi-context-prompt-tab.tsx`
  `hooks/use-bi-workspace.ts`
  `styles/bi-workspace.css`
- BI 设计平台前端禁止落成单文件巨型页面，必须按“画布 / 上下文面板 / 资产中心 / 档案区 / 提示词区”拆分。
- 优先保证目录结构清晰、命名稳定、可持续维护，再补充局部视觉与交互细节。

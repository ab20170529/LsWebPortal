import type { BiRuntimeScreen } from '../types';
import { BiRuntimeScreenSurface } from './bi-runtime-screen-surface';

type BiDisplayRuntimeStageProps = {
  error: string | null;
  isLoading: boolean;
  screen: BiRuntimeScreen | null;
};

export function BiDisplayRuntimeStage({ error, isLoading, screen }: BiDisplayRuntimeStageProps) {
  if (isLoading) {
    return (
      <div className="bi-display-stage-shell">
        <div className="bi-display-stage-loading">
          <div className="bi-display-stage-loading-title">正在加载当前节点大屏</div>
          <div className="bi-display-stage-loading-text">同步 BI runtime 元数据、查询结果和模块内容。</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bi-display-stage-shell">
        <div className="bi-display-stage-loading">
          <div className="bi-display-stage-loading-title">当前节点暂时没有可展示的大屏</div>
          <div className="bi-display-stage-error">{error}</div>
        </div>
      </div>
    );
  }

  if (!screen) {
    return (
      <div className="bi-display-stage-shell">
        <div className="bi-display-stage-loading">
          <div className="bi-display-stage-loading-title">请选择一个组织节点</div>
          <div className="bi-display-stage-loading-text">点击上方组织卡片或左侧子维度后，会在这里加载对应的大屏内容。</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bi-display-stage-shell">
      <BiRuntimeScreenSurface screen={screen} />
    </div>
  );
}

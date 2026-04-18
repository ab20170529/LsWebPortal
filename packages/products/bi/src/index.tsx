import { Card } from '@lserp/ui';

import { BiRuntimePage } from './pages/bi-runtime-page';
import { BiWorkspacePage } from './pages/bi-workspace-page';
import { resolveBiRoute } from './utils/bi-routes';

export function BiHomePage() {
  const route = resolveBiRoute(window.location.pathname);

  if (route.kind === 'workspace') {
    return <BiWorkspacePage />;
  }

  if (route.kind === 'node' || route.kind === 'screen' || route.kind === 'share') {
    return <BiRuntimePage route={route} />;
  }

  return (
    <Card className="rounded-[32px] p-8">
      <div className="theme-text-strong text-2xl font-black tracking-tight">BI 页面不存在</div>
      <p className="theme-text-muted mt-3 text-sm leading-7">
        当前路由尚未映射到 BI 工作台或 BI 运行时页面。
      </p>
    </Card>
  );
}

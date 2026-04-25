import { startTransition, useEffect, useState } from 'react';
import { Badge, Card } from '@lserp/ui';

import { biApi } from '../api/bi-api';
import { BiRuntimeScreenSurface } from '../components/bi-runtime-screen-surface';
import type { BiRoute, BiRuntimeScreen } from '../types';

type BiRuntimePageProps = {
  route: Extract<BiRoute, { kind: 'node' | 'screen' | 'share' }>;
};

export function BiRuntimePage({ route }: BiRuntimePageProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [screen, setScreen] = useState<BiRuntimeScreen | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const previewVersionIdRaw = new URLSearchParams(window.location.search).get('previewVersionId');
        const previewVersionId =
          route.kind === 'screen' && previewVersionIdRaw && Number.isFinite(Number(previewVersionIdRaw))
            ? Number(previewVersionIdRaw)
            : null;

        const meta =
          route.kind === 'node'
            ? await biApi.getRuntimeByNode(route.value)
            : route.kind === 'screen'
              ? previewVersionId != null
                ? await biApi.getPreviewRuntimeByScreen(route.value, previewVersionId)
                : await biApi.getRuntimeByScreen(route.value)
              : await biApi.getShareRuntime(route.value);

        const withData =
          meta.biType === 'INTERNAL'
            ? route.kind === 'share'
              ? await biApi.queryShareRuntime(route.value)
              : route.kind === 'screen' && previewVersionId != null
                ? await biApi.queryPreviewRuntimeByScreen(route.value, previewVersionId)
              : await biApi.queryRuntimeByScreen(meta.screenCode)
            : meta;

        if (cancelled) {
          return;
        }

        startTransition(() => {
          setScreen(withData);
        });
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        const message = loadError instanceof Error ? loadError.message : '加载 BI 大屏失败。';
        setError(message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [route.kind, route.value]);

  if (isLoading) {
    return (
      <Card className="rounded-[32px] p-8">
        <div className="theme-text-strong text-xl font-black tracking-tight">正在加载 BI 大屏...</div>
      </Card>
    );
  }

  if (error || !screen) {
    return (
      <Card className="rounded-[32px] p-8">
        <Badge tone="danger">Load Failed</Badge>
        <div className="theme-text-strong mt-4 text-2xl font-black tracking-tight">BI 页面加载失败</div>
        <p className="theme-text-muted mt-3 text-sm leading-7">{error ?? '未找到可展示的 BI 页面。'}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[36px] p-8 lg:p-10">
        <Badge tone="brand">{screen.biType}</Badge>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="theme-text-strong text-4xl font-black tracking-tight">
              {String(screen.pageSchema?.title ?? screen.screenName)}
            </h1>
            <p className="theme-text-muted mt-3 max-w-3xl text-sm leading-7">
              {String(screen.pageSchema?.prompt ?? screen.nodeName ?? screen.screenCode)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {screen.nodeName ? <Badge tone="neutral">{screen.nodeName}</Badge> : null}
            <Badge tone="success">{screen.publishStatus ?? 'PUBLISHED'}</Badge>
          </div>
        </div>
      </Card>

      <Card className="rounded-[32px] p-4 lg:p-6">
        <BiRuntimeScreenSurface screen={screen} />
      </Card>
    </div>
  );
}

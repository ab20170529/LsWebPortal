import React from 'react';

type ModulePreviewStepProps = {
  businessType: 'document' | 'table' | 'tree';
  currentModuleCode: string;
  currentModuleName: string;
  title: string;
};

const ARCHIVE_PREVIEW_TEMPLATE = 'http://222.211.229.79:8888/pages/app/app.html?pms=QTYxREI1QzVBRDQxMTYzMEY5NTcyNTI0REQzQzRGMDM4NTk0MDFBQTMxNEFCMTlBNUI3MkU0MEU5QzMyNzQyQ0M0QzREQTJBNjJDRjQyNjlCREJGODE0Q0RGMTEwNUEzNDA4NTVCNzY1NUYyNzRCQkQxRTNFREVDMjU0MzY2ODU0M0FFODgyMDNDQUYwQjAyNzk4MDVDMzk4MUEwNThFNQ%3d%3d&xtype=plugins.pubmoduledetail.index&dllcoid=1000302';
const BILL_PREVIEW_TEMPLATE = 'http://222.211.229.79:8888/pages/app/app.html?pms=QTYxREI1QzVBRDQxMTYzMEY5NTcyNTI0REQzQzRGMDM4NTk0MDFBQTMxNEFCMTlBNUI3MkU0MEU5QzMyNzQyQ0M0QzREQTJBNjJDRjQyNjlCREJGODE0Q0RGMTEwNUEzNDA4NTVCNzY1NUYyNzRCQkQxRTNFREVDMjU0MzY2ODU0M0FFODgyMDNDQUYwQjAyNzk4MDVDMzk4MUEwNThFNQ%3d%3d&xtype=plugins.pubbill.billadd&dllcoid=1100101';

function buildPreviewUrl(template: string, moduleCode: string) {
  const url = new URL(template);
  url.searchParams.set('dllcoid', moduleCode.trim());
  return url.toString();
}

function resolvePreviewMeta(businessType: ModulePreviewStepProps['businessType']) {
  if (businessType === 'table') {
    return {
      hint: '当前按单据模块预览，dllcoid 会自动取菜单信息里的功能模块编码。',
      label: '单据',
      template: BILL_PREVIEW_TEMPLATE,
      xtype: 'plugins.pubbill.billadd',
    };
  }

  return {
    hint: '当前按基础档案模块预览，dllcoid 会自动取菜单信息里的功能模块编码。',
    label: businessType === 'tree' ? '树形单表' : '基础档案',
    template: ARCHIVE_PREVIEW_TEMPLATE,
    xtype: 'plugins.pubmoduledetail.index',
  };
}

export function ModulePreviewStep({
  businessType,
  currentModuleCode,
  currentModuleName,
  title,
}: ModulePreviewStepProps) {
  const normalizedModuleCode = currentModuleCode.trim();
  const previewMeta = resolvePreviewMeta(businessType);
  const previewUrl = normalizedModuleCode
    ? buildPreviewUrl(previewMeta.template, normalizedModuleCode)
    : '';

  return (
    <div className="flex min-h-[640px] flex-1 overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_28px_64px_-44px_rgba(15,23,42,0.24)]">
      {previewUrl ? (
        <iframe
          key={previewUrl}
          title={`${currentModuleName.trim() || title || previewMeta.label} 模块预览`}
          src={previewUrl}
          loading="lazy"
          allow="fullscreen"
          allowFullScreen
          onContextMenu={(event) => event.stopPropagation()}
          className="min-h-0 flex-1 border-0 bg-white"
        />
      ) : (
        <div className="flex flex-1 items-center justify-center bg-[linear-gradient(180deg,rgba(248,250,252,0.9),rgba(255,255,255,0.98))] p-8 text-center">
          <div className="max-w-md space-y-3">
            <div className="mx-auto flex size-18 items-center justify-center rounded-full bg-[color:var(--workspace-accent-soft,rgba(49,98,255,0.08))] text-[color:var(--workspace-accent-strong,#3152c8)]">
              <span className="material-symbols-outlined text-[34px]">preview</span>
            </div>
            <div className="text-[18px] font-semibold text-slate-900">还没生成预览地址</div>
            <p className="text-[13px] leading-6 text-slate-500">
              先在菜单信息里填好功能模块编码，预览区域就会直接加载真实模块界面。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

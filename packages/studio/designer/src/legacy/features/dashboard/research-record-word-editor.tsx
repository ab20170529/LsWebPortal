import React, { useMemo, useState } from 'react';
import { DocumentEditor, type IConfig } from '@onlyoffice/document-editor-react';
import type { ResearchRecordWordEditorRuntime } from './research-record-word-template-config';

type ResearchRecordWordEditorProps = {
  currentUserName: string;
  documentTitle: string;
  onStatusChange?: (message: string | null) => void;
  runtime: ResearchRecordWordEditorRuntime;
};

function createDocumentKey(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) | 0;
  }
  return `research-record-${Math.abs(hash)}`;
}

export function ResearchRecordWordEditor({
  currentUserName,
  documentTitle,
  onStatusChange,
  runtime,
}: ResearchRecordWordEditorProps) {
  const [loadError, setLoadError] = useState<string | null>(null);

  const editorConfig = useMemo<IConfig>(() => {
    const keySeed = [runtime.templateUrl, runtime.callbackUrl || 'view'].join('|');

    return {
      document: {
        fileType: 'docx',
        key: createDocumentKey(keySeed),
        permissions: {
          chat: false,
          comment: false,
          copy: true,
          download: true,
          edit: true,
          fillForms: true,
          modifyContentControl: true,
          print: true,
          review: false,
        },
        title: documentTitle,
        url: runtime.templateUrl,
      },
      documentType: 'word',
      editorConfig: {
        callbackUrl: runtime.callbackUrl || undefined,
        customization: {
          autosave: runtime.canSave,
          comments: false,
          compactHeader: true,
          compactToolbar: true,
          help: false,
          toolbarNoTabs: false,
          uiTheme: 'theme-light',
          zoom: 110,
        },
        lang: 'zh',
        mode: 'edit',
        region: 'zh-CN',
        user: {
          id: 'research-record-editor',
          name: currentUserName || '开发用户',
        },
      },
      height: '100%',
      type: 'desktop',
      width: '100%',
    };
  }, [currentUserName, documentTitle, runtime.callbackUrl, runtime.canSave, runtime.templateUrl]);

  if (!runtime.enabled) {
    return null;
  }

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden border-l border-slate-200 bg-[#f3f5f8]">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="text-[12px] font-semibold tracking-[0.02em] text-slate-700">Word 主编辑区</div>
        <div className="mt-1 text-[11px] font-medium text-slate-400">
          {runtime.canSave
            ? '已连接文档服务，可直接编辑并保存。'
            : '已连接文档服务，可编辑预览，但当前未接入回调保存。'}
        </div>
      </div>

      <div className="min-h-0 flex-1 bg-[#eef2f6]">
        <DocumentEditor
          config={{
            ...editorConfig,
            events: {
              onAppReady: () => {
                setLoadError(null);
                onStatusChange?.('Word 模板已连接。');
              },
              onDocumentReady: () => {
                setLoadError(null);
                onStatusChange?.(runtime.canSave ? 'Word 模板已加载，可直接编辑。' : 'Word 模板已加载，可编辑但不会自动保存。');
              },
              onError: () => {
                setLoadError('Word 模板加载失败');
                onStatusChange?.('Word 模板加载失败');
              },
            },
          }}
          documentServerUrl={runtime.documentServerUrl}
          id="research-record-word-editor"
          onLoadComponentError={(errorCode, errorDescription) => {
            const nextMessage = `Word 组件加载失败：${errorCode}`;
            setLoadError(nextMessage);
            onStatusChange?.(errorDescription || nextMessage);
          }}
        />
      </div>

      {loadError ? (
        <div className="border-t border-rose-200 bg-rose-50 px-6 py-3 text-[11px] font-medium text-rose-600">
          {loadError}
        </div>
      ) : null}
    </aside>
  );
}

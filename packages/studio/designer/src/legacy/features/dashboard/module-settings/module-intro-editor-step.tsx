import React, { type ChangeEvent, type MouseEvent, type RefObject } from 'react';
import { motion } from 'framer-motion';

export type ModuleIntroBlockType = 'paragraph' | 'h1' | 'h2' | 'h3';
export type ModuleIntroImagePreset = 'small' | 'medium' | 'large' | 'full';

export type ModuleIntroEditorActions = {
  onApplyCommand: (command: string, value?: string) => void;
  onEditorMouseDown: (event: MouseEvent<HTMLDivElement>) => void;
  onFormatChange: (nextType: ModuleIntroBlockType) => void;
  onImageFiles: (files: Iterable<File> | FileList | null | undefined) => void;
  onImagePreset: (preset: ModuleIntroImagePreset) => void;
  onImageUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onLinkInsert: () => void;
  onOpenImagePicker: () => void;
  onPolish: () => void;
  onSaveSelection: () => void;
  onSyncDraft: () => void;
  onTableInsert: () => void;
  onToggleFullscreen: () => void;
};

export type ModuleIntroEditorRefs = {
  editorRef: RefObject<HTMLDivElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  titleEditorRef: RefObject<HTMLHeadingElement | null>;
};

type ModuleIntroEditorStepProps = {
  actions: ModuleIntroEditorActions;
  isFullscreenEditor: boolean;
  moduleIntroBlockType: ModuleIntroBlockType;
  moduleIntroSelectedImageWidth: number | null;
  refs: ModuleIntroEditorRefs;
};

function preventToolbarMouseDown(handler: () => void) {
  return (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    handler();
  };
}

export function ModuleIntroEditorStep({
  actions,
  isFullscreenEditor,
  moduleIntroBlockType,
  moduleIntroSelectedImageWidth,
  refs: {
    editorRef,
    fileInputRef,
    titleEditorRef,
  },
}: ModuleIntroEditorStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`module-intro-shell flex min-h-[600px] flex-1 flex-col overflow-hidden ${
        isFullscreenEditor ? 'fixed inset-4 z-[200] shadow-2xl' : ''
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
        className="hidden"
        onChange={actions.onImageUpload}
      />

      <div className="module-intro-toolbar">
        <div className="module-intro-toolbar-group">
          <select
            value={moduleIntroBlockType}
            onChange={(event) => actions.onFormatChange(event.target.value as ModuleIntroBlockType)}
            className="module-intro-format-select"
          >
            <option value="paragraph">正文</option>
            <option value="h1">标题 1</option>
            <option value="h2">标题 2</option>
            <option value="h3">标题 3</option>
          </select>
        </div>
        <div className="module-intro-toolbar-group">
          <button type="button" onMouseDown={preventToolbarMouseDown(() => actions.onApplyCommand('bold'))} className="module-intro-toolbar-button" title="加粗">
            <span className="material-symbols-outlined text-[18px]">format_bold</span>
          </button>
          <button type="button" onMouseDown={preventToolbarMouseDown(() => actions.onApplyCommand('italic'))} className="module-intro-toolbar-button" title="斜体">
            <span className="material-symbols-outlined text-[18px]">format_italic</span>
          </button>
          <button type="button" onMouseDown={preventToolbarMouseDown(() => actions.onApplyCommand('underline'))} className="module-intro-toolbar-button" title="下划线">
            <span className="material-symbols-outlined text-[18px]">format_underlined</span>
          </button>
          <button type="button" onMouseDown={preventToolbarMouseDown(() => actions.onApplyCommand('strikeThrough'))} className="module-intro-toolbar-button" title="删除线">
            <span className="material-symbols-outlined text-[18px]">format_strikethrough</span>
          </button>
        </div>
        <div className="module-intro-toolbar-group">
          <button type="button" onMouseDown={preventToolbarMouseDown(() => actions.onApplyCommand('insertUnorderedList'))} className="module-intro-toolbar-button" title="无序列表">
            <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
          </button>
          <button type="button" onMouseDown={preventToolbarMouseDown(() => actions.onApplyCommand('insertOrderedList'))} className="module-intro-toolbar-button" title="有序列表">
            <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
          </button>
          <button type="button" onMouseDown={preventToolbarMouseDown(() => actions.onApplyCommand('formatBlock', '<blockquote>'))} className="module-intro-toolbar-button" title="引用">
            <span className="material-symbols-outlined text-[18px]">format_quote</span>
          </button>
        </div>
        <div className="module-intro-toolbar-group">
          <button type="button" onMouseDown={preventToolbarMouseDown(actions.onLinkInsert)} className="module-intro-toolbar-button" title="插入链接">
            <span className="material-symbols-outlined text-[18px]">link</span>
          </button>
          <button type="button" onMouseDown={preventToolbarMouseDown(actions.onOpenImagePicker)} className="module-intro-toolbar-button" title="插入图片">
            <span className="material-symbols-outlined text-[18px]">image</span>
          </button>
          <button type="button" onMouseDown={preventToolbarMouseDown(actions.onTableInsert)} className="module-intro-toolbar-button" title="插入表格">
            <span className="material-symbols-outlined text-[18px]">table_chart</span>
          </button>
        </div>
        {moduleIntroSelectedImageWidth !== null ? (
          <div className="module-intro-toolbar-group module-intro-toolbar-group-image">
            <span className="module-intro-image-size-label">图片 {moduleIntroSelectedImageWidth}px</span>
            <button type="button" onMouseDown={preventToolbarMouseDown(() => actions.onImagePreset('small'))} className="module-intro-image-size-button">小</button>
            <button type="button" onMouseDown={preventToolbarMouseDown(() => actions.onImagePreset('medium'))} className="module-intro-image-size-button">中</button>
            <button type="button" onMouseDown={preventToolbarMouseDown(() => actions.onImagePreset('large'))} className="module-intro-image-size-button">大</button>
            <button type="button" onMouseDown={preventToolbarMouseDown(() => actions.onImagePreset('full'))} className="module-intro-image-size-button">铺满</button>
          </div>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          <div className="module-intro-status-chip">
            <span className="material-symbols-outlined text-[15px]">gesture_select</span>
            先选中文字，再应用格式
          </div>
          <button type="button" onClick={actions.onToggleFullscreen} className="module-intro-action-button">
            <span className="material-symbols-outlined text-[16px]">
              {isFullscreenEditor ? 'fullscreen_exit' : 'fullscreen'}
            </span>
            {isFullscreenEditor ? '退出全屏' : '全屏编辑'}
          </button>
          <button type="button" onClick={actions.onPolish} className="module-intro-primary-button">
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            AI 润色
          </button>
        </div>
      </div>

      <div className="module-intro-body">
        <div className="module-intro-paper">
          <div className="module-intro-paper-head">
            <div className="min-w-0 flex-1">
              <div className="module-intro-eyebrow">模块介绍</div>
              <h1
                ref={titleEditorRef}
                className="module-intro-title"
                contentEditable
                suppressContentEditableWarning
                spellCheck={false}
                onInput={actions.onSyncDraft}
                onBlur={actions.onSyncDraft}
              />
            </div>
          </div>

          <div
            ref={editorRef}
            className="module-intro-prose"
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            onInput={actions.onSyncDraft}
            onBlur={actions.onSyncDraft}
            onFocus={actions.onSaveSelection}
            onKeyUp={actions.onSaveSelection}
            onMouseUp={actions.onSaveSelection}
            onMouseDown={actions.onEditorMouseDown}
            onPaste={(event) => {
              const imageItems = Array.from(event.clipboardData.files ?? []) as File[];
              const imageFiles = imageItems.filter((file) => file.type.startsWith('image/'));
              if (imageFiles.length === 0) {
                return;
              }
              event.preventDefault();
              actions.onImageFiles(imageFiles);
            }}
          />

          <button
            type="button"
            onClick={actions.onOpenImagePicker}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              actions.onImageFiles(event.dataTransfer.files);
            }}
            className="module-intro-upload-card"
          >
            <div className="module-intro-upload-icon">
              <span className="material-symbols-outlined text-[24px]">add_photo_alternate</span>
            </div>
            <span className="module-intro-upload-title">拖拽或点击上传流程图 / 架构图</span>
            <span className="module-intro-upload-desc">支持 PNG、JPG、SVG、WebP，上传后会直接插入到当前光标位置。</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

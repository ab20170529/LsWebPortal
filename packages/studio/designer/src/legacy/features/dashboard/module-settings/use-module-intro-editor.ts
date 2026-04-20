import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, MouseEvent as ReactMouseEvent } from 'react';
import type {
  ModuleIntroBlockType,
  ModuleIntroEditorActions,
  ModuleIntroEditorRefs,
  ModuleIntroImagePreset,
} from './module-intro-editor-step';

const MODULE_INTRO_DEFAULT_TITLE = '';
const MODULE_INTRO_DEFAULT_HTML = '';
const MODULE_INTRO_EMPTY_BODY_HTML = '<p><br></p>';

type UseModuleIntroEditorInput = {
  isActive: boolean;
  showToast: (message: string) => void;
};

type UseModuleIntroEditorResult = {
  isFullscreenEditor: boolean;
  moduleIntroActions: ModuleIntroEditorActions;
  moduleIntroBlockType: ModuleIntroBlockType;
  moduleIntroRefs: ModuleIntroEditorRefs;
  moduleIntroSelectedImageWidth: number | null;
};

function escapeHtmlAttribute(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function execRichTextCommand(command: string, value?: string) {
  const richDocument = document as Document & {
    execCommand?: (commandId: string, showUI?: boolean, nextValue?: string) => boolean;
  };
  return richDocument.execCommand ? richDocument.execCommand(command, false, value) : false;
}

export function useModuleIntroEditor({
  isActive,
  showToast,
}: UseModuleIntroEditorInput): UseModuleIntroEditorResult {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const titleEditorRef = useRef<HTMLHeadingElement>(null);
  const moduleIntroSelectionRef = useRef<Range | null>(null);
  const moduleIntroSelectedImageRef = useRef<HTMLElement | null>(null);
  const moduleIntroImageResizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const moduleIntroTitleValueRef = useRef(MODULE_INTRO_DEFAULT_TITLE);
  const moduleIntroBodyValueRef = useRef(MODULE_INTRO_DEFAULT_HTML);
  const [isFullscreenEditor, setIsFullscreenEditor] = useState(false);
  const [moduleIntroBlockType, setModuleIntroBlockType] = useState<ModuleIntroBlockType>('paragraph');
  const [moduleIntroSelectedImageWidth, setModuleIntroSelectedImageWidth] = useState<number | null>(null);

  const getModuleIntroSelectionAnchor = useCallback((node: Node | null) => {
    if (!node) return null;
    return node instanceof HTMLElement ? node : node.parentElement;
  }, []);

  const updateModuleIntroBlockType = useCallback((node: Node | null) => {
    const anchor = getModuleIntroSelectionAnchor(node);
    const block = anchor?.closest('h1, h2, h3, p');
    const tagName = block?.tagName.toLowerCase();
    if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
      setModuleIntroBlockType(tagName);
      return;
    }
    setModuleIntroBlockType('paragraph');
  }, [getModuleIntroSelectionAnchor]);

  const clampModuleIntroImageWidth = useCallback((width: number) => {
    const availableWidth = editorRef.current?.clientWidth ?? 860;
    return Math.max(180, Math.min(width, Math.max(220, availableWidth - 12)));
  }, []);

  const buildModuleIntroImageHtml = useCallback((src: string, imageName: string, width = 420) => {
    const nextWidth = clampModuleIntroImageWidth(width);
    return `
      <figure class="module-intro-figure" data-module-intro-image="true" contenteditable="false" style="width:${nextWidth}px">
        <div class="module-intro-image-frame">
          <img src="${src}" alt="${imageName}" />
          <span class="module-intro-image-resize-handle" data-module-intro-image-resize-handle="true"></span>
        </div>
      </figure>
      <p><br></p>
    `;
  }, [clampModuleIntroImageWidth]);

  const ensureModuleIntroImageStructure = useCallback((image: HTMLImageElement) => {
    const figure = image.closest('figure');
    if (!(figure instanceof HTMLElement)) return null;
    figure.classList.add('module-intro-figure');
    figure.dataset.moduleIntroImage = 'true';
    figure.setAttribute('contenteditable', 'false');

    let frame = figure.querySelector('.module-intro-image-frame');
    if (!(frame instanceof HTMLElement)) {
      frame = document.createElement('div');
      frame.className = 'module-intro-image-frame';
      image.parentNode?.insertBefore(frame, image);
      frame.appendChild(image);
    }

    if (!figure.querySelector('[data-module-intro-image-resize-handle="true"]')) {
      const handle = document.createElement('span');
      handle.className = 'module-intro-image-resize-handle';
      handle.dataset.moduleIntroImageResizeHandle = 'true';
      frame.appendChild(handle);
    }

    if (!figure.style.width) {
      figure.style.width = `${clampModuleIntroImageWidth(image.naturalWidth || image.width || 420)}px`;
    }

    return figure;
  }, [clampModuleIntroImageWidth]);

  const normalizeModuleIntroImages = useCallback(() => {
    if (!editorRef.current) return;
    editorRef.current.querySelectorAll('img').forEach((node) => {
      if (node instanceof HTMLImageElement) {
        ensureModuleIntroImageStructure(node);
      }
    });
  }, [ensureModuleIntroImageStructure]);

  const clearModuleIntroImageSelection = useCallback((shouldSyncWidth = true) => {
    if (moduleIntroSelectedImageRef.current) {
      moduleIntroSelectedImageRef.current.dataset.selected = 'false';
    }
    moduleIntroSelectedImageRef.current = null;
    if (shouldSyncWidth) {
      setModuleIntroSelectedImageWidth(null);
    }
  }, []);

  const syncModuleIntroSelectedImageWidth = useCallback(() => {
    if (!moduleIntroSelectedImageRef.current) {
      setModuleIntroSelectedImageWidth(null);
      return;
    }
    setModuleIntroSelectedImageWidth(Math.round(moduleIntroSelectedImageRef.current.getBoundingClientRect().width));
  }, []);

  const selectModuleIntroImage = useCallback((figure: HTMLElement) => {
    if (moduleIntroSelectedImageRef.current && moduleIntroSelectedImageRef.current !== figure) {
      moduleIntroSelectedImageRef.current.dataset.selected = 'false';
    }
    moduleIntroSelectedImageRef.current = figure;
    figure.dataset.selected = 'true';
    syncModuleIntroSelectedImageWidth();
  }, [syncModuleIntroSelectedImageWidth]);

  const syncModuleIntroDraft = useCallback(() => {
    if (titleEditorRef.current) {
      const nextTitle = titleEditorRef.current.innerText.replace(/\s+/g, ' ').trim();
      moduleIntroTitleValueRef.current = nextTitle || MODULE_INTRO_DEFAULT_TITLE;
      if (!nextTitle) {
        titleEditorRef.current.innerText = MODULE_INTRO_DEFAULT_TITLE;
      }
    }
    if (editorRef.current) {
      normalizeModuleIntroImages();
      const nextHtml = editorRef.current.innerHTML.trim();
      moduleIntroBodyValueRef.current = nextHtml || MODULE_INTRO_EMPTY_BODY_HTML;
      if (!nextHtml) {
        editorRef.current.innerHTML = MODULE_INTRO_EMPTY_BODY_HTML;
      }
    }
  }, [normalizeModuleIntroImages]);

  const applyModuleIntroImageWidth = useCallback((nextWidth: number) => {
    if (!moduleIntroSelectedImageRef.current) return;
    const width = clampModuleIntroImageWidth(nextWidth);
    moduleIntroSelectedImageRef.current.style.width = `${width}px`;
    syncModuleIntroSelectedImageWidth();
    syncModuleIntroDraft();
  }, [clampModuleIntroImageWidth, syncModuleIntroDraft, syncModuleIntroSelectedImageWidth]);

  const handleModuleIntroImagePreset = useCallback((preset: ModuleIntroImagePreset) => {
    if (!editorRef.current) return;
    if (preset === 'small') {
      applyModuleIntroImageWidth(280);
      return;
    }
    if (preset === 'medium') {
      applyModuleIntroImageWidth(420);
      return;
    }
    if (preset === 'large') {
      applyModuleIntroImageWidth(620);
      return;
    }
    applyModuleIntroImageWidth(editorRef.current.clientWidth - 12);
  }, [applyModuleIntroImageWidth]);

  const hydrateModuleIntroEditor = useCallback(() => {
    if (titleEditorRef.current && !titleEditorRef.current.innerText.trim()) {
      titleEditorRef.current.innerText = moduleIntroTitleValueRef.current;
    }
    if (editorRef.current && !editorRef.current.innerHTML.trim()) {
      editorRef.current.innerHTML = moduleIntroBodyValueRef.current;
    }
    normalizeModuleIntroImages();
  }, [normalizeModuleIntroImages]);

  const focusModuleIntroEditorEnd = useCallback(() => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection) return;
    editorRef.current.focus();
    const range = document.createRange();
    range.selectNodeContents(editorRef.current);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    moduleIntroSelectionRef.current = range.cloneRange();
    updateModuleIntroBlockType(range.startContainer);
  }, [updateModuleIntroBlockType]);

  const saveModuleIntroSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;
    const range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) return;
    moduleIntroSelectionRef.current = range.cloneRange();
    updateModuleIntroBlockType(range.startContainer);
  }, [updateModuleIntroBlockType]);

  const restoreModuleIntroSelection = useCallback(() => {
    if (!editorRef.current) return false;
    const selection = window.getSelection();
    if (!selection) return false;
    editorRef.current.focus();
    if (moduleIntroSelectionRef.current) {
      selection.removeAllRanges();
      selection.addRange(moduleIntroSelectionRef.current);
      updateModuleIntroBlockType(moduleIntroSelectionRef.current.startContainer);
      return true;
    }
    focusModuleIntroEditorEnd();
    return true;
  }, [focusModuleIntroEditorEnd, updateModuleIntroBlockType]);

  const applyModuleIntroCommand = useCallback((command: string, value?: string) => {
    if (!editorRef.current) return;
    restoreModuleIntroSelection();
    execRichTextCommand(command, value);
    syncModuleIntroDraft();
    saveModuleIntroSelection();
  }, [restoreModuleIntroSelection, saveModuleIntroSelection, syncModuleIntroDraft]);

  const insertModuleIntroHtml = useCallback((html: string) => {
    if (!editorRef.current) return;
    restoreModuleIntroSelection();
    execRichTextCommand('insertHTML', html);
    syncModuleIntroDraft();
    saveModuleIntroSelection();
  }, [restoreModuleIntroSelection, saveModuleIntroSelection, syncModuleIntroDraft]);

  const openModuleIntroImagePicker = useCallback(() => {
    saveModuleIntroSelection();
    fileInputRef.current?.click();
  }, [saveModuleIntroSelection]);

  const handleModuleIntroImageFiles = useCallback((files: Iterable<File> | FileList | null | undefined) => {
    const imageFile = Array.from(files ?? []).find((file) => file.type.startsWith('image/'));
    if (!imageFile) {
      showToast('请选择 PNG、JPG、SVG 等图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result;
      if (typeof src !== 'string') return;
      const imageName = escapeHtmlAttribute(imageFile.name.replace(/\.[^.]+$/, '') || '流程图');
      insertModuleIntroHtml(buildModuleIntroImageHtml(src, imageName));
      window.requestAnimationFrame(() => {
        if (!editorRef.current) return;
        const images = Array.from(editorRef.current.querySelectorAll('[data-module-intro-image="true"]'));
        const lastImage = images.at(-1);
        if (lastImage instanceof HTMLElement) {
          selectModuleIntroImage(lastImage);
          syncModuleIntroDraft();
        }
      });
      showToast('图片已插入模块介绍');
    };
    reader.readAsDataURL(imageFile);
  }, [buildModuleIntroImageHtml, insertModuleIntroHtml, selectModuleIntroImage, showToast, syncModuleIntroDraft]);

  const handleModuleIntroImageUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    handleModuleIntroImageFiles(event.target.files);
    event.target.value = '';
  }, [handleModuleIntroImageFiles]);

  const handleModuleIntroFormatChange = useCallback((nextType: ModuleIntroBlockType) => {
    setModuleIntroBlockType(nextType);
    const formatValue = nextType === 'paragraph' ? '<p>' : `<${nextType}>`;
    applyModuleIntroCommand('formatBlock', formatValue);
  }, [applyModuleIntroCommand]);

  const handleModuleIntroLinkInsert = useCallback(() => {
    const selectedText = window.getSelection()?.toString().trim();
    if (!selectedText) {
      showToast('先选中文本，再插入链接');
      return;
    }
    const url = window.prompt('请输入链接地址', 'https://');
    if (!url) return;
    applyModuleIntroCommand('createLink', url);
  }, [applyModuleIntroCommand, showToast]);

  const handleModuleIntroTableInsert = useCallback(() => {
    insertModuleIntroHtml(
      `
        <div class="module-intro-table-wrap">
          <table class="module-intro-table">
            <thead>
              <tr><th>阶段</th><th>目标</th><th>说明</th></tr>
            </thead>
            <tbody>
              <tr><td>核算</td><td>统一口径</td><td>建立跨部门一致的成本归集规则。</td></tr>
              <tr><td>分析</td><td>识别异常</td><td>通过差异分析快速定位波动来源。</td></tr>
              <tr><td>预测</td><td>辅助决策</td><td>结合历史数据输出经营预警与建议。</td></tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
    );
  }, [insertModuleIntroHtml]);

  const polishModuleIntroContent = useCallback(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    if (!editor.querySelector('.module-intro-highlight')) {
      const leadParagraph = editor.querySelector('p');
      const summary = (leadParagraph?.textContent || '围绕成本核算、预算控制与预测预警，形成结构化业务介绍。').trim();
      editor.insertAdjacentHTML(
        'afterbegin',
        `
          <div class="module-intro-highlight">
            <div class="module-intro-highlight-eyebrow">AI 润色摘要</div>
            <p>${escapeHtmlAttribute(summary.length > 96 ? `${summary.slice(0, 96)}...` : summary)}</p>
            <div class="module-intro-pill-row">
              <span>业务全景</span>
              <span>执行闭环</span>
              <span>经营分析</span>
            </div>
          </div>
        `,
      );
    }
    syncModuleIntroDraft();
    showToast('已优化模块介绍的结构层次');
  }, [showToast, syncModuleIntroDraft]);

  const handleModuleIntroEditorMouseDown = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const resizeHandle = target.closest('[data-module-intro-image-resize-handle="true"]');
    if (resizeHandle instanceof HTMLElement) {
      const figure = resizeHandle.closest('[data-module-intro-image="true"]');
      if (!(figure instanceof HTMLElement)) return;
      event.preventDefault();
      event.stopPropagation();
      selectModuleIntroImage(figure);
      moduleIntroImageResizeRef.current = {
        startX: event.clientX,
        startWidth: figure.getBoundingClientRect().width,
      };
      return;
    }

    const figure = target.closest('[data-module-intro-image="true"]');
    if (figure instanceof HTMLElement) {
      event.preventDefault();
      selectModuleIntroImage(figure);
      return;
    }

    clearModuleIntroImageSelection();
  }, [clearModuleIntroImageSelection, selectModuleIntroImage]);

  const isFullscreenEditorEnabled = isActive && isFullscreenEditor;

  useEffect(() => {
    if (!isActive) {
      moduleIntroImageResizeRef.current = null;
      const frameId = window.requestAnimationFrame(() => {
        clearModuleIntroImageSelection(false);
        setModuleIntroSelectedImageWidth(null);
      });
      return () => window.cancelAnimationFrame(frameId);
    }
    const frameId = window.requestAnimationFrame(() => {
      hydrateModuleIntroEditor();
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [clearModuleIntroImageSelection, hydrateModuleIntroEditor, isActive, isFullscreenEditorEnabled]);

  useEffect(() => {
    const handleSelectionChange = () => {
      saveModuleIntroSelection();
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [saveModuleIntroSelection]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!moduleIntroImageResizeRef.current || !moduleIntroSelectedImageRef.current) return;
      event.preventDefault();
      const delta = event.clientX - moduleIntroImageResizeRef.current.startX;
      applyModuleIntroImageWidth(moduleIntroImageResizeRef.current.startWidth + delta);
    };
    const handleMouseUp = () => {
      if (!moduleIntroImageResizeRef.current) return;
      moduleIntroImageResizeRef.current = null;
      syncModuleIntroDraft();
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [applyModuleIntroImageWidth, syncModuleIntroDraft]);

  return {
    isFullscreenEditor: isFullscreenEditorEnabled,
    moduleIntroActions: {
      onApplyCommand: applyModuleIntroCommand,
      onEditorMouseDown: handleModuleIntroEditorMouseDown,
      onFormatChange: handleModuleIntroFormatChange,
      onImageFiles: handleModuleIntroImageFiles,
      onImagePreset: handleModuleIntroImagePreset,
      onImageUpload: handleModuleIntroImageUpload,
      onLinkInsert: handleModuleIntroLinkInsert,
      onOpenImagePicker: openModuleIntroImagePicker,
      onPolish: polishModuleIntroContent,
      onSaveSelection: saveModuleIntroSelection,
      onSyncDraft: syncModuleIntroDraft,
      onTableInsert: handleModuleIntroTableInsert,
      onToggleFullscreen: () => setIsFullscreenEditor((prev) => !prev),
    },
    moduleIntroBlockType,
    moduleIntroRefs: {
      editorRef,
      fileInputRef,
      titleEditorRef,
    },
    moduleIntroSelectedImageWidth,
  };
}

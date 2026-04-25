import { Button, cx } from '@lserp/ui';

import { HistoryIcon, PlayIcon, ShareIcon } from './bi-icons';

type BiTopToolbarProps = {
  canPublish: boolean;
  canPreview: boolean;
  isMutating: boolean;
  nodePath: string[];
  onOpenDesign: () => void;
  onOpenPreview: () => void;
  onPublish: () => void;
  previewStatusText?: string | null;
  screenName?: string | null;
};

export function BiTopToolbar({
  canPublish,
  canPreview,
  isMutating,
  nodePath,
  onOpenDesign,
  onOpenPreview,
  onPublish,
  previewStatusText,
  screenName,
}: BiTopToolbarProps) {
  return (
    <header className="bi-top-toolbar">
      <div className="bi-top-toolbar-brand">
        <div className="bi-top-toolbar-logo">BI</div>
        <div className="bi-top-toolbar-brand-text">
          <div className="bi-top-toolbar-title">BI 设计工作台</div>
          <div className="bi-top-toolbar-path">
            {nodePath.length > 0 ? (
              nodePath.map((item, index) => (
                <span key={`${item}-${index}`} className="bi-top-toolbar-path-item">
                  {index > 0 ? <span className="bi-top-toolbar-path-divider">/</span> : null}
                  {item}
                </span>
              ))
            ) : (
              <span className="bi-top-toolbar-path-item">请先选择一个目录节点开始设计</span>
            )}
          </div>
        </div>
      </div>

      <div className="bi-top-toolbar-actions">
        <Button disabled={isMutating} onClick={onOpenDesign} tone="ghost">
          <span className="bi-toolbar-button-content">
            <HistoryIcon className="bi-toolbar-button-icon" />
            设计与生成
          </span>
        </Button>
        <div className="bi-top-toolbar-preview">
          <Button disabled={!canPreview} onClick={onOpenPreview} tone="ghost">
            <span className="bi-toolbar-button-content">
              <PlayIcon className="bi-toolbar-button-icon" />
              预览页面
            </span>
          </Button>
          {previewStatusText ? <span className="bi-top-toolbar-hint">{previewStatusText}</span> : null}
        </div>
        <Button
          className={cx('bi-top-toolbar-publish', canPublish ? '' : 'is-disabled')}
          disabled={!canPublish || isMutating}
          onClick={onPublish}
        >
          <span className="bi-toolbar-button-content">
            <ShareIcon className="bi-toolbar-button-icon" />
            {screenName ? `发布 ${screenName}` : '发布当前版本'}
          </span>
        </Button>
        <div className="bi-top-toolbar-avatar" aria-hidden="true">
          BI
        </div>
      </div>
    </header>
  );
}

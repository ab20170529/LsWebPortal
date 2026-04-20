import { Button, cx } from '@lserp/ui';

import { HistoryIcon, PlayIcon, ShareIcon } from './bi-icons';

type BiTopToolbarProps = {
  canPublish: boolean;
  isMutating: boolean;
  nodePath: string[];
  onOpenHistory: () => void;
  onOpenPreview: () => void;
  onPublish: () => void;
  screenName?: string | null;
};

export function BiTopToolbar({
  canPublish,
  isMutating,
  nodePath,
  onOpenHistory,
  onOpenPreview,
  onPublish,
  screenName,
}: BiTopToolbarProps) {
  return (
    <header className="bi-top-toolbar">
      <div className="bi-top-toolbar-brand">
        <div className="bi-top-toolbar-logo">BI</div>
        <div className="bi-top-toolbar-brand-text">
          <div className="bi-top-toolbar-title">BI Architecture Designer</div>
          <div className="bi-top-toolbar-path">
            {nodePath.length > 0 ? (
              nodePath.map((item, index) => (
                <span key={`${item}-${index}`} className="bi-top-toolbar-path-item">
                  {index > 0 ? <span className="bi-top-toolbar-path-divider">/</span> : null}
                  {item}
                </span>
              ))
            ) : (
              <span className="bi-top-toolbar-path-item">请选择一个目录节点开始设计</span>
            )}
          </div>
        </div>
      </div>

      <div className="bi-top-toolbar-actions">
        <Button disabled={isMutating} onClick={onOpenHistory} tone="ghost">
          <span className="bi-toolbar-button-content">
            <HistoryIcon className="bi-toolbar-button-icon" />
            设计记录
          </span>
        </Button>
        <Button disabled={!screenName} onClick={onOpenPreview} tone="ghost">
          <span className="bi-toolbar-button-content">
            <PlayIcon className="bi-toolbar-button-icon" />
            预览页面
          </span>
        </Button>
        <Button
          className={cx('bi-top-toolbar-publish', canPublish ? '' : 'is-disabled')}
          disabled={!canPublish || isMutating}
          onClick={onPublish}
        >
          <span className="bi-toolbar-button-content">
            <ShareIcon className="bi-toolbar-button-icon" />
            {screenName ? `发布 ${screenName}` : '发布版本'}
          </span>
        </Button>
        <div className="bi-top-toolbar-avatar" aria-hidden="true">
          BI
        </div>
      </div>
    </header>
  );
}

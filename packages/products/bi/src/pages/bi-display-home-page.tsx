import { biDisplayPlatforms } from '../display/display-platform-registry';
import { navigateBiDisplay } from '../utils/bi-display-routes';

export function BiDisplayHomePage() {
  return (
    <div className="bi-display-selector-page">
      <div className="bi-display-selector-shell">
        <div className="bi-display-selector-hero">
          <div className="bi-display-selector-eyebrow">BI DISPLAY SYSTEM</div>
          <h1 className="bi-display-selector-title">选择展示平台</h1>
          <p className="bi-display-selector-text">
            复用现有 BI 目录树和 runtime 接口，按平台入口进入对应的沉浸式组织展示大屏。
          </p>
        </div>

        <div className="bi-display-selector-grid">
          {biDisplayPlatforms.map((platform) => (
            <button
              key={platform.platformCode}
              className="bi-display-selector-card"
              onClick={() => {
                navigateBiDisplay(`/bi-display/platform/${platform.platformCode}`);
              }}
              type="button"
            >
              <div className="bi-display-selector-card-top">
                <span className="bi-display-selector-card-tag">{platform.platformCode.toUpperCase()}</span>
                <span
                  className="bi-display-selector-card-accent"
                  style={{ backgroundColor: platform.accent }}
                />
              </div>
              <div className="bi-display-selector-card-title">{platform.title}</div>
              <div className="bi-display-selector-card-subtitle">{platform.subtitle}</div>
              <div className="bi-display-selector-card-text">{platform.description}</div>
              <div className="bi-display-selector-card-cover">
                <div className="bi-display-selector-card-hero-value">{platform.heroValue}</div>
                <div className="bi-display-selector-card-hero-label">{platform.heroLabel}</div>
                <div className="bi-display-selector-card-cover-lines">
                  {platform.coverLines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

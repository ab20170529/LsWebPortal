import React, { useEffect, useRef, useState } from 'react';
import {
  buildMultilineDisplayLines,
  type ResearchLineColorMap,
} from './research-record-multiline';
import {
  buildNumberedLineEntries,
  buildWorkDescriptionLineEntries,
} from './research-record-word-template-shared';

type ResearchPreviewContentMultilineFieldKey = 'formsProvided' | 'workDescription' | 'painPoints' | 'suggestions';
type ResearchPreviewDraftMultilineFieldKey = 'departmentPosts' | 'workTools' | 'overallPainPoints' | 'specialDiscussion' | 'extraNotes';

type ResearchPreviewStepId = 'overview' | 'environment' | 'contents' | 'output';

type ResearchPreviewContentLineColors = Partial<Record<ResearchPreviewContentMultilineFieldKey, ResearchLineColorMap>>;
type ResearchPreviewDraftLineColors = Partial<Record<ResearchPreviewDraftMultilineFieldKey, ResearchLineColorMap>>;

type ResearchPreviewContentItem = {
  businessTheme: string;
  formsProvided: string;
  id: string;
  jobRole: string;
  lineColors: ResearchPreviewContentLineColors;
  linkedModuleName: string;
  linkedModuleTable: string;
  painPoints: string;
  sceneName: string;
  suggestions: string;
  timeShare: string;
  workDescription: string;
};

type ResearchPreviewContentMaster = {
  objective: string;
  processOwner: string;
  summary: string;
  title: string;
};

type ResearchPreviewDraft = {
  companyName: string;
  contentItems: ResearchPreviewContentItem[];
  contentMaster: ResearchPreviewContentMaster;
  departmentName: string;
  departmentPosts: string;
  documentNo: string;
  engineers: string;
  extraNotes: string;
  lineColors: ResearchPreviewDraftLineColors;
  overallPainPoints: string;
  projectName: string;
  respondents: string;
  signer: string;
  signerDate: string;
  specialDiscussion: string;
  surveyCount: string;
  surveyDate: string;
  surveyLocation: string;
  surveyScope: string;
  workTools: string;
};

type ResearchRecordWordTemplatePreviewProps = {
  activeStep: ResearchPreviewStepId;
  draft: ResearchPreviewDraft;
  focusKey: string;
  selectedContentItemId: string | null;
  templateUrl: string;
};

const EMPTY_CELL = '\u3000';

function toDelimitedParts(value: string, delimiters: RegExp) {
  return value
    .split(delimiters)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatChineseDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return trimmed;
  }

  const [, year, month, day] = match;
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function formatScopeDisplay(value: string) {
  if (value === '全员') {
    return '全员☑ 部门□ 单独□';
  }
  if (value === '单独') {
    return '全员□ 部门□ 单独☑';
  }
  return '全员□ 部门☑ 单独□';
}

function renderValue(value: string, fallback = '') {
  return value.trim() || fallback;
}

function renderNumberedLines(value: string, lineColors: ResearchLineColorMap = {}) {
  const lines = buildNumberedLineEntries(value, lineColors);
  if (lines.length === 0) {
    return <div>{EMPTY_CELL}</div>;
  }
  return lines.map((line) => (
    <div
      key={`${line.rawIndex}-${line.text}`}
      className={line.color === 'red' ? 'research-word-line-emphasis' : undefined}
    >
      {line.text}
    </div>
  ));
}

function renderPlainLines(lines: ReturnType<typeof buildWorkDescriptionLineEntries>) {
  if (lines.length === 0) {
    return <div>{EMPTY_CELL}</div>;
  }

  return lines.map((line) => (
    <div
      key={`${line.rawIndex}-${line.text}`}
      className={line.color === 'red' ? 'research-word-line-emphasis' : undefined}
    >
      {line.text}
    </div>
  ));
}

function renderInlineDelimitedLines(value: string, lineColors: ResearchLineColorMap = {}) {
  const lines = buildMultilineDisplayLines(value, lineColors);
  if (lines.length === 0) {
    return <span>{EMPTY_CELL}</span>;
  }

  return lines.map((line, index) => (
    <React.Fragment key={`${line.rawIndex}-${line.text}`}>
      {index > 0 ? <span className="research-word-inline-separator">、</span> : null}
      <span className={line.color === 'red' ? 'research-word-line-emphasis' : undefined}>
        {line.text}
      </span>
    </React.Fragment>
  ));
}

function getContentItemDisplayName(item: ResearchPreviewContentItem, index: number) {
  return item.businessTheme.trim() || item.sceneName.trim() || `调研明细 ${index + 1}`;
}

function getContentItemSubheading(item: ResearchPreviewContentItem) {
  const sceneName = item.sceneName.trim();
  const businessTheme = item.businessTheme.trim();
  if (!sceneName || !businessTheme || sceneName === businessTheme || businessTheme.includes(sceneName)) {
    return '';
  }
  return sceneName;
}

function resolveFocusSelector(focusKey: string, activeStep: ResearchPreviewStepId) {
  if (focusKey.startsWith('content-item:')) {
    return `[data-focus-key="${focusKey}"]`;
  }
  if (focusKey === 'overview' || focusKey === 'environment' || focusKey === 'contents' || focusKey === 'output') {
    return `[data-focus-key="${focusKey}"]`;
  }
  if (activeStep === 'contents') {
    return '[data-focus-key="contents"]';
  }
  return `[data-focus-key="${activeStep}"]`;
}

export function ResearchRecordWordTemplatePreview({
  activeStep,
  draft,
  focusKey,
  selectedContentItemId,
}: ResearchRecordWordTemplatePreviewProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const effectiveScale = Math.max(scale, Math.min(0.9, fitScale + 0.01));

  useEffect(() => {
    const viewport = viewportRef.current;
    const page = pageRef.current;
    if (!viewport || !page || typeof ResizeObserver === 'undefined') return;

    const updateScale = () => {
      const widthFitScale = (viewport.clientWidth - 36) / page.scrollWidth;
      const heightFitScale = (viewport.clientHeight - 28) / page.scrollHeight;
      const nextFitScale = Math.min(0.9, Math.max(0.44, Math.min(widthFitScale, heightFitScale)));
      setFitScale(nextFitScale);
      setScale((current) => {
        if (Math.abs(current - 1) < 0.01 || current > 0.9) {
          return nextFitScale;
        }
        return current;
      });
    };

    updateScale();

    const observer = new ResizeObserver(() => updateScale());
    observer.observe(viewport);
    observer.observe(page);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const page = pageRef.current;
    if (!viewport || !page) return;

    const selector = resolveFocusSelector(focusKey, activeStep);
    const target = page.querySelector(selector) as HTMLElement | null;
    if (!target) return;

    const allTargets = Array.from(page.querySelectorAll('.research-preview-focus-target')) as HTMLElement[];
    allTargets.forEach((node) => node.classList.remove('research-preview-focus-target'));
    target.classList.add('research-preview-focus-target');

    const top = Math.max(0, target.offsetTop * effectiveScale - 28);
    viewport.scrollTo({ top, behavior: 'smooth' });
  }, [activeStep, effectiveScale, focusKey, selectedContentItemId]);

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden border-l border-slate-200 bg-[#f6f6f4]">
      <style>{`
        .research-record-docx-preview {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          background:
            linear-gradient(180deg, rgba(241, 245, 249, 0.96) 0%, rgba(241, 245, 249, 0.88) 100%),
            linear-gradient(90deg, rgba(148, 163, 184, 0.07) 1px, transparent 1px),
            linear-gradient(rgba(148, 163, 184, 0.07) 1px, transparent 1px);
          background-size: auto, 28px 28px, 28px 28px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .research-record-docx-preview::-webkit-scrollbar {
          display: none;
        }

        .research-record-docx-stage {
          transform-origin: top center;
          transition: transform 160ms ease;
          will-change: transform;
        }

        .research-word-page {
          width: 860px;
          margin: 6px auto 16px;
          background: #fff;
          color: #000;
          box-shadow: 0 18px 40px -34px rgba(15, 23, 42, 0.22);
        }

        .research-word-sheet {
          padding: 52px 60px 58px;
          font-family: "FangSong", "STFangsong", "SimSun", "Songti SC", serif;
          font-size: 10.5pt;
          line-height: 1.8;
        }

        .research-word-company {
          font-family: "SimSun", "Songti SC", serif;
          font-size: 18pt;
          font-weight: 700;
          line-height: 1.25;
          text-align: center;
          color: #000;
        }

        .research-word-title {
          margin-top: 4px;
          font-family: "SimSun", "Songti SC", serif;
          font-size: 15pt;
          font-weight: 700;
          line-height: 1.3;
          text-align: center;
          color: #000;
        }

        .research-word-section {
          margin-top: 12px;
        }

        .research-word-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          margin: 0;
        }

        .research-word-table th,
        .research-word-table td {
          border: 1px solid #000;
          padding: 5px 7px;
          vertical-align: middle;
          word-break: break-word;
          color: #000;
        }

        .research-word-table th {
          font-family: "SimSun", "Songti SC", serif;
          font-size: 10.5pt;
          font-weight: 400;
          line-height: 1.55;
          text-align: center;
        }

        .research-word-table td {
          font-family: "FangSong", "STFangsong", "SimSun", serif;
          font-size: 10.5pt;
          line-height: 1.72;
          white-space: pre-wrap;
        }

        .research-word-overview-table col:nth-child(1),
        .research-word-overview-table col:nth-child(3),
        .research-word-overview-table col:nth-child(5) {
          width: 12.8%;
        }

        .research-word-overview-table col:nth-child(2),
        .research-word-overview-table col:nth-child(4),
        .research-word-overview-table col:nth-child(6) {
          width: 20.533%;
        }

        .research-word-overview-table td,
        .research-word-overview-table th {
          min-height: 30px;
        }

        .research-word-single-table th,
        .research-word-single-table td,
        .research-word-output-table th,
        .research-word-output-table td {
          text-align: left;
        }

        .research-word-section-row-title {
          font-family: "FangSong", "STFangsong", "SimSun", serif;
          font-weight: 400;
        }

        .research-word-section-row-title.research-word-section-row-title-strong {
          font-weight: 700;
        }

        .research-word-section-row-value {
          min-height: 32px;
          vertical-align: top;
        }

        .research-word-line-stack > div + div {
          margin-top: 2px;
        }

        .research-word-inline-flow {
          white-space: normal;
          word-break: break-word;
        }

        .research-word-inline-separator {
          display: inline;
        }

        .research-word-line-emphasis {
          color: #8f1d2c;
        }

        .research-word-contents-table {
          margin-top: -1px;
        }

        .research-word-contents-table col:nth-child(1) {
          width: 16%;
        }

        .research-word-contents-table col:nth-child(2) {
          width: 15%;
        }

        .research-word-contents-table col:nth-child(3) {
          width: 69%;
        }

        .research-word-detail-name-cell {
          text-align: center;
          vertical-align: middle;
          font-family: "FangSong", "STFangsong", "SimSun", serif;
          line-height: 1.65;
          padding: 10px 8px;
        }

        .research-word-detail-name-main {
          font-weight: 700;
        }

        .research-word-detail-name-sub {
          margin-top: 4px;
          font-weight: 400;
        }

        .research-word-detail-label-cell {
          text-align: center;
          vertical-align: middle;
          font-family: "SimSun", "Songti SC", serif;
          font-size: 10.5pt;
          line-height: 1.55;
          padding: 8px 6px;
        }

        .research-word-detail-item-cell {
          vertical-align: top;
          min-height: 30px;
          padding: 8px 10px;
        }

        .research-word-detail-item-cell.research-word-detail-item-cell-large {
          min-height: 72px;
        }

        .research-word-detail-item-value {
          display: block;
          min-height: 18px;
        }

        .research-word-empty-note {
          color: #4b5563;
        }

        .research-word-signature {
          margin-top: 18px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 220px;
          gap: 18px;
          align-items: end;
        }

        .research-word-signature-item {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          min-height: 30px;
        }

        .research-word-signature-label {
          font-family: "FangSong", "STFangsong", "SimSun", serif;
          font-size: 10.5pt;
          line-height: 1.7;
          color: #000;
          white-space: nowrap;
        }

        .research-word-signature-fill {
          flex: 1;
          min-height: 24px;
          border-bottom: 1px solid #000;
          font-family: "FangSong", "STFangsong", "SimSun", serif;
          font-size: 10.5pt;
          line-height: 1.7;
          color: #000;
        }

        .research-word-signature-date {
          min-height: 24px;
          border-bottom: 1px solid #000;
          font-family: "FangSong", "STFangsong", "SimSun", serif;
          font-size: 10.5pt;
          line-height: 1.7;
          color: #000;
        }

        .research-preview-focus-target {
          background: rgba(248, 251, 255, 0.82);
          box-shadow: inset 0 0 0 1px rgba(49, 98, 255, 0.2);
          animation: researchPreviewFocusPulse 1.4s ease;
        }

        @keyframes researchPreviewFocusPulse {
          0% { box-shadow: inset 0 0 0 2px rgba(49, 98, 255, 0.28); }
          100% { box-shadow: inset 0 0 0 1px rgba(49, 98, 255, 0.2); }
        }
      `}</style>

      <div ref={viewportRef} className="research-record-docx-preview min-h-0 flex-1 overflow-auto px-4 py-4">
        <div
          className="research-record-docx-stage mx-auto min-h-full"
          style={{
            transform: `scale(${scale})`,
            width: scale > 0 ? `${100 / scale}%` : '100%',
          }}
        >
          <div ref={pageRef} className="research-word-page">
            <div className="research-word-sheet">
              <section data-focus-key="overview">
                <div className="research-word-company">{renderValue(draft.companyName, '东方水利智能科技股份有限公司')}</div>
                <div className="research-word-title">{`${renderValue(draft.projectName, '数字一体化平台项目')}-调研访谈记录`}</div>

                <div className="research-word-section">
                  <table className="research-word-table research-word-overview-table">
                    <colgroup>
                      <col />
                      <col />
                      <col />
                      <col />
                      <col />
                      <col />
                    </colgroup>
                    <tbody>
                      <tr>
                        <th>调研时间</th>
                        <td>{renderValue(formatChineseDate(draft.surveyDate), EMPTY_CELL)}</td>
                        <th>调研地点</th>
                        <td>{renderValue(draft.surveyLocation, EMPTY_CELL)}</td>
                        <th>文件号</th>
                        <td>{renderValue(draft.documentNo, EMPTY_CELL)}</td>
                      </tr>
                      <tr>
                        <th>调研部门</th>
                        <td>{renderValue(draft.departmentName, EMPTY_CELL)}</td>
                        <th>调研范围</th>
                        <td>{renderValue(formatScopeDisplay(draft.surveyScope), EMPTY_CELL)}</td>
                        <th>调研次数</th>
                        <td>{renderValue(draft.surveyCount, EMPTY_CELL)}</td>
                      </tr>
                      <tr>
                        <th>受访人员</th>
                        <td colSpan={3}>{renderValue(toDelimitedParts(draft.respondents, /[、,，\n]+/).join('、'), EMPTY_CELL)}</td>
                        <th>调研工程师</th>
                        <td>{renderValue(toDelimitedParts(draft.engineers, /[、,，\n]+/).join('、'), EMPTY_CELL)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="research-word-section" data-focus-key="environment">
                <table className="research-word-table research-word-single-table">
                  <tbody>
                    <tr>
                      <th className="research-word-section-row-title">一、部门岗位</th>
                    </tr>
                    <tr>
                      <td className="research-word-section-row-value">
                        <div className="research-word-line-stack">
                          {renderNumberedLines(draft.departmentPosts, draft.lineColors.departmentPosts)}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th className="research-word-section-row-title research-word-section-row-title-strong">二、工作工具</th>
                    </tr>
                    <tr>
                      <td className="research-word-section-row-value">
                        <div className="research-word-inline-flow">
                          {renderInlineDelimitedLines(draft.workTools, draft.lineColors.workTools)}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <section className="research-word-section" data-focus-key="contents">
                <table className="research-word-table research-word-single-table">
                  <tbody>
                    <tr>
                      <th className="research-word-section-row-title">三、调研内容</th>
                    </tr>
                  </tbody>
                </table>

                {draft.contentItems.length > 0 ? (
                  draft.contentItems.map((item, index) => {
                    const displayName = getContentItemDisplayName(item, index);
                    const subheading = getContentItemSubheading(item);
                    return (
                      <table
                        key={item.id}
                        className="research-word-table research-word-contents-table"
                        data-focus-key={`content-item:${item.id}`}
                      >
                        <colgroup>
                          <col />
                          <col />
                          <col />
                        </colgroup>
                        <tbody>
                          <tr>
                            <td rowSpan={6} className="research-word-detail-name-cell">
                              <div className="research-word-detail-name-main">{displayName || EMPTY_CELL}</div>
                              {subheading ? <div className="research-word-detail-name-sub">{subheading}</div> : null}
                            </td>
                            <td className="research-word-detail-label-cell">工作岗位</td>
                            <td className="research-word-detail-item-cell">
                              <span className="research-word-detail-item-value">{renderValue(item.jobRole, EMPTY_CELL)}</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="research-word-detail-label-cell">工时占比</td>
                            <td className="research-word-detail-item-cell">
                              <span className="research-word-detail-item-value">{renderValue(item.timeShare, EMPTY_CELL)}</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="research-word-detail-label-cell">表单提供</td>
                            <td className="research-word-detail-item-cell">
                              <div className="research-word-line-stack">
                                {renderNumberedLines(item.formsProvided, item.lineColors.formsProvided)}
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="research-word-detail-label-cell">工作描述</td>
                            <td className="research-word-detail-item-cell research-word-detail-item-cell-large">
                              <div className="research-word-line-stack">
                                {renderPlainLines(buildWorkDescriptionLineEntries({
                                  fallbackModuleName: item.businessTheme,
                                  lineColors: item.lineColors.workDescription,
                                  linkedModuleName: item.linkedModuleName,
                                  value: item.workDescription,
                                }))}
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="research-word-detail-label-cell">痛点说明</td>
                            <td className="research-word-detail-item-cell">
                              <div className="research-word-line-stack">
                                {renderNumberedLines(item.painPoints, item.lineColors.painPoints)}
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="research-word-detail-label-cell">朗速建议</td>
                            <td className="research-word-detail-item-cell research-word-detail-item-cell-large">
                              <div className="research-word-line-stack">
                                {renderNumberedLines(item.suggestions, item.lineColors.suggestions)}
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    );
                  })
                ) : (
                  <table className="research-word-table research-word-contents-table">
                    <colgroup>
                      <col />
                      <col />
                      <col />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td rowSpan={6} className="research-word-detail-name-cell">
                          <div className="research-word-empty-note">暂无明细</div>
                        </td>
                        <td className="research-word-detail-label-cell">工作岗位</td>
                        <td className="research-word-detail-item-cell">
                          {EMPTY_CELL}
                        </td>
                      </tr>
                      <tr>
                        <td className="research-word-detail-label-cell">工时占比</td>
                        <td className="research-word-detail-item-cell">
                          {EMPTY_CELL}
                        </td>
                      </tr>
                      <tr>
                        <td className="research-word-detail-label-cell">表单提供</td>
                        <td className="research-word-detail-item-cell">
                          {EMPTY_CELL}
                        </td>
                      </tr>
                      <tr>
                        <td className="research-word-detail-label-cell">工作描述</td>
                        <td className="research-word-detail-item-cell research-word-detail-item-cell-large">
                          {EMPTY_CELL}
                        </td>
                      </tr>
                      <tr>
                        <td className="research-word-detail-label-cell">痛点说明</td>
                        <td className="research-word-detail-item-cell">
                          {EMPTY_CELL}
                        </td>
                      </tr>
                      <tr>
                        <td className="research-word-detail-label-cell">朗速建议</td>
                        <td className="research-word-detail-item-cell research-word-detail-item-cell-large">
                          {EMPTY_CELL}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </section>

              <section className="research-word-section" data-focus-key="output">
                <table className="research-word-table research-word-output-table">
                  <tbody>
                    <tr>
                      <th className="research-word-section-row-title">四、整体痛点难点描述</th>
                    </tr>
                    <tr>
                      <td className="research-word-section-row-value">
                        <div className="research-word-line-stack">
                          {renderNumberedLines(draft.overallPainPoints, draft.lineColors.overallPainPoints)}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th className="research-word-section-row-title">五、业务专项事项讨论</th>
                    </tr>
                    <tr>
                      <td className="research-word-section-row-value">
                        <div className="research-word-line-stack">
                          {renderNumberedLines(draft.specialDiscussion, draft.lineColors.specialDiscussion)}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th className="research-word-section-row-title research-word-section-row-title-strong">六、其他补充</th>
                    </tr>
                    <tr>
                      <td className="research-word-section-row-value">
                        <div className="research-word-line-stack">
                          {renderNumberedLines(draft.extraNotes, draft.lineColors.extraNotes)}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="research-word-signature">
                  <div className="research-word-signature-item">
                    <span className="research-word-signature-label">受访人（签字确认）：</span>
                    <span className="research-word-signature-fill">{renderValue(draft.signer, EMPTY_CELL)}</span>
                  </div>
                  <div className="research-word-signature-date">{renderValue(formatChineseDate(draft.signerDate), EMPTY_CELL)}</div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

    </aside>
  );
}

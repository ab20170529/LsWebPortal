import {
  buildMultilineDisplayLines,
  type ResearchLineColorMap,
  type ResearchLineColorTone,
} from './research-record-multiline';

type ResearchWordContentMultilineFieldKey = 'formsProvided' | 'workDescription' | 'painPoints' | 'suggestions';
type ResearchWordDraftMultilineFieldKey = 'departmentPosts' | 'workTools' | 'overallPainPoints' | 'specialDiscussion' | 'extraNotes';

type ResearchWordContentLineColors = Partial<Record<ResearchWordContentMultilineFieldKey, ResearchLineColorMap>>;
type ResearchWordDraftLineColors = Partial<Record<ResearchWordDraftMultilineFieldKey, ResearchLineColorMap>>;

type ResearchWordContentItem = {
  businessTheme: string;
  formsProvided: string;
  id: string;
  jobRole: string;
  lineColors: ResearchWordContentLineColors;
  linkedModuleName: string;
  linkedModuleTable: string;
  painPoints: string;
  sceneName: string;
  suggestions: string;
  timeShare: string;
  workDescription: string;
};

type ResearchWordDraft = {
  companyName: string;
  contentItems: ResearchWordContentItem[];
  departmentName: string;
  departmentPosts: string;
  documentNo: string;
  engineers: string;
  extraNotes: string;
  lineColors: ResearchWordDraftLineColors;
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

type BuildResearchRecordWordPageHtmlOptions = {
  includeFocusAttributes?: boolean;
};

const EMPTY_CELL = '\u3000';

export type ResearchWordLineEntry = {
  color: ResearchLineColorTone;
  rawIndex: number;
  text: string;
};

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderValue(value: string, fallback = EMPTY_CELL) {
  const trimmed = value.trim();
  return escapeHtml(trimmed || fallback);
}

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

  const match = trimmed.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (!match) {
    return trimmed;
  }

  const [, year, month, day] = match;
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function formatScopeDisplay(value: string) {
  if (value === '全员') {
    return '全员 ☑ 部门 □ 单独 □';
  }
  if (value === '单独') {
    return '全员 □ 部门 □ 单独 ☑';
  }
  return '全员 □ 部门 ☑ 单独 □';
}

function hasExistingLineOrder(value: string) {
  return /^\s*\d+\s*[、,，.．)）]\s*/.test(value);
}

export function buildNumberedLineEntries(value: string, lineColors: ResearchLineColorMap = {}): ResearchWordLineEntry[] {
  return buildMultilineDisplayLines(value, lineColors).map((line) => ({
    color: line.color,
    rawIndex: line.rawIndex,
    text: hasExistingLineOrder(line.text) ? line.text : `${line.order}、${line.text}`,
  }));
}

export function buildPlainLineEntries(value: string, lineColors: ResearchLineColorMap = {}): ResearchWordLineEntry[] {
  return buildMultilineDisplayLines(value, lineColors).map((line) => ({
    color: line.color,
    rawIndex: line.rawIndex,
    text: line.text,
  }));
}

export function buildWorkDescriptionLineEntries(input: {
  fallbackModuleName?: string;
  lineColors?: ResearchLineColorMap;
  linkedModuleName?: string;
  value: string;
}): ResearchWordLineEntry[] {
  const lines = buildPlainLineEntries(input.value, input.lineColors ?? {});
  const moduleName = (input.linkedModuleName ?? '').trim() || (input.fallbackModuleName ?? '').trim();
  if (!moduleName) {
    return lines;
  }

  const moduleLine = `    关联模块：${moduleName}`;
  if (lines.length === 0) {
    return [{ color: 'default', rawIndex: -1, text: moduleLine }];
  }

  const [firstLine, ...restLines] = lines;
  if (firstLine.text.replace(/^\s+/, '').startsWith('关联模块：')) {
    return [{ ...firstLine, text: moduleLine }, ...restLines];
  }

  return [{ color: 'default', rawIndex: -1, text: moduleLine }, ...lines];
}

function renderLineEntriesHtml(lines: ResearchWordLineEntry[]) {
  if (lines.length === 0) {
    return `<div>${EMPTY_CELL}</div>`;
  }

  return lines
    .map((line) => {
      const className = line.color === 'red' ? 'research-word-line-emphasis' : '';
      return `<div class="${className}">${escapeHtml(line.text)}</div>`;
    })
    .join('');
}

function renderNumberedLinesHtml(value: string, lineColors: ResearchLineColorMap = {}) {
  return renderLineEntriesHtml(buildNumberedLineEntries(value, lineColors));
}

function renderPlainLinesHtml(lines: ResearchWordLineEntry[]) {
  return renderLineEntriesHtml(lines);
}

function renderInlineDelimitedLinesHtml(value: string, lineColors: ResearchLineColorMap = {}) {
  const lines = buildMultilineDisplayLines(value, lineColors);
  if (lines.length === 0) {
    return `<span>${EMPTY_CELL}</span>`;
  }

  return lines
    .map((line, index) => {
      const className = line.color === 'red' ? 'research-word-line-emphasis' : '';
      const separator = index > 0 ? '<span class="research-word-inline-separator">、</span>' : '';
      return `${separator}<span class="${className}">${escapeHtml(line.text)}</span>`;
    })
    .join('');
}

function getContentItemDisplayName(item: ResearchWordContentItem, index: number) {
  return item.businessTheme.trim() || item.sceneName.trim() || `调研明细 ${index + 1}`;
}

function getContentItemSubheading(item: ResearchWordContentItem) {
  const sceneName = item.sceneName.trim();
  const businessTheme = item.businessTheme.trim();
  if (!sceneName || !businessTheme || sceneName === businessTheme || businessTheme.includes(sceneName)) {
    return '';
  }
  return sceneName;
}

function buildFocusAttr(value: string, includeFocusAttributes: boolean) {
  return includeFocusAttributes ? ` data-focus-key="${escapeHtml(value)}"` : '';
}

export const RESEARCH_RECORD_WORD_PAGE_CSS = `
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
`;

export function buildResearchRecordWordPageHtml(
  draft: ResearchWordDraft,
  options: BuildResearchRecordWordPageHtmlOptions = {},
) {
  const includeFocusAttributes = options.includeFocusAttributes ?? false;
  const contentItemsHtml = draft.contentItems.length > 0
    ? draft.contentItems.map((item, index) => {
      const displayName = getContentItemDisplayName(item, index);
      const subheading = getContentItemSubheading(item);
      return `
        <table
          class="research-word-table research-word-contents-table"
          ${buildFocusAttr(`content-item:${item.id}`, includeFocusAttributes)}
        >
          <colgroup>
            <col />
            <col />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <td rowspan="6" class="research-word-detail-name-cell">
                <div class="research-word-detail-name-main">${renderValue(displayName)}</div>
                ${subheading ? `<div class="research-word-detail-name-sub">${renderValue(subheading)}</div>` : ''}
              </td>
              <td class="research-word-detail-label-cell">工作岗位</td>
              <td class="research-word-detail-item-cell">
                <span class="research-word-detail-item-value">${renderValue(item.jobRole)}</span>
              </td>
            </tr>
            <tr>
              <td class="research-word-detail-label-cell">工时占比</td>
              <td class="research-word-detail-item-cell">
                <span class="research-word-detail-item-value">${renderValue(item.timeShare)}</span>
              </td>
            </tr>
            <tr>
              <td class="research-word-detail-label-cell">表单提供</td>
              <td class="research-word-detail-item-cell">
                <div class="research-word-line-stack">
                  ${renderNumberedLinesHtml(item.formsProvided, item.lineColors.formsProvided)}
                </div>
              </td>
            </tr>
            <tr>
              <td class="research-word-detail-label-cell">工作描述</td>
              <td class="research-word-detail-item-cell research-word-detail-item-cell-large">
                <div class="research-word-line-stack">
                  ${renderPlainLinesHtml(buildWorkDescriptionLineEntries({
                    fallbackModuleName: item.businessTheme,
                    lineColors: item.lineColors.workDescription,
                    linkedModuleName: item.linkedModuleName,
                    value: item.workDescription,
                  }))}
                </div>
              </td>
            </tr>
            <tr>
              <td class="research-word-detail-label-cell">痛点说明</td>
              <td class="research-word-detail-item-cell">
                <div class="research-word-line-stack">
                  ${renderNumberedLinesHtml(item.painPoints, item.lineColors.painPoints)}
                </div>
              </td>
            </tr>
            <tr>
              <td class="research-word-detail-label-cell">朗速建议</td>
              <td class="research-word-detail-item-cell research-word-detail-item-cell-large">
                <div class="research-word-line-stack">
                  ${renderNumberedLinesHtml(item.suggestions, item.lineColors.suggestions)}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      `;
    }).join('')
    : `
      <table class="research-word-table research-word-contents-table">
        <colgroup>
          <col />
          <col />
          <col />
        </colgroup>
        <tbody>
          <tr>
            <td rowspan="6" class="research-word-detail-name-cell">
              <div class="research-word-empty-note">暂无明细</div>
            </td>
            <td class="research-word-detail-label-cell">工作岗位</td>
            <td class="research-word-detail-item-cell">${EMPTY_CELL}</td>
          </tr>
          <tr>
            <td class="research-word-detail-label-cell">工时占比</td>
            <td class="research-word-detail-item-cell">${EMPTY_CELL}</td>
          </tr>
          <tr>
            <td class="research-word-detail-label-cell">表单提供</td>
            <td class="research-word-detail-item-cell">${EMPTY_CELL}</td>
          </tr>
          <tr>
            <td class="research-word-detail-label-cell">工作描述</td>
            <td class="research-word-detail-item-cell research-word-detail-item-cell-large">${EMPTY_CELL}</td>
          </tr>
          <tr>
            <td class="research-word-detail-label-cell">痛点说明</td>
            <td class="research-word-detail-item-cell">${EMPTY_CELL}</td>
          </tr>
          <tr>
            <td class="research-word-detail-label-cell">朗速建议</td>
            <td class="research-word-detail-item-cell research-word-detail-item-cell-large">${EMPTY_CELL}</td>
          </tr>
        </tbody>
      </table>
    `;

  return `
    <div class="research-word-page">
      <div class="research-word-sheet">
        <section${buildFocusAttr('overview', includeFocusAttributes)}>
          <div class="research-word-company">${renderValue(draft.companyName, '东方水利智能科技股份有限公司')}</div>
          <div class="research-word-title">${renderValue(draft.projectName, '仓储管理数字一体化平台项目')}-调研访谈记录</div>

          <div class="research-word-section">
            <table class="research-word-table research-word-overview-table">
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
                  <td>${renderValue(formatChineseDate(draft.surveyDate), EMPTY_CELL)}</td>
                  <th>调研地点</th>
                  <td>${renderValue(draft.surveyLocation, EMPTY_CELL)}</td>
                  <th>文件号</th>
                  <td>${renderValue(draft.documentNo, EMPTY_CELL)}</td>
                </tr>
                <tr>
                  <th>调研部门</th>
                  <td>${renderValue(draft.departmentName, EMPTY_CELL)}</td>
                  <th>调研范围</th>
                  <td>${renderValue(formatScopeDisplay(draft.surveyScope), EMPTY_CELL)}</td>
                  <th>调研次数</th>
                  <td>${renderValue(draft.surveyCount, EMPTY_CELL)}</td>
                </tr>
                <tr>
                  <th>受访人员</th>
                  <td colspan="3">${renderValue(toDelimitedParts(draft.respondents, /[、,，\n]+/).join('、'), EMPTY_CELL)}</td>
                  <th>调研工程师</th>
                  <td>${renderValue(toDelimitedParts(draft.engineers, /[、,，\n]+/).join('、'), EMPTY_CELL)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="research-word-section"${buildFocusAttr('environment', includeFocusAttributes)}>
          <table class="research-word-table research-word-single-table">
            <tbody>
              <tr>
                <th class="research-word-section-row-title">一、部门岗位</th>
              </tr>
              <tr>
                <td class="research-word-section-row-value">
                  <div class="research-word-line-stack">
                    ${renderNumberedLinesHtml(draft.departmentPosts, draft.lineColors.departmentPosts)}
                  </div>
                </td>
              </tr>
              <tr>
                <th class="research-word-section-row-title research-word-section-row-title-strong">二、工作工具</th>
              </tr>
              <tr>
                <td class="research-word-section-row-value">
                  <div class="research-word-inline-flow">
                    ${renderInlineDelimitedLinesHtml(draft.workTools, draft.lineColors.workTools)}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="research-word-section"${buildFocusAttr('contents', includeFocusAttributes)}>
          <table class="research-word-table research-word-single-table">
            <tbody>
              <tr>
                <th class="research-word-section-row-title">三、调研内容</th>
              </tr>
            </tbody>
          </table>
          ${contentItemsHtml}
        </section>

        <section class="research-word-section"${buildFocusAttr('output', includeFocusAttributes)}>
          <table class="research-word-table research-word-output-table">
            <tbody>
              <tr>
                <th class="research-word-section-row-title">四、整体痛点难点描述</th>
              </tr>
              <tr>
                <td class="research-word-section-row-value">
                  <div class="research-word-line-stack">
                    ${renderNumberedLinesHtml(draft.overallPainPoints, draft.lineColors.overallPainPoints)}
                  </div>
                </td>
              </tr>
              <tr>
                <th class="research-word-section-row-title">五、业务专项事项讨论</th>
              </tr>
              <tr>
                <td class="research-word-section-row-value">
                  <div class="research-word-line-stack">
                    ${renderNumberedLinesHtml(draft.specialDiscussion, draft.lineColors.specialDiscussion)}
                  </div>
                </td>
              </tr>
              <tr>
                <th class="research-word-section-row-title research-word-section-row-title-strong">六、其他补充</th>
              </tr>
              <tr>
                <td class="research-word-section-row-value">
                  <div class="research-word-line-stack">
                    ${renderNumberedLinesHtml(draft.extraNotes, draft.lineColors.extraNotes)}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="research-word-signature">
            <div class="research-word-signature-item">
              <span class="research-word-signature-label">受访人（签字确认）：</span>
              <span class="research-word-signature-fill">${renderValue(draft.signer, EMPTY_CELL)}</span>
            </div>
            <div class="research-word-signature-date">${renderValue(formatChineseDate(draft.signerDate), EMPTY_CELL)}</div>
          </div>
        </section>
      </div>
    </div>
  `;
}

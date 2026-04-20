import JSZip from 'jszip';
import {
  type ResearchLineColorMap,
  type ResearchLineColorTone,
} from './research-record-multiline';
import {
  buildNumberedLineEntries,
  buildPlainLineEntries,
  buildResearchRecordWordPageHtml,
  buildWorkDescriptionLineEntries,
  type ResearchWordLineEntry,
} from './research-record-word-template-shared';

type ResearchExportDraft = Parameters<typeof buildResearchRecordWordPageHtml>[0];
type ResearchExportContentItem = ResearchExportDraft['contentItems'][number];

const WORD_DOCUMENT_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const EXPORT_TEMPLATE_URL = '/research-record-export-template.docx';
const WORD_NAMESPACE = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace';
const ELEMENT_NODE = 1;
const EMPHASIS_TEXT_COLOR = '8F1D2C';
const BODY_TEXT_TYPOGRAPHY = {
  ascii: 'Times',
  cs: '仿宋',
  eastAsia: '仿宋',
  hAnsi: 'Times',
  size: '21',
};

type RunTypography = typeof BODY_TEXT_TYPOGRAPHY;
type ParagraphLineSpec = {
  color?: ResearchLineColorTone;
  text: string;
};

function getElementChildren(parent: Element, localName: string) {
  return Array.from(parent.childNodes).filter(
    (node): node is Element => node.nodeType === ELEMENT_NODE && (node as Element).localName === localName,
  );
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
    return '全员☑ 部门□ 单独□';
  }
  if (value === '单独') {
    return '全员□ 部门□ 单独☑';
  }
  return '全员□ 部门☑ 单独□';
}

function getContentItemDisplayName(item: ResearchExportContentItem, index: number) {
  return item.businessTheme.trim() || item.sceneName.trim() || `调研明细 ${index + 1}`;
}

function getContentItemSubheading(item: ResearchExportContentItem) {
  const sceneName = item.sceneName.trim();
  const businessTheme = item.businessTheme.trim();
  if (!sceneName || !businessTheme || sceneName === businessTheme || businessTheme.includes(sceneName)) {
    return '';
  }
  return sceneName;
}

function buildInlinePlainLines(value: string, lineColors: ResearchLineColorMap = {}) {
  return buildPlainLineEntries(value, lineColors)
    .map((line) => line.text.trim())
    .filter(Boolean);
}

function toParagraphLineSpecs(lines: ResearchWordLineEntry[]) {
  return lines.map((line) => ({
    color: line.color,
    text: line.text,
  }));
}

async function getXmlImplementation() {
  if (typeof DOMParser !== 'undefined' && typeof XMLSerializer !== 'undefined') {
    return { DOMParser, XMLSerializer };
  }

  return import('@xmldom/xmldom');
}

function cloneElement<T extends Element>(element: T) {
  return element.cloneNode(true) as T;
}

function applyRunTypography(runProps: Element, typography: RunTypography) {
  const document = runProps.ownerDocument;
  const rFonts = getElementChildren(runProps, 'rFonts')[0]
    ?? document.createElementNS(WORD_NAMESPACE, 'w:rFonts');

  rFonts.setAttributeNS(WORD_NAMESPACE, 'w:ascii', typography.ascii);
  rFonts.setAttributeNS(WORD_NAMESPACE, 'w:hAnsi', typography.hAnsi);
  rFonts.setAttributeNS(WORD_NAMESPACE, 'w:eastAsia', typography.eastAsia);
  rFonts.setAttributeNS(WORD_NAMESPACE, 'w:cs', typography.cs);
  if (!rFonts.parentNode) {
    runProps.appendChild(rFonts);
  }

  const size = getElementChildren(runProps, 'sz')[0]
    ?? document.createElementNS(WORD_NAMESPACE, 'w:sz');
  size.setAttributeNS(WORD_NAMESPACE, 'w:val', typography.size);
  if (!size.parentNode) {
    runProps.appendChild(size);
  }

  const sizeCs = getElementChildren(runProps, 'szCs')[0]
    ?? document.createElementNS(WORD_NAMESPACE, 'w:szCs');
  sizeCs.setAttributeNS(WORD_NAMESPACE, 'w:val', typography.size);
  if (!sizeCs.parentNode) {
    runProps.appendChild(sizeCs);
  }
}

function applyRunColor(runProps: Element, color: ResearchLineColorTone) {
  const document = runProps.ownerDocument;
  const colorNode = getElementChildren(runProps, 'color')[0]
    ?? document.createElementNS(WORD_NAMESPACE, 'w:color');

  if (color === 'red') {
    colorNode.setAttributeNS(WORD_NAMESPACE, 'w:val', EMPHASIS_TEXT_COLOR);
    if (!colorNode.parentNode) {
      runProps.appendChild(colorNode);
    }
    return;
  }

  if (colorNode.parentNode) {
    colorNode.parentNode.removeChild(colorNode);
  }
}

function setParagraphText(paragraph: Element, content: string | ParagraphLineSpec, typography?: RunTypography) {
  const paragraphProperties = getElementChildren(paragraph, 'pPr')[0] ?? null;
  const sourceRun = paragraph.getElementsByTagNameNS(WORD_NAMESPACE, 'r')[0];
  const sourceRunProps = sourceRun ? getElementChildren(sourceRun, 'rPr')[0] ?? null : null;
  const text = typeof content === 'string' ? content : content.text;
  const lineColor = typeof content === 'string' ? 'default' : (content.color ?? 'default');

  while (paragraph.firstChild) {
    paragraph.removeChild(paragraph.firstChild);
  }

  if (paragraphProperties) {
    const nextParagraphProperties = cloneElement(paragraphProperties);
    const numbering = getElementChildren(nextParagraphProperties, 'numPr')[0];
    if (numbering) {
      nextParagraphProperties.removeChild(numbering);
    }
    paragraph.appendChild(nextParagraphProperties);
  }

  const run = paragraph.ownerDocument.createElementNS(WORD_NAMESPACE, 'w:r');
  if (sourceRunProps || typography || lineColor !== 'default') {
    const runProps = sourceRunProps
      ? cloneElement(sourceRunProps)
      : paragraph.ownerDocument.createElementNS(WORD_NAMESPACE, 'w:rPr');
    if (typography) {
      applyRunTypography(runProps, typography);
    }
    applyRunColor(runProps, lineColor);
    run.appendChild(runProps);
  }

  const textNode = paragraph.ownerDocument.createElementNS(WORD_NAMESPACE, 'w:t');
  if (/^\s|\s$/.test(text)) {
    textNode.setAttributeNS(XML_NAMESPACE, 'xml:space', 'preserve');
  }
  textNode.textContent = text;
  run.appendChild(textNode);
  paragraph.appendChild(run);
  return paragraph;
}

function setCellParagraphs(cell: Element, lines: Array<string | ParagraphLineSpec>, typography?: RunTypography) {
  const cellProperties = getElementChildren(cell, 'tcPr')[0] ?? null;
  const paragraphPrototypes = getElementChildren(cell, 'p');
  const fallbackPrototype = paragraphPrototypes[paragraphPrototypes.length - 1]
    ?? cell.ownerDocument.createElementNS(WORD_NAMESPACE, 'w:p');
  const nextLines = lines.length > 0 ? lines : [''];
  const lineCount = Math.max(nextLines.length, paragraphPrototypes.length || 1);

  while (cell.firstChild) {
    cell.removeChild(cell.firstChild);
  }

  if (cellProperties) {
    cell.appendChild(cellProperties);
  }

  Array.from({ length: lineCount }).forEach((_, index) => {
    const line = nextLines[index] ?? '';
    const prototype = paragraphPrototypes[index] ?? fallbackPrototype;
    cell.appendChild(setParagraphText(cloneElement(prototype), line, typography));
  });
}

function setCellText(cell: Element, text: string, typography?: RunTypography) {
  setCellParagraphs(cell, [text], typography);
}

function setCellVerticalMerge(cell: Element, mode: 'restart' | 'continue' | null) {
  let cellProperties = getElementChildren(cell, 'tcPr')[0] ?? null;
  if (!cellProperties) {
    cellProperties = cell.ownerDocument.createElementNS(WORD_NAMESPACE, 'w:tcPr');
    cell.insertBefore(cellProperties, cell.firstChild ?? null);
  }

  const currentMerge = getElementChildren(cellProperties, 'vMerge')[0] ?? null;
  if (!mode) {
    if (currentMerge) {
      cellProperties.removeChild(currentMerge);
    }
    return;
  }

  const nextMerge = currentMerge ?? cell.ownerDocument.createElementNS(WORD_NAMESPACE, 'w:vMerge');
  nextMerge.setAttributeNS(WORD_NAMESPACE, 'w:val', mode);
  if (!currentMerge) {
    cellProperties.appendChild(nextMerge);
  }
}

function updateScopeCellDisplay(cell: Element, scope: string) {
  const paragraph = getElementChildren(cell, 'p')[0];
  if (!paragraph) return;

  const runs = paragraph.getElementsByTagNameNS(WORD_NAMESPACE, 'r');
  if (runs.length < 3) {
    setCellText(cell, formatScopeDisplay(scope));
    return;
  }

  const getTextNode = (run: Element) => run.getElementsByTagNameNS(WORD_NAMESPACE, 't')[0];
  const t0 = getTextNode(runs[0] as Element);
  const t2 = getTextNode(runs[2] as Element);
  if (!t0 || !t2) {
    setCellText(cell, formatScopeDisplay(scope));
    return;
  }

  if (scope === '全员') {
    t0.textContent = '全员';
    t2.textContent = ' 部门□ 单独□';
  } else if (scope === '单独') {
    t0.textContent = '全员□ 部门□ 单独';
    t2.textContent = '';
  } else {
    t0.textContent = '全员□ 部门';
    t2.textContent = ' 单独□';
  }

  if (/^\s|\s$/.test(t2.textContent || '')) {
    t2.setAttributeNS(XML_NAMESPACE, 'xml:space', 'preserve');
  }
}

function getBody(xmlDocument: XMLDocument) {
  const body = xmlDocument.getElementsByTagNameNS(WORD_NAMESPACE, 'body')[0];
  if (!body) {
    throw new Error('Word 模板缺少文档主体');
  }
  return body;
}

function getDirectBodyParagraphs(body: Element) {
  return getElementChildren(body, 'p');
}

function getDirectBodyTables(body: Element) {
  return getElementChildren(body, 'tbl');
}

function getRows(table: Element) {
  return getElementChildren(table, 'tr');
}

function getCells(row: Element) {
  return getElementChildren(row, 'tc');
}

function buildContentRows(rowPrototypes: Element[], item: ResearchExportContentItem, index: number) {
  const displayName = getContentItemDisplayName(item, index);
  const subheading = getContentItemSubheading(item);
  const formsLines = toParagraphLineSpecs(buildNumberedLineEntries(item.formsProvided, item.lineColors.formsProvided));
  const workDescriptionLines = toParagraphLineSpecs(buildWorkDescriptionLineEntries({
    fallbackModuleName: item.businessTheme,
    lineColors: item.lineColors.workDescription,
    linkedModuleName: item.linkedModuleName,
    value: item.workDescription,
  }));
  const painLines = toParagraphLineSpecs(buildNumberedLineEntries(item.painPoints, item.lineColors.painPoints));
  const suggestionLines = toParagraphLineSpecs(buildNumberedLineEntries(item.suggestions, item.lineColors.suggestions));

  const [
    jobRoleRowPrototype,
    listRowPrototype,
    textRowPrototype,
    suggestionRowPrototype,
  ] = rowPrototypes;

  const jobRoleRow = cloneElement(jobRoleRowPrototype);
  const jobRoleCells = getCells(jobRoleRow);
  setCellVerticalMerge(jobRoleCells[0], 'restart');
  setCellParagraphs(jobRoleCells[0], [displayName, subheading], BODY_TEXT_TYPOGRAPHY);
  setCellParagraphs(jobRoleCells[1], [`工作岗位：${item.jobRole.trim()}`, `工时占比：${item.timeShare.trim()}`], BODY_TEXT_TYPOGRAPHY);

  const formsRow = cloneElement(listRowPrototype);
  const formsCells = getCells(formsRow);
  setCellVerticalMerge(formsCells[0], 'continue');
  setCellText(formsCells[0], '', BODY_TEXT_TYPOGRAPHY);
  setCellParagraphs(formsCells[1], ['表单提供：', ...formsLines], BODY_TEXT_TYPOGRAPHY);

  const workDescriptionRow = cloneElement(textRowPrototype);
  const workDescriptionCells = getCells(workDescriptionRow);
  setCellVerticalMerge(workDescriptionCells[0], 'continue');
  setCellText(workDescriptionCells[0], '', BODY_TEXT_TYPOGRAPHY);
  setCellParagraphs(workDescriptionCells[1], ['工作描述：', ...workDescriptionLines, '痛点说明：', ...painLines], BODY_TEXT_TYPOGRAPHY);

  const suggestionRow = cloneElement(suggestionRowPrototype);
  const suggestionCells = getCells(suggestionRow);
  setCellVerticalMerge(suggestionCells[0], 'continue');
  setCellText(suggestionCells[0], '', BODY_TEXT_TYPOGRAPHY);
  setCellParagraphs(suggestionCells[1], ['朗速建议：', ...suggestionLines], BODY_TEXT_TYPOGRAPHY);

  return [jobRoleRow, formsRow, workDescriptionRow, suggestionRow];
}

async function rebuildTemplateXml(templateXml: string, draft: ResearchExportDraft) {
  const { DOMParser, XMLSerializer } = await getXmlImplementation();
  const xmlDocument = new DOMParser().parseFromString(templateXml, 'application/xml');
  if (xmlDocument.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Word 模板解析失败');
  }

  const body = getBody(xmlDocument);
  const paragraphs = getDirectBodyParagraphs(body);
  const tables = getDirectBodyTables(body);
  if (paragraphs.length < 2 || tables.length < 2) {
    throw new Error('Word 模板结构不符合预期');
  }

  setParagraphText(paragraphs[0], draft.companyName.trim() || '东方水利智能科技股份有限公司');
  setParagraphText(paragraphs[1], `${draft.projectName.trim() || '数字一体化平台项目'}-调研访谈记录`);

  const overviewRows = getRows(tables[0]);
  const overviewRow0Cells = getCells(overviewRows[0]);
  const overviewRow1Cells = getCells(overviewRows[1]);
  const overviewRow2Cells = getCells(overviewRows[2]);

  setCellText(overviewRow0Cells[1], formatChineseDate(draft.surveyDate));
  setCellText(overviewRow0Cells[3], draft.surveyLocation.trim());
  setCellText(overviewRow0Cells[5], draft.documentNo.trim());

  setCellText(overviewRow1Cells[1], draft.departmentName.trim());
  updateScopeCellDisplay(overviewRow1Cells[3], draft.surveyScope);
  setCellText(overviewRow1Cells[5], draft.surveyCount.trim());

  setCellText(overviewRow2Cells[1], toDelimitedParts(draft.respondents, /[、,，\n]+/).join('、'));
  setCellText(overviewRow2Cells[3], toDelimitedParts(draft.engineers, /[、,，\n]+/).join('、'));

  const contentTable = tables[1];
  const rowPrototypes = getRows(contentTable);
  const contentBlockPrototypes = rowPrototypes.slice(5, 9).map((row) => cloneElement(row));
  const staticRowPrefix = rowPrototypes.slice(0, 5).map((row) => cloneElement(row));
  const staticRowSuffix = rowPrototypes.slice(10).map((row) => cloneElement(row));

  const departmentPostLines = toParagraphLineSpecs(buildNumberedLineEntries(draft.departmentPosts, draft.lineColors.departmentPosts));
  const workToolLines = buildInlinePlainLines(draft.workTools, draft.lineColors.workTools);

  setCellParagraphs(getCells(staticRowPrefix[1])[0], departmentPostLines, BODY_TEXT_TYPOGRAPHY);
  setCellText(getCells(staticRowPrefix[3])[0], workToolLines.join('、'), BODY_TEXT_TYPOGRAPHY);

  const tblPr = getElementChildren(contentTable, 'tblPr')[0] ?? null;
  const tblGrid = getElementChildren(contentTable, 'tblGrid')[0] ?? null;

  while (contentTable.firstChild) {
    contentTable.removeChild(contentTable.firstChild);
  }

  if (tblPr) contentTable.appendChild(tblPr);
  if (tblGrid) contentTable.appendChild(tblGrid);

  staticRowPrefix.forEach((row) => contentTable.appendChild(row));

  const contentItems = draft.contentItems.length > 0
    ? draft.contentItems
    : [{
      businessTheme: '暂无明细',
      formsProvided: '',
      id: 'empty-content-item',
      jobRole: '',
      lineColors: {},
      linkedModuleName: '',
      linkedModuleTable: '',
      painPoints: '',
      sceneName: '',
      suggestions: '',
      timeShare: '',
      workDescription: '',
    }];

  contentItems.forEach((item, index) => {
    buildContentRows(contentBlockPrototypes, item, index).forEach((row) => contentTable.appendChild(row));
  });

  const outputRows = staticRowSuffix;
  setCellParagraphs(getCells(outputRows[1])[0], toParagraphLineSpecs(buildNumberedLineEntries(draft.overallPainPoints, draft.lineColors.overallPainPoints)), BODY_TEXT_TYPOGRAPHY);
  setCellParagraphs(getCells(outputRows[3])[0], toParagraphLineSpecs(buildNumberedLineEntries(draft.specialDiscussion, draft.lineColors.specialDiscussion)), BODY_TEXT_TYPOGRAPHY);
  setCellParagraphs(getCells(outputRows[5])[0], toParagraphLineSpecs(buildNumberedLineEntries(draft.extraNotes, draft.lineColors.extraNotes)), BODY_TEXT_TYPOGRAPHY);
  setCellText(getCells(outputRows[6])[1], draft.signer.trim(), BODY_TEXT_TYPOGRAPHY);
  setCellText(getCells(outputRows[7])[0], formatChineseDate(draft.signerDate), BODY_TEXT_TYPOGRAPHY);

  outputRows.forEach((row) => contentTable.appendChild(row));

  return new XMLSerializer().serializeToString(xmlDocument);
}

async function loadTemplateZip() {
  const response = await fetch(EXPORT_TEMPLATE_URL, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Word 模板加载失败：${response.status}`);
  }

  return JSZip.loadAsync(await response.arrayBuffer());
}

export async function buildResearchRecordWordDocumentBlob(draft: ResearchExportDraft) {
  const zip = await loadTemplateZip();
  const documentEntry = zip.file('word/document.xml');
  if (!documentEntry) {
    throw new Error('Word 模板缺少 document.xml');
  }

  zip.file('word/document.xml', await rebuildTemplateXml(await documentEntry.async('string'), draft));
  return zip.generateAsync({ mimeType: WORD_DOCUMENT_MIME, type: 'blob' });
}

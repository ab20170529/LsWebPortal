import { apiRequest } from './http';

export type SurveyPlan = {
  summary: string;
  complexity: string;
  duration: string;
  domainModel: string[];
  architecture: string[];
  recommendations: string[];
  raw: string;
};

type SurveyPlanResponse = {
  model: string;
  plan: SurveyPlan;
};

export type SqlDraft = {
  mainSql: string;
  defaultQuery: string;
  raw: string;
};

type SqlDraftResponse = {
  model: string;
  draft: SqlDraft;
};

type IdentifierTranslationResponse = {
  model: string;
  items: Array<{
    id: string;
    identifier: string;
  }>;
};

type ColumnPayload = {
  id: string;
  name: string;
  type?: string;
  identifier?: string;
};

export type AiCreateMainTableColumn = {
  id: string;
  identifier: string;
  name: string;
  source: 'existing' | 'ai' | 'heuristic';
  translated: boolean;
  type?: string;
};

export type AiCreateMainTablePersistence = {
  message?: string;
  requestBody?: Record<string, unknown>;
  responseBody?: unknown;
  status: 'failed' | 'pending' | 'saved' | 'skipped';
  target: string;
};

export type AiCreateMainTableResult = {
  createTableSql: string;
  defaultQuery: string;
  mainSql: string;
  persistence: AiCreateMainTablePersistence;
  raw: string;
  tableName: string;
  translatedColumns: AiCreateMainTableColumn[];
  translatedCount: number;
  untranslatedCount: number;
};

type AiCreateMainTableResponse = {
  degraded?: boolean;
  message?: string;
  model: string;
  result: AiCreateMainTableResult;
};

export async function requestSurveyPlan(mode: string, dataSource: string) {
  return apiRequest<SurveyPlanResponse>('/api/ai/survey-plan', {
    auth: true,
    body: {
      mode,
      dataSource,
    },
    method: 'POST',
  });
}

export async function requestSqlDraft(input: {
  title: string;
  description: string;
  tableType: string;
  columns: ColumnPayload[];
}) {
  return apiRequest<SqlDraftResponse>('/api/ai/sql-draft', {
    auth: true,
    body: input,
    method: 'POST',
  });
}

export async function requestIdentifierTranslation(columns: ColumnPayload[]) {
  return apiRequest<IdentifierTranslationResponse>('/api/ai/translate-identifiers', {
    auth: true,
    body: { columns },
    method: 'POST',
  });
}

export async function requestAiCreateMainTable(input: {
  columns: ColumnPayload[];
  description: string;
  moduleCode: string;
  moduleName: string;
  persist?: boolean;
  tableName: string;
  tableType: string;
}) {
  return apiRequest<AiCreateMainTableResponse>('/api/ai/create-main-table', {
    auth: true,
    body: input,
    method: 'POST',
  });
}

import { useMemo, type Dispatch, type SetStateAction } from 'react';
import {
  getGridOperationDefinition,
  getGridOperationEnabled,
  isGridOperationActionKey,
} from './grid-operation-config';

type UseSelectedColumnContextOptions = {
  activeTab: string;
  billDetailColumns: any[];
  billDetailConfig: Record<string, any>;
  billMetaFields: any[];
  billSourceDraft: Record<string, any>;
  billSources: any[];
  businessType: string;
  buildDetailTabConfig: (overrides?: Record<string, any>) => Record<string, any>;
  buildGridConfig: (mainSql: string, defaultQuery: string, overrides?: Record<string, any>) => Record<string, any>;
  detailFillTypeOptions: Array<{ value: string }>;
  detailFilterFields: Record<string, any[]>;
  detailTabConfigs: Record<string, any>;
  detailTableColumns: Record<string, any[]>;
  detailTableConfigs: Record<string, any>;
  detailTabs: Array<{ id: string; name: string }>;
  getDetailFillTypeByTabId: (tabId: string) => string;
  getDetailFillTypeMeta: (fillType?: string) => { icon: string };
  getSelectedConditionPanelContext: (scope: 'left' | 'main' | null) => any | null;
  inspectorTarget: { id?: string | null; kind: string };
  leftFilterFields: any[];
  leftTableColumns: any[];
  leftTableConfig: Record<string, any>;
  mainFilterFields: any[];
  mainTableColumns: any[];
  mainTableConfig: Record<string, any>;
  setBillDetailColumns: Dispatch<SetStateAction<any[]>>;
  setBillDetailConfig: Dispatch<SetStateAction<Record<string, any>>>;
  setBillMetaFields: Dispatch<SetStateAction<any[]>>;
  setBillSourceDraft: Dispatch<SetStateAction<Record<string, any>>>;
  setDetailFilterFields: Dispatch<SetStateAction<Record<string, any[]>>>;
  setDetailTabConfigs: Dispatch<SetStateAction<Record<string, any>>>;
  setDetailTableColumns: Dispatch<SetStateAction<Record<string, any[]>>>;
  setDetailTableConfigs: Dispatch<SetStateAction<Record<string, any>>>;
  setLeftFilterFields: Dispatch<SetStateAction<any[]>>;
  setLeftTableColumns: Dispatch<SetStateAction<any[]>>;
  setLeftTableConfig: Dispatch<SetStateAction<Record<string, any>>>;
  setMainFilterFields: Dispatch<SetStateAction<any[]>>;
  setMainTableColumns: Dispatch<SetStateAction<any[]>>;
  setMainTableConfig: Dispatch<SetStateAction<Record<string, any>>>;
  workspaceTheme: string;
};

export function useSelectedColumnContext({
  activeTab,
  billDetailColumns,
  billDetailConfig,
  billMetaFields,
  billSourceDraft,
  billSources,
  businessType,
  buildDetailTabConfig,
  buildGridConfig,
  detailFillTypeOptions,
  detailFilterFields,
  detailTabConfigs,
  detailTableColumns,
  detailTableConfigs,
  detailTabs,
  getDetailFillTypeByTabId,
  getDetailFillTypeMeta,
  getSelectedConditionPanelContext,
  inspectorTarget,
  leftFilterFields,
  leftTableColumns,
  leftTableConfig,
  mainFilterFields,
  mainTableColumns,
  mainTableConfig,
  setBillDetailColumns,
  setBillDetailConfig,
  setBillMetaFields,
  setBillSourceDraft,
  setDetailFilterFields,
  setDetailTabConfigs,
  setDetailTableColumns,
  setDetailTableConfigs,
  setLeftFilterFields,
  setLeftTableColumns,
  setLeftTableConfig,
  setMainFilterFields,
  setMainTableColumns,
  setMainTableConfig,
  workspaceTheme,
}: UseSelectedColumnContextOptions) {
  return useMemo(() => {
    const panelTabId = activeTab;
    const hasDetailTabContext = businessType === 'table' || Boolean(panelTabId);
    const activeDetailTabName = detailTabs.find((tab) => tab.id === panelTabId)?.name || '当前明细';
    const selectedDetailInspectorFillType = inspectorTarget.kind === 'detail-grid'
      && detailFillTypeOptions.some((option) => option.value === inspectorTarget.id)
      ? inspectorTarget.id
      : getDetailFillTypeByTabId(panelTabId);
    const selectedDetailInspectorMeta = getDetailFillTypeMeta(selectedDetailInspectorFillType);
    const selectedLeftColId = inspectorTarget.kind === 'left-col' ? inspectorTarget.id ?? null : null;
    const selectedLeftFilterId = inspectorTarget.kind === 'left-filter' ? inspectorTarget.id ?? null : null;
    const selectedMainColId = inspectorTarget.kind === 'main-col' ? inspectorTarget.id ?? null : null;
    const selectedDetailColId = inspectorTarget.kind === 'detail-col' ? inspectorTarget.id ?? null : null;
    const selectedMainFilterId = inspectorTarget.kind === 'main-filter' ? inspectorTarget.id ?? null : null;
    const selectedDetailFilterId = inspectorTarget.kind === 'detail-filter' ? inspectorTarget.id ?? null : null;
    const selectedDetailTabId = inspectorTarget.kind === 'detail-tab' ? inspectorTarget.id ?? null : null;
    const selectedMainGridActionId = inspectorTarget.kind === 'main-grid-action' ? inspectorTarget.id ?? null : null;
    const selectedDetailGridActionId = inspectorTarget.kind === 'detail-grid-action' ? inspectorTarget.id ?? null : null;
    const selectedConditionPanelScope = inspectorTarget.kind === 'left-filter-panel'
      ? 'left'
      : inspectorTarget.kind === 'main-filter-panel'
        ? 'main'
        : null;
    const selectedTableConfigScope = inspectorTarget.kind === 'left-grid'
      ? 'left'
      : inspectorTarget.kind === 'main-grid'
        ? 'main'
        : inspectorTarget.kind === 'detail-grid'
          ? 'detail'
          : null;
    const selectedContextMenuScope = inspectorTarget.kind === 'main-context' ? 'main' : inspectorTarget.kind === 'detail-context' ? 'detail' : null;
    const makeDetailSetter = (updater: SetStateAction<any[]>) => {
      setDetailTableColumns((prev) => ({
        ...prev,
        [panelTabId]: typeof updater === 'function' ? updater(prev[panelTabId] || []) : updater,
      }));
    };
    const buildGridActionContext = (
      scope: 'main-grid-action' | 'detail-grid-action',
      actionKey: string | null,
      title: string,
      description: string,
      iconClass: string,
      config: Record<string, any>,
      setCols: Dispatch<SetStateAction<any>>,
    ) => {
      if (!isGridOperationActionKey(actionKey)) {
        return null;
      }

      const definition = getGridOperationDefinition(actionKey);

      return {
        kind: 'grid-action' as const,
        scope,
        title,
        description,
        icon: definition.icon,
        iconClass,
        actionEnabled: getGridOperationEnabled(config, actionKey),
        actionKey,
        actionLabel: definition.label,
        column: config,
        fieldKey: definition.fieldKey ?? null,
        locked: definition.locked ?? false,
        setCols,
        removeLabel: '',
      };
    };

    if (selectedMainFilterId) {
      const condition = mainFilterFields.find((item) => item.id === selectedMainFilterId);
      return condition
        ? {
            kind: 'condition' as const,
            scope: 'filter' as const,
            title: '查询条件',
            description: '控制顶部条件区的控件名称、类型、默认值和查询联动逻辑。',
            icon: 'filter_alt',
            iconClass: 'bg-amber-500/12 text-amber-500',
            column: condition,
            setCols: setMainFilterFields,
            removeLabel: '删除条件',
          }
        : null;
    }

    if (selectedLeftFilterId) {
      const condition = leftFilterFields.find((item) => item.id === selectedLeftFilterId);
      return condition
        ? {
            kind: 'condition' as const,
            scope: 'left-filter' as const,
            title: '左侧条件',
            description: '控制左侧树表顶部条件区，配置会写入左边条件表并关联到所属树形字段。',
            icon: 'filter_alt',
            iconClass: 'bg-indigo-500/12 text-indigo-500',
            column: condition,
            setCols: setLeftFilterFields,
            removeLabel: '删除条件',
          }
        : null;
    }

    if (selectedDetailFilterId && hasDetailTabContext) {
      const condition = (detailFilterFields[panelTabId] || []).find((item) => item.id === selectedDetailFilterId);
      return condition
        ? {
            kind: 'condition' as const,
            scope: 'detail-filter' as const,
            title: `明细条件 · ${activeDetailTabName}`,
            description: '控制当前明细页签的查询条件、默认值和联动逻辑。',
            icon: 'filter_alt',
            iconClass: 'bg-orange-500/12 text-orange-500',
            column: condition,
            setCols: (updater: SetStateAction<any[]>) => {
              setDetailFilterFields((prev) => ({
                ...prev,
                [panelTabId]: typeof updater === 'function' ? updater(prev[panelTabId] || []) : updater,
              }));
            },
            removeLabel: '删除条件',
          }
        : null;
    }

    if (selectedDetailTabId && hasDetailTabContext) {
      return {
        kind: 'detail-tab' as const,
        scope: 'detail-tab' as const,
        title: `明细模块 · ${activeDetailTabName}`,
        description: '',
        icon: 'tabs',
        iconClass: 'bg-sky-500/12 text-sky-500',
        column: detailTabConfigs[panelTabId] ?? buildDetailTabConfig({
          tabKey: panelTabId,
          detailName: activeDetailTabName,
        }),
        setCols: (updater: SetStateAction<any>) => {
          setDetailTabConfigs((prev) => ({
            ...prev,
            [panelTabId]: typeof updater === 'function'
              ? updater(prev[panelTabId] ?? buildDetailTabConfig({
                tabKey: panelTabId,
                detailName: activeDetailTabName,
              }))
              : updater,
          }));
        },
        removeLabel: '',
      };
    }

    const conditionPanelContext = getSelectedConditionPanelContext(selectedConditionPanelScope);
    if (conditionPanelContext) {
      return conditionPanelContext;
    }

    if (selectedContextMenuScope === 'main') {
      return {
        kind: 'contextmenu' as const,
        scope: 'main-contextmenu' as const,
        title: '主表右键菜单',
        description: '控制主表预览区的右键菜单项，设置后可直接在表格中右击查看效果。',
        icon: 'right_click',
        iconClass: 'bg-cyan-500/12 text-cyan-500',
        column: mainTableConfig,
        setCols: setMainTableConfig,
        removeLabel: '',
      };
    }

    if (selectedContextMenuScope === 'detail' && hasDetailTabContext) {
      return {
        kind: 'contextmenu' as const,
        scope: 'detail-contextmenu' as const,
        title: `明细右键菜单 · ${activeDetailTabName}`,
        description: '控制当前明细表的右键菜单项与禁用条件，设置后可直接右击明细行预览。',
        icon: 'right_click',
        iconClass: 'bg-sky-500/12 text-sky-500',
        column: detailTableConfigs[panelTabId] ?? buildGridConfig('', ''),
        setCols: (updater: SetStateAction<any>) => {
          setDetailTableConfigs((prev) => ({
            ...prev,
            [panelTabId]: typeof updater === 'function' ? updater(prev[panelTabId] ?? buildGridConfig('', '')) : updater,
          }));
        },
        removeLabel: '',
      };
    }

    if (selectedMainGridActionId) {
      return buildGridActionContext(
        'main-grid-action',
        selectedMainGridActionId,
        '涓昏〃鎿嶄綔鎸夐挳',
        '閰嶇疆涓昏〃鍖哄煙鐨勫鍔犮€佸垹闄ゃ€佷慨鏀广€佷繚瀛樻寜閽€?',
        'bg-cyan-500/12 text-cyan-500',
        mainTableConfig,
        setMainTableConfig,
      );
    }

    if (selectedDetailGridActionId && hasDetailTabContext) {
      const detailGridConfig = detailTableConfigs[panelTabId] ?? buildGridConfig('', '');
      const relatedModuleCode = String(detailTabConfigs[panelTabId]?.relatedModule || '').trim();
      if (relatedModuleCode) {
        return buildGridActionContext(
          'detail-grid-action',
          selectedDetailGridActionId,
          `鏄庣粏鎿嶄綔鎸夐挳 路 ${activeDetailTabName}`,
          '閰嶇疆褰撳墠鏄庣粏鎵€缁ф壙妯″潡鐨勫鍔犮€佸垹闄ゃ€佷慨鏀广€佷繚瀛樻寜閽€?',
          'bg-sky-500/12 text-sky-500',
          detailGridConfig,
          (updater: SetStateAction<any>) => {
            setDetailTableConfigs((prev) => ({
              ...prev,
              [panelTabId]: typeof updater === 'function' ? updater(prev[panelTabId] ?? buildGridConfig('', '')) : updater,
            }));
          },
        );
      }
    }

    if (selectedMainGridActionId) {
      return {
        kind: 'grid-action' as const,
        scope: 'main-grid-action' as const,
        title: '主表操作按钮',
        description: '配置主表区域的增加、删除、修改、保存按钮。',
        icon: 'smart_button',
        iconClass: 'bg-cyan-500/12 text-cyan-500',
        actionKey: selectedMainGridActionId,
        column: mainTableConfig,
        setCols: setMainTableConfig,
        removeLabel: '',
      };
    }

    if (selectedDetailGridActionId && hasDetailTabContext) {
      const detailGridConfig = detailTableConfigs[panelTabId] ?? buildGridConfig('', '');
      const relatedModuleCode = String(detailTabConfigs[panelTabId]?.relatedModule || '').trim();
      if (relatedModuleCode) {
        return {
          kind: 'grid-action' as const,
          scope: 'detail-grid-action' as const,
          title: `明细操作按钮 · ${activeDetailTabName}`,
          description: '配置当前明细所继承模块的增加、删除、修改、保存按钮。',
          icon: 'smart_button',
          iconClass: 'bg-sky-500/12 text-sky-500',
          actionKey: selectedDetailGridActionId,
          column: detailGridConfig,
          setCols: (updater: SetStateAction<any>) => {
            setDetailTableConfigs((prev) => ({
              ...prev,
              [panelTabId]: typeof updater === 'function' ? updater(prev[panelTabId] ?? buildGridConfig('', '')) : updater,
            }));
          },
          removeLabel: '',
        };
      }
    }

    if (inspectorTarget.kind === 'workspace-theme') {
      return {
        kind: 'workspace-theme' as const,
        scope: 'workspace-theme' as const,
        title: '基础档案主题',
        description: '单独控制当前基础档案工作台的主题氛围，不跟表格配置混在一起。',
        icon: 'palette',
        iconClass: 'bg-fuchsia-500/12 text-fuchsia-500',
        column: { theme: workspaceTheme },
        setCols: () => undefined,
        removeLabel: '',
      };
    }

    if (inspectorTarget.kind === 'source-grid') {
      return {
        kind: 'source-grid' as const,
        scope: 'source-grid' as const,
        title: '来源表配置',
        description: '',
        icon: 'database',
        iconClass: 'bg-sky-500/12 text-sky-500',
        column: billSourceDraft,
        availableColumns: billSources,
        setCols: setBillSourceDraft,
        removeLabel: '',
      };
    }

    if (selectedTableConfigScope === 'left') {
      return {
        kind: 'grid' as const,
        scope: 'left-grid' as const,
        title: '左侧树表',
        description: '',
        icon: 'account_tree',
        iconClass: 'bg-indigo-500/12 text-indigo-500',
        column: leftTableConfig,
        availableColumns: leftTableColumns,
        setCols: setLeftTableConfig,
        removeLabel: '',
      };
    }

    if (selectedTableConfigScope === 'main') {
      return {
        kind: 'grid' as const,
        scope: 'main-grid' as const,
        title: businessType === 'table' ? '单据头部' : '主表配置',
        description: '',
        icon: businessType === 'table' ? 'dashboard' : 'table_view',
        iconClass: 'bg-cyan-500/12 text-cyan-500',
        column: mainTableConfig,
        availableColumns: businessType === 'table' ? [...billMetaFields, ...mainTableColumns] : mainTableColumns,
        setCols: setMainTableConfig,
        removeLabel: '',
      };
    }

    if (selectedTableConfigScope === 'detail' && hasDetailTabContext) {
      const detailGridLabel = selectedDetailInspectorFillType === '图表'
        ? '明细图表'
        : selectedDetailInspectorFillType === '网页'
          ? '明细网页'
          : selectedDetailInspectorFillType === '树表格'
            ? '明细树表'
            : '明细表格';
      if (businessType === 'table') {
        return {
          kind: 'grid' as const,
          scope: 'detail-grid' as const,
          title: '单据明细',
          description: '',
          icon: 'table_rows',
          iconClass: 'bg-sky-500/12 text-sky-500',
          column: billDetailConfig,
          availableColumns: billDetailColumns,
          setCols: setBillDetailConfig,
          removeLabel: '',
        };
      }

      return {
        kind: 'grid' as const,
        scope: 'detail-grid' as const,
        title: `${detailGridLabel} · ${activeDetailTabName}`,
        description: '',
        icon: selectedDetailInspectorMeta.icon,
        iconClass: 'bg-sky-500/12 text-sky-500',
        column: detailTableConfigs[panelTabId] ?? { mainSql: '', defaultQuery: '', sqlPrompt: '', tableType: '普通表格' },
        availableColumns: detailTableColumns[panelTabId] ?? [],
        setCols: (updater: SetStateAction<any>) => {
          setDetailTableConfigs((prev) => ({
            ...prev,
            [panelTabId]: typeof updater === 'function' ? updater(prev[panelTabId] ?? { mainSql: '', defaultQuery: '', sqlPrompt: '', tableType: '普通表格' }) : updater,
          }));
        },
        removeLabel: '',
      };
    }

    if (selectedLeftColId) {
      const column = leftTableColumns.find((item) => item.id === selectedLeftColId);
      return column
        ? {
            kind: 'column' as const,
            scope: 'left' as const,
            title: '左侧树节点',
            description: '控制树形节点关联列解析出的左侧节点字段名称与展示宽度。',
            icon: 'account_tree',
            iconClass: 'bg-indigo-500/12 text-indigo-500',
            column,
            setCols: setLeftTableColumns,
            removeLabel: '删除列',
          }
        : null;
    }

    if (selectedMainColId) {
      const column = mainTableColumns.find((item) => item.id === selectedMainColId)
        ?? billMetaFields.find((item) => item.id === selectedMainColId);
      return column
        ? {
            kind: 'column' as const,
            scope: 'main' as const,
            title: businessType === 'table' ? '单据头部控件' : '基础档案主表',
            description: '',
            icon: businessType === 'table' ? 'touch_app' : 'table_rows',
            iconClass: 'bg-emerald-500/12 text-emerald-500',
            column,
            setCols: mainTableColumns.some((item) => item.id === selectedMainColId) ? setMainTableColumns : setBillMetaFields,
            removeLabel: '删除列',
          }
        : null;
    }

    if (selectedDetailColId && hasDetailTabContext) {
      const detailCols = businessType === 'table' ? billDetailColumns : (detailTableColumns[panelTabId] || []);
      const column = detailCols.find((item) => item.id === selectedDetailColId);
      return column
        ? {
            kind: 'column' as const,
            scope: 'detail' as const,
            title: businessType === 'table' ? '单据明细列' : `明细页签 · ${activeDetailTabName}`,
            description: '',
            icon: 'receipt_long',
            iconClass: 'bg-blue-500/12 text-blue-500',
            column,
            setCols: businessType === 'table' ? setBillDetailColumns : makeDetailSetter,
            removeLabel: '删除列',
          }
        : null;
    }

    return null;
  }, [
    activeTab,
    billDetailColumns,
    billDetailConfig,
    billMetaFields,
    billSourceDraft,
    billSources,
    businessType,
    buildDetailTabConfig,
    buildGridConfig,
    detailFillTypeOptions,
    detailFilterFields,
    detailTabConfigs,
    detailTableColumns,
    detailTableConfigs,
    detailTabs,
    getDetailFillTypeByTabId,
    getDetailFillTypeMeta,
    getSelectedConditionPanelContext,
    inspectorTarget,
    leftFilterFields,
    leftTableColumns,
    leftTableConfig,
    mainFilterFields,
    mainTableColumns,
    mainTableConfig,
    setBillDetailColumns,
    setBillDetailConfig,
    setBillMetaFields,
    setBillSourceDraft,
    setDetailFilterFields,
    setDetailTabConfigs,
    setDetailTableColumns,
    setDetailTableConfigs,
    setLeftFilterFields,
    setLeftTableColumns,
    setLeftTableConfig,
    setMainFilterFields,
    setMainTableColumns,
    setMainTableConfig,
    workspaceTheme,
  ]);
}

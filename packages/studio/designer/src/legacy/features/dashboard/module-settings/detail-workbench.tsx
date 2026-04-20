import React, { useMemo } from 'react';
import { Button, Flex, Tag, Tabs } from 'antd';
import { getDetailFillTypeBadgeMeta } from './dashboard-detail-fill-utils';

const DETAIL_ADD_TAB_KEY = '__detail_add_tab__';

type DetailTab = {
  id: string;
  name: string;
};

type DetailTabStripProps = {
  detailTabs: DetailTab[];
  activeTab: string;
  currentDetailFillType: string;
  onActivateTab: (tabId: string) => void;
  onAddTab: () => void;
  addLabel?: string;
  addButtonPlacement?: 'inline-end' | 'centered' | 'tab-inline';
  compactAddButton?: boolean;
  flushEdges?: boolean;
  showModeBadge?: boolean;
};

type DocumentDetailWorkbenchProps = {
  footerNode?: React.ReactNode;
  detailTabs: DetailTab[];
  activeTab: string;
  currentDetailFillType: string;
  onActivateTab: (tabId: string) => void;
  onAddTab: () => void;
  onPasteTableColumns: React.ClipboardEventHandler<HTMLDivElement>;
  tableBuilderNode: React.ReactNode;
  fillPlaceholderNode: React.ReactNode;
};

export const MemoDetailTabStrip = React.memo(function DetailTabStrip({
  detailTabs,
  activeTab,
  currentDetailFillType,
  onActivateTab,
  onAddTab,
  addLabel,
  addButtonPlacement = 'inline-end',
  compactAddButton = false,
  flushEdges = false,
  showModeBadge = true,
}: DetailTabStripProps) {
  const activeTabMeta = getDetailFillTypeBadgeMeta(currentDetailFillType);
  const tabItems = useMemo<Array<{ key: string; label: React.ReactNode; children: null; className?: string }>>(() => {
    const baseItems: Array<{ key: string; label: React.ReactNode; children: null; className?: string }> = detailTabs.map((tab) => ({
      key: tab.id,
      label: tab.name,
      children: null as null,
    }));

    if (addButtonPlacement === 'tab-inline') {
      baseItems.push({
        key: DETAIL_ADD_TAB_KEY,
        label: (
          <span className="dashboard-module-ant-add-detail-tab-label" title={addLabel ?? '新增页签'}>
            <span className="material-symbols-outlined text-[16px]">add</span>
          </span>
        ),
        children: null,
        className: 'dashboard-module-ant-add-detail-tab',
      });
    }

    return baseItems;
  }, [addButtonPlacement, addLabel, detailTabs]);
  const addButtonClassName = compactAddButton
    ? '!h-7 !rounded-[10px] !px-3 !text-[12px]'
    : '!h-8 !rounded-full !px-3.5 !text-[12px]';
  const inlineExtraContent = addButtonPlacement === 'inline-end'
    ? {
        right: (
          <Flex align="center" gap={8}>
            {showModeBadge ? (
              <Tag
                icon={<span className="material-symbols-outlined text-[14px]">{activeTabMeta.icon}</span>}
                className="!me-0 !rounded-full !border-[#d9e7ff] !bg-[#f3f8ff] !px-2.5 !py-1 !text-[11px] !font-medium !text-[#2563eb]"
              >
                {activeTabMeta.label}
              </Tag>
            ) : null}
            <Button
              type="default"
              size="small"
              onClick={onAddTab}
              className={`dashboard-module-ant-add-detail-btn !font-semibold !shadow-none ${addButtonClassName}`}
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              {addLabel ?? '新增页签'}
            </Button>
          </Flex>
        ),
      }
    : showModeBadge
      ? {
          right: (
            <Tag
              icon={<span className="material-symbols-outlined text-[14px]">{activeTabMeta.icon}</span>}
              className="!me-0 !rounded-full !border-[#d9e7ff] !bg-[#f3f8ff] !px-2.5 !py-1 !text-[11px] !font-medium !text-[#2563eb]"
            >
              {activeTabMeta.label}
            </Tag>
          ),
        }
      : undefined;
  const handleTabChange = (tabId: string) => {
    if (tabId === DETAIL_ADD_TAB_KEY) {
      return;
    }
    onActivateTab(tabId);
  };
  const handleTabClick = (tabId: string) => {
    if (tabId === DETAIL_ADD_TAB_KEY) {
      onAddTab();
      return;
    }
    if (tabId === activeTab) {
      onActivateTab(tabId);
    }
  };

  return (
    <div className="min-w-0">
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        onTabClick={handleTabClick}
        destroyOnHidden
        items={tabItems}
        className={`dashboard-module-ant-tabs min-w-0 ${flushEdges ? 'dashboard-module-ant-tabs-flush' : ''}`}
        tabBarExtraContent={inlineExtraContent}
      />
      {addButtonPlacement === 'centered' ? (
        <div className="flex items-center justify-center pb-2 pt-1">
            <Button
              type="default"
              size="small"
              onClick={onAddTab}
              className={`dashboard-module-ant-add-detail-btn !font-semibold !shadow-none ${addButtonClassName}`}
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              {addLabel ?? '新增页签'}
            </Button>
        </div>
      ) : null}
    </div>
  );
});

export const MemoDocumentDetailWorkbench = React.memo(function DocumentDetailWorkbench({
  footerNode,
  detailTabs,
  activeTab,
  currentDetailFillType,
  onActivateTab,
  onAddTab,
  onPasteTableColumns,
  tableBuilderNode,
  fillPlaceholderNode,
}: DocumentDetailWorkbenchProps) {
  const activeDetailContentNode = currentDetailFillType === '表格' ? tableBuilderNode : fillPlaceholderNode;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[18px] border border-[#d6e2f1] bg-white shadow-none">
      <div className="overflow-hidden rounded-t-[18px] border-b border-[#dbe7f7] bg-[linear-gradient(180deg,#f8fbff_0%,#f1f7ff_100%)]">
        <div className="min-w-0 overflow-hidden">
          <MemoDetailTabStrip
            detailTabs={detailTabs}
            activeTab={activeTab}
            currentDetailFillType={currentDetailFillType}
            onActivateTab={onActivateTab}
            onAddTab={onAddTab}
            addLabel="新增明细"
            addButtonPlacement="tab-inline"
            compactAddButton
            flushEdges
            showModeBadge={false}
          />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-b-[18px] bg-white">
        {currentDetailFillType === '表格' ? (
          <div
            className="min-h-0 flex-1 overflow-hidden bg-white outline-none"
            tabIndex={0}
            onPaste={onPasteTableColumns}
          >
            {activeDetailContentNode}
          </div>
        ) : (
          <div className="min-h-0 flex-1 bg-white">
            {activeDetailContentNode}
          </div>
        )}
      </div>
      {footerNode ? footerNode : null}
    </div>
  );
});

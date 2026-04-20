import { buildDashboardWorkspaceBridgeNodes, type BuildDashboardWorkspaceBridgeNodesInput } from './dashboard-workspace-nodes';

type BuildDashboardWorkspaceBridgeBuilderInput = {
  archiveLayout: BuildDashboardWorkspaceBridgeNodesInput['archiveLayoutCanvasProps'];
  conditionWorkbench: Omit<
    BuildDashboardWorkspaceBridgeNodesInput['documentConditionToolbarProps'],
    'onClearBuilderSelectionContextMenu'
  >;
  contextMenus: {
    builderSelectionContextMenu: BuildDashboardWorkspaceBridgeNodesInput['builderSelectionContextMenu'];
    deleteSelectedColumns: (scope: 'left' | 'main' | 'detail', ids: string[]) => void;
    deleteSelectedConditions: (scope: 'left' | 'main' | 'detail', ids: string[]) => void;
    previewContextMenu: BuildDashboardWorkspaceBridgeNodesInput['previewContextMenu'];
    setBuilderSelectionContextMenu: (menu: any) => void;
    setPreviewContextMenu: (menu: any) => void;
    showToast: (message: string) => void;
  };
  longTextEditor: BuildDashboardWorkspaceBridgeNodesInput['longTextEditorModalProps'];
};

export function buildDashboardWorkspaceBridgeBuilder(
  input: BuildDashboardWorkspaceBridgeBuilderInput,
) {
  return buildDashboardWorkspaceBridgeNodes({
    archiveLayoutCanvasProps: input.archiveLayout,
    builderSelectionContextMenu: input.contextMenus.builderSelectionContextMenu,
    documentConditionToolbarProps: {
      ...input.conditionWorkbench,
      onClearBuilderSelectionContextMenu: () => input.contextMenus.setBuilderSelectionContextMenu(null),
    },
    longTextEditorModalProps: input.longTextEditor,
    onCloseBuilderSelectionContextMenu: () => input.contextMenus.setBuilderSelectionContextMenu(null),
    onClosePreviewContextMenu: () => input.contextMenus.setPreviewContextMenu(null),
    onDeleteBuilderSelection: () => {
      const menu = input.contextMenus.builderSelectionContextMenu;
      if (!menu) return;
      if (menu.kind === 'column') {
        input.contextMenus.deleteSelectedColumns(menu.scope, menu.ids);
        return;
      }
      input.contextMenus.deleteSelectedConditions(menu.scope, menu.ids);
    },
    onTriggerPreviewContextMenuItem: (item) => {
      input.contextMenus.showToast(`已触发右键动作：${item.label}`);
      input.contextMenus.setPreviewContextMenu(null);
    },
    previewContextMenu: input.contextMenus.previewContextMenu,
  });
}

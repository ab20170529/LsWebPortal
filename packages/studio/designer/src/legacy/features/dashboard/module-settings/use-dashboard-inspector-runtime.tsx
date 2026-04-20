import { InspectorPanelRouter } from './inspector-panel-router';
import {
  useDashboardInspectorPanelProps,
  type UseDashboardInspectorPanelPropsInput,
} from './use-dashboard-inspector-panel-props';
import { useSelectedColumnContext } from './use-selected-column-context';

export type UseDashboardInspectorRuntimeInput = {
  columnContextInput: Parameters<typeof useSelectedColumnContext>[0];
  inspectorPanelInput: Omit<UseDashboardInspectorPanelPropsInput, 'selectedColumnContext'>;
};

export function useDashboardInspectorRuntime({
  columnContextInput,
  inspectorPanelInput,
}: UseDashboardInspectorRuntimeInput) {
  const selectedColumnContext = useSelectedColumnContext(columnContextInput);
  const inspectorPanelProps = useDashboardInspectorPanelProps({
    ...inspectorPanelInput,
    selectedColumnContext,
  });

  return <InspectorPanelRouter {...inspectorPanelProps} />;
}

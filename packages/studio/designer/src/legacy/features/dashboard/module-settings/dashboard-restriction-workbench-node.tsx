import React, { type ReactNode } from 'react';

import { RestrictionWorkbench } from './restriction-workbench';
import {
  buildRestrictionWorkbenchProps,
  type BuildRestrictionWorkbenchPropsInput,
} from './restriction-workbench-props';

type DashboardRestrictionWorkbenchNodeInput = {
  builders: Pick<
    BuildRestrictionWorkbenchPropsInput,
    | 'buildRestrictionMeasure'
    | 'buildRestrictionNumberRule'
    | 'buildRestrictionProcessDesign'
    | 'buildRestrictionTopStructure'
  >;
  setters: Pick<
    BuildRestrictionWorkbenchPropsInput,
    | 'setRestrictionActiveTab'
    | 'setRestrictionMeasures'
    | 'setRestrictionNumberRules'
    | 'setRestrictionProcessDesigns'
    | 'setRestrictionSelection'
    | 'setRestrictionTopStructures'
  >;
  state: Pick<
    BuildRestrictionWorkbenchPropsInput,
    | 'currentModuleName'
    | 'restrictionActiveTab'
    | 'restrictionMeasures'
    | 'restrictionNumberRules'
    | 'restrictionProcessDesigns'
    | 'restrictionSelection'
    | 'restrictionTopStructures'
  >;
  ui: Pick<
    BuildRestrictionWorkbenchPropsInput,
    | 'onSaveRestrictionTab'
    | 'onOpenLongTextEditor'
    | 'showToast'
    | 'workspaceThemeTableSurfaceClass'
    | 'workspaceThemeVars'
  >;
};

export function buildDashboardRestrictionWorkbenchNode(
  input: DashboardRestrictionWorkbenchNodeInput,
): ReactNode {
  const restrictionWorkbenchProps = buildRestrictionWorkbenchProps({
    ...input.builders,
    ...input.setters,
    ...input.state,
    ...input.ui,
  });

  return <RestrictionWorkbench {...restrictionWorkbenchProps} />;
}

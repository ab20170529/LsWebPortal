import type { BuildDashboardConfigBridgeNodesInput } from './dashboard-config-bridge-nodes';

type BuildDashboardConfigBridgeRestrictionInput = {
  builders: BuildDashboardConfigBridgeNodesInput['restriction']['builders'];
  setters: BuildDashboardConfigBridgeNodesInput['restriction']['setters'];
  state: BuildDashboardConfigBridgeNodesInput['restriction']['state'];
  ui: BuildDashboardConfigBridgeNodesInput['restriction']['ui'];
};

export function buildDashboardConfigBridgeRestrictionInput(
  input: BuildDashboardConfigBridgeRestrictionInput,
): BuildDashboardConfigBridgeNodesInput['restriction'] {
  return {
    builders: input.builders,
    setters: input.setters,
    state: input.state,
    ui: input.ui,
  };
}

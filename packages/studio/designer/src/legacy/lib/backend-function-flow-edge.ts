import type { FunctionFlowEdgeDetail } from '../features/dashboard/function-flow-types';

export async function fetchFunctionFlowEdgeDetail(
  edgeId: string,
  targetCellId: string,
  graphJson: string
): Promise<FunctionFlowEdgeDetail> {
  const params = new URLSearchParams({
    edgeId,
    targetCellId,
    graphJson,
  });

  const res = await fetch(`/api/function-flow/edge/detail?${params}`);
  const json = await res.json();

  if (json.code !== 200) {
    throw new Error(json.message || '获取连线详情失败');
  }

  return json.data;
}
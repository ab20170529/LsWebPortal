import { useState, useCallback } from 'react';
import type { FunctionFlowEdgeDetail, FunctionFlowGraphJson, FunctionFlowEdgeConfig } from './function-flow-types';
import { fetchFunctionFlowEdgeDetail } from '../../lib/backend-function-flow-edge';

export function useEdgeDetail() {
  const [edgeDetails, setEdgeDetails] = useState<FunctionFlowEdgeDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEdgeDetails = useCallback(async (
    targetCellId: string,
    graphJson: FunctionFlowGraphJson
  ) => {
    setLoading(true);
    setError(null);

    try {
      // 获取所有连入该节点的连线
      const incomingEdges = graphJson.edges.filter(
        (e: FunctionFlowEdgeConfig) => e.targetCellId === targetCellId
      );

      // 获取每个连线的详情
      const details = await Promise.all(
        incomingEdges.map((edge: FunctionFlowEdgeConfig) =>
          fetchFunctionFlowEdgeDetail(edge.cellId, targetCellId, JSON.stringify(graphJson))
        )
      );

      setEdgeDetails(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const reorderEdges = useCallback((fromIndex: number, toIndex: number) => {
    setEdgeDetails(prev => {
      const updated = [...prev];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, removed);
      return updated;
    });
  }, []);

  return {
    edgeDetails,
    loading,
    error,
    loadEdgeDetails,
    reorderEdges,
  };
}
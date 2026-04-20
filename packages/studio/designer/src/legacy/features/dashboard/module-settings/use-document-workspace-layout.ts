import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type DocumentWorkspaceDragType = 'document-left-width' | 'document-detail-width';

type UseDocumentWorkspaceLayoutParams = {
  isConfigFullscreenActive: boolean;
};

export function useDocumentWorkspaceLayout({
  isConfigFullscreenActive,
}: UseDocumentWorkspaceLayoutParams) {
  const [documentLeftPaneWidth, setDocumentLeftPaneWidth] = useState(328);
  const [documentDetailPaneWidth, setDocumentDetailPaneWidth] = useState(436);
  const layoutDragRef = useRef<{
    type: DocumentWorkspaceDragType;
    startX: number;
    startY: number;
    startValue: number;
  } | null>(null);

  const inspectorPaneWidth = useMemo(
    () => (isConfigFullscreenActive ? 448 : Math.max(432, documentDetailPaneWidth)),
    [documentDetailPaneWidth, isConfigFullscreenActive],
  );

  const startDocumentWorkspaceDrag = useCallback((
    type: DocumentWorkspaceDragType,
    event: React.MouseEvent,
  ) => {
    event.preventDefault();
    layoutDragRef.current = {
      type,
      startX: event.clientX,
      startY: event.clientY,
      startValue: type === 'document-left-width' ? documentLeftPaneWidth : documentDetailPaneWidth,
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [documentDetailPaneWidth, documentLeftPaneWidth]);

  const startDocumentLeftResize = useCallback((
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    startDocumentWorkspaceDrag('document-left-width', event);
  }, [startDocumentWorkspaceDrag]);

  useEffect(() => {
    const handlePointerMove = (event: MouseEvent) => {
      if (!layoutDragRef.current) return;

      const drag = layoutDragRef.current;
      if (drag.type === 'document-left-width') {
        const delta = event.clientX - drag.startX;
        setDocumentLeftPaneWidth(Math.min(460, Math.max(280, drag.startValue + delta)));
      }

      if (drag.type === 'document-detail-width') {
        const delta = drag.startX - event.clientX;
        setDocumentDetailPaneWidth(Math.min(520, Math.max(360, drag.startValue + delta)));
      }
    };

    const stopDrag = () => {
      if (!layoutDragRef.current) return;
      layoutDragRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', stopDrag);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', stopDrag);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  return {
    documentLeftPaneWidth,
    inspectorPaneWidth,
    startDocumentLeftResize,
  };
}

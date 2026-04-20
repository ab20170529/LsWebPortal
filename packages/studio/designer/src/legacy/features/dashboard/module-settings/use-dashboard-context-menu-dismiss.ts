import { type Dispatch, type SetStateAction, useEffect } from 'react';

export function useDashboardContextMenuDismiss({
  setBuilderSelectionContextMenu,
  setPreviewContextMenu,
}: {
  setBuilderSelectionContextMenu: Dispatch<SetStateAction<any>>;
  setPreviewContextMenu: Dispatch<SetStateAction<any>>;
}) {
  useEffect(() => {
    const closeContextMenu = () => {
      setPreviewContextMenu(null);
      setBuilderSelectionContextMenu(null);
    };

    window.addEventListener('click', closeContextMenu);
    window.addEventListener('resize', closeContextMenu);
    window.addEventListener('scroll', closeContextMenu, true);

    return () => {
      window.removeEventListener('click', closeContextMenu);
      window.removeEventListener('resize', closeContextMenu);
      window.removeEventListener('scroll', closeContextMenu, true);
    };
  }, [setBuilderSelectionContextMenu, setPreviewContextMenu]);
}

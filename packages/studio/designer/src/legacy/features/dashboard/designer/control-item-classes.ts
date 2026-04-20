import { cn } from '../../../lib/utils';

export const designerControlItemBaseClass =
  'relative group flex flex-col gap-2 rounded-md border border-border bg-background p-4 shadow-sm transition-all hover:border-primary/50';

export const designerControlHandleClass =
  'absolute top-2 right-2 cursor-grab rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100 active:cursor-grabbing';

export const designerControlSelectedClass = 'ring-2 ring-primary ring-offset-1';

export const designerControlPlaceholderClass =
  'opacity-30 border-dashed border-2 border-primary/50 bg-primary/5';

export const designerControlOverlayClass =
  'z-50 cursor-grabbing border-primary bg-background/80 opacity-100 shadow-2xl backdrop-blur-sm ring-1 ring-primary scale-[1.02]';

export const designerWorkbenchRowClass =
  'scrollbar-none flex min-h-[56px] items-center overflow-x-auto rounded-lg border border-transparent px-3 py-2 transition-colors';

export const designerWorkbenchRowEmptyClass =
  'border-dashed border-border bg-muted/40 text-muted-foreground';

export const designerWorkbenchRowActiveClass =
  'border-primary/40 bg-primary/5';

export function getCompactWorkbenchItemClass(options?: {
  dragging?: boolean;
  insertTarget?: boolean;
  selected?: boolean;
}) {
  const isSelected = options?.selected || options?.insertTarget;

  return cn(
    'group relative flex shrink-0 select-none flex-row items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors',
    options?.dragging ? 'z-20 cursor-grabbing border-primary/35 bg-background/95 shadow-lg shadow-primary/10' : 'cursor-grab active:cursor-grabbing',
    options?.dragging
      ? 'border-primary/35 bg-background/95 shadow-lg shadow-primary/10'
      : isSelected
        ? 'border-primary/30 bg-background/95 shadow-[inset_0_0_0_1px_rgba(37,99,235,0.08)]'
        : 'border-transparent bg-transparent hover:border-border/40 hover:bg-background/70',
  );
}

export function getDesignerControlItemClass(options?: {
  selected?: boolean;
  placeholder?: boolean;
  dragging?: boolean;
}) {
  return cn(
    designerControlItemBaseClass,
    options?.selected && designerControlSelectedClass,
    options?.placeholder && designerControlPlaceholderClass,
    options?.dragging && 'cursor-grabbing',
  );
}

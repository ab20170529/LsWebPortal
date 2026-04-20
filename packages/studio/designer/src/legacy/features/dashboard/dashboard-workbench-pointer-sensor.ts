import React from 'react';
import { PointerSensor } from '@dnd-kit/core';

export class DesignerWorkbenchPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent }: React.PointerEvent<Element>) => {
        if (!nativeEvent.isPrimary || nativeEvent.button !== 0) {
          return false;
        }

        const target = nativeEvent.target;
        return !(target instanceof HTMLElement && target.closest('[data-drag-resize-handle="true"]'));
      },
    },
  ];
}

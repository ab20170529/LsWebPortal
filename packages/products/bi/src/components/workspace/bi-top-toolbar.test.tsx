import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BiTopToolbar } from './bi-top-toolbar';

describe('BiTopToolbar', () => {
  it('disables preview and shows the reason when the selected archives have no versions', () => {
    render(
      <BiTopToolbar
        canPublish={false}
        canPreview={false}
        isMutating={false}
        nodePath={['公司', '大维度节点']}
        onOpenDesign={vi.fn()}
        onOpenPreview={vi.fn()}
        onPublish={vi.fn()}
        previewStatusText="当前节点下的 BI 档案还没有任何版本，请先保存一个版本后再预览。"
        screenName="销售驾驶舱"
      />,
    );

    expect(screen.getByRole('button', { name: /预览页面/i }).hasAttribute('disabled')).toBe(true);
    expect(screen.queryByText('当前节点下的 BI 档案还没有任何版本，请先保存一个版本后再预览。')).not.toBeNull();
  });
});

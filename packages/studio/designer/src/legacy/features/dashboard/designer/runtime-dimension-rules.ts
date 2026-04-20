function sanitizeToken(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-');
}

export function createRuntimeClassName(prefix: string, id: string) {
  return `${sanitizeToken(prefix)}-${sanitizeToken(id)}`;
}

export function createRuntimeDeclarationBlock(
  className: string,
  declarations: Record<string, number | string | null | undefined>,
) {
  const entries = Object.entries(declarations)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([property, value]) => {
      if (typeof value === 'number') {
        return `${property}:${Math.round(value)}px;`;
      }

      return `${property}:${value};`;
    })
    .join('');

  return entries ? `.${className}{${entries}}` : '';
}

export function joinRuntimeDeclarationBlocks(blocks: string[]) {
  return blocks.filter(Boolean).join('\n');
}

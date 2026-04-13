import type { ReactNode } from 'react';
import type {
  PlatformTemplateViewModel,
  PlatformViewNode,
} from '@lserp/contracts';
import { evaluateBooleanExpression } from '@lserp/runtime-expression';

export type PlatformViewRenderContext = {
  actions?: Record<string, () => void>;
  actionPermissions?: Record<string, { disabled: boolean; visible: boolean }>;
  bindings?: Record<string, unknown>;
  fieldPermissions?: Record<string, { disabled: boolean; visible: boolean }>;
  validationErrors?: Record<string, string[]>;
};

export type PlatformViewComponentProps = {
  children?: ReactNode;
  context: PlatformViewRenderContext;
  node: PlatformViewNode;
};

export type PlatformViewComponent = (
  props: PlatformViewComponentProps,
) => ReactNode;

export type PlatformViewRegistry = Partial<
  Record<PlatformViewNode['kind'], PlatformViewComponent>
>;

type PlatformTemplateRendererProps = {
  context?: PlatformViewRenderContext;
  registry: PlatformViewRegistry;
  viewModel: PlatformTemplateViewModel;
};

function renderNode(
  node: PlatformViewNode,
  registry: PlatformViewRegistry,
  context: PlatformViewRenderContext,
): ReactNode {
  if (
    node.visibleWhen &&
    !evaluateBooleanExpression(node.visibleWhen, context.bindings ?? {})
  ) {
    return null;
  }

  const component = registry[node.kind];

  if (!component) {
    return null;
  }

  const children = node.children
    ?.map((child) => renderNode(child, registry, context))
    .filter(Boolean);

  return component({
    children,
    context,
    node,
  });
}

export function PlatformTemplateRenderer({
  context = {},
  registry,
  viewModel,
}: PlatformTemplateRendererProps) {
  return renderNode(viewModel.root, registry, context);
}

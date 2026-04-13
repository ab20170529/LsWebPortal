import { Badge, Card } from '@lserp/ui';

const designerCapabilities = [
  'Metadata authoring workspace',
  'Form, bill, and layout configuration',
  'Rule and action design entry',
  'Asset governance and preview tooling',
];

export function DesignerHomePage() {
  return (
    <div className="space-y-6">
      <Card className="rounded-[36px] p-8 lg:p-10">
        <Badge>Designer Domain</Badge>
        <h2 className="theme-text-strong mt-4 text-4xl font-black tracking-tight">
          Designer enters the mother project as a real product domain.
        </h2>
        <p className="theme-text-muted mt-4 max-w-3xl text-sm leading-8">
          This is not a mirror of the old design platform. It is the new Studio
          domain that will absorb existing capabilities by slice, while sharing
          the same contracts and runtime with the platform.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {designerCapabilities.map((capability) => (
          <Card
            key={capability}
            className="rounded-[28px] p-6"
          >
            <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.22em]">
              Migration Slot
            </div>
            <div className="theme-text-strong mt-3 text-xl font-black tracking-tight">
              {capability}
            </div>
            <p className="theme-text-muted mt-3 text-sm leading-7">
              Each slice should move in with clear contracts instead of carrying
              the old workbench shell forward.
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

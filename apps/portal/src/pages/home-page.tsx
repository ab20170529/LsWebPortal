import { Badge, Card } from '@lserp/ui';

const migrationStages = [
  {
    title: 'Phase 1',
    description:
      'Stabilize the mother shell, package groups, theme system, and view contracts.',
  },
  {
    title: 'Phase 2',
    description:
      'Move reusable auth, http, contracts, and selected Designer capabilities into the new structure.',
  },
  {
    title: 'Phase 3',
    description:
      'Grow the ERP runtime inside the same portal and let later products reuse the runtime foundation.',
  },
];

const architectureCards = [
  {
    label: 'Single Port',
    text: 'One portal entry hosts Designer, ERP, Project, and future domains without fragmenting deployment.',
  },
  {
    label: 'Access Gate',
    text: 'The unified login flow lands in a shared system gate. In the initial version, all logged-in users can enter all registered systems.',
  },
  {
    label: 'Theme Ready',
    text: 'Theme presets and token overrides make global style changes possible without rewriting pages.',
  },
  {
    label: 'View Protocol',
    text: 'View structure can evolve independently from runtime and business logic, which is critical for template design and AI-assisted generation.',
  },
];

export function HomePage() {
  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden rounded-[36px] p-8 lg:p-10">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[32%] bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.12),transparent_68%)] lg:block" />

        <Badge tone="success">Clean Mother</Badge>
        <h2 className="theme-text-strong mt-4 max-w-4xl text-4xl font-black tracking-tight lg:text-5xl">
          Build the platform shell first, then grow Designer, ERP, and Project into it.
        </h2>
        <p className="theme-text-muted mt-4 max-w-3xl text-sm leading-8">
          This home page is no longer a placeholder. It defines the direction of
          the mother project: one shell, one runtime foundation, and stable
          extension boundaries.
        </p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="rounded-[32px] p-8">
          <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">
            Migration Rhythm
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {migrationStages.map((stage) => (
              <div
                key={stage.title}
                className="theme-surface-subtle rounded-[24px] p-5"
              >
                <div className="theme-text-strong text-sm font-black tracking-tight">
                  {stage.title}
                </div>
                <p className="theme-text-muted mt-3 text-sm leading-7">
                  {stage.description}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[32px] p-8">
          <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">
            Architecture Signals
          </div>
          <div className="mt-5 space-y-4">
            {architectureCards.map((card) => (
              <div
                key={card.label}
                className="theme-surface-subtle rounded-[24px] p-5"
              >
                <div className="theme-text-strong text-sm font-black tracking-tight">
                  {card.label}
                </div>
                <p className="theme-text-muted mt-2 text-sm leading-7">
                  {card.text}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

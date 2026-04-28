import { Badge, Card } from '@lserp/ui';

type PlaceholderMetric = {
  label: string;
  value: string;
};

type PlaceholderSection = {
  items: string[];
  title: string;
};

type ProjectWorkspacePlaceholderPageProps = {
  description: string;
  kicker: string;
  metrics?: PlaceholderMetric[];
  notice?: string;
  sections: PlaceholderSection[];
  title: string;
};

export function ProjectWorkspacePlaceholderPage({
  description,
  kicker,
  metrics = [],
  notice,
  sections,
  title,
}: ProjectWorkspacePlaceholderPageProps) {
  return (
    <div className="space-y-4">
      <Card className="rounded-[32px] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="theme-text-soft text-xs font-bold">
              {kicker}
            </div>
            <div className="theme-text-strong mt-3 text-[30px] font-bold">
              {title}
            </div>
            <div className="theme-text-muted mt-3 max-w-2xl text-sm leading-7">
              {description}
            </div>
          </div>

          <Badge tone="brand">规划中</Badge>
        </div>

        {notice ? (
          <div className="mt-5 rounded-[24px] border border-sky-100 bg-sky-50/80 px-5 py-4 text-sm text-sky-800">
            {notice}
          </div>
        ) : null}

        {metrics.length ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="theme-surface-subtle rounded-[24px] px-5 py-4"
              >
                <div className="theme-text-soft text-xs font-bold">
                  {metric.label}
                </div>
                <div className="theme-text-strong mt-3 text-3xl font-bold">
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title} className="rounded-[28px] p-5">
            <div className="theme-text-strong text-lg font-bold">
              {section.title}
            </div>
            <div className="mt-4 space-y-3">
              {section.items.map((item) => (
                <div
                  key={item}
                  className="theme-surface-subtle rounded-[22px] px-4 py-3 text-sm leading-6"
                >
                  {item}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

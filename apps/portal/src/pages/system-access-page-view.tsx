import { startTransition } from 'react';
import { getGrantedSystemIds, type AuthSession } from '@lserp/auth';
import { getPlatformSystemEntry } from '@lserp/contracts';
import { Badge, Button, Card } from '@lserp/ui';

import { navigateToDesigner } from '../features/auth/services/designer-navigation';
import { navigate } from '../router';

type AccessDeniedPageProps = {
  session: AuthSession;
  targetLabel: string;
};

type SystemAccessPageProps = {
  session: AuthSession;
};

const ACCESS_DENIED = '\u65e0\u6743\u9650';
const RETURN_TO_SYSTEMS = '\u8fd4\u56de\u7cfb\u7edf\u9009\u62e9';
const RETURN_TO_LOGIN = '\u8fd4\u56de\u767b\u5f55\u9875';
const AVAILABLE_SYSTEMS = 'Available Systems';
const EMPTY_ACCESS = '\u5f53\u524d\u8d26\u53f7\u6682\u672a\u914d\u7f6e\u53ef\u8bbf\u95ee\u7cfb\u7edf\u3002';
const NO_SYSTEM_TITLE = '\u5f53\u524d\u8d26\u53f7\u6682\u65e0\u53ef\u8fdb\u5165\u7684\u7cfb\u7edf';
const NO_SYSTEM_DESC = '\u8bf7\u8054\u7cfb\u7ba1\u7406\u5458\u4e3a\u5f53\u524d\u8d26\u53f7\u914d\u7f6e\u7cfb\u7edf\u6388\u6743\u540e\u518d\u767b\u5f55\u3002';

function getAccessDeniedTitle(targetLabel: string) {
  return `\u5f53\u524d\u8d26\u53f7\u672a\u5f00\u901a ${targetLabel}`;
}

const ACCESS_DENIED_DESC =
  '\u95e8\u6237\u4f1a\u6839\u636e\u5f53\u524d\u8d26\u53f7\u7684\u7cfb\u7edf\u6388\u6743\u63a7\u5236\u8bbf\u95ee\u8303\u56f4\u3002\u82e5\u8fd8\u672a\u5f00\u901a\u8be5\u7cfb\u7edf\uff0c\u8bf7\u5148\u8fd4\u56de\u7cfb\u7edf\u9009\u62e9\u9875\uff0c\u6216\u8054\u7cfb\u7ba1\u7406\u5458\u8865\u9f50\u6388\u6743\u540e\u518d\u8fdb\u5165\u3002';

function openSystemEntry(session: AuthSession, route: string, systemId: string) {
  if (systemId === 'designer') {
    navigateToDesigner(session, systemId);
    return;
  }

  navigate(route);
}

export function AccessDeniedPage({ session, targetLabel }: AccessDeniedPageProps) {
  const grantedEntries = getGrantedSystemIds(session)
    .map((systemId) => getPlatformSystemEntry(systemId))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] p-8">
        <Badge tone="danger">{ACCESS_DENIED}</Badge>
        <h1 className="theme-text-strong mt-4 text-3xl font-black tracking-tight">
          {getAccessDeniedTitle(targetLabel)}
        </h1>
        <p className="theme-text-muted mt-3 max-w-3xl text-sm leading-7">{ACCESS_DENIED_DESC}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={() => {
              startTransition(() => {
                navigate('/systems');
              });
            }}
          >
            {RETURN_TO_SYSTEMS}
          </Button>
          <Button
            onClick={() => {
              startTransition(() => {
                navigate('/');
              });
            }}
            tone="ghost"
          >
            {RETURN_TO_LOGIN}
          </Button>
        </div>
      </Card>

      <Card className="rounded-[28px] p-8">
        <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">
          {AVAILABLE_SYSTEMS}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {grantedEntries.length > 0 ? (
            grantedEntries.map((entry) => (
              <div key={entry.id} className="theme-surface-subtle rounded-[22px] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="theme-text-strong text-sm font-black tracking-tight">{entry.title}</div>
                  <Badge tone={entry.tone}>{entry.shortLabel}</Badge>
                </div>
                <p className="theme-text-muted mt-3 text-sm leading-7">{entry.description}</p>
              </div>
            ))
          ) : (
            <div className="theme-surface-subtle rounded-[22px] p-5 text-sm text-slate-600">{EMPTY_ACCESS}</div>
          )}
        </div>
      </Card>
    </div>
  );
}

export function SystemAccessPage({ session }: SystemAccessPageProps) {
  const accessibleEntries = getGrantedSystemIds(session)
    .map((systemId) => getPlatformSystemEntry(systemId))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  if (accessibleEntries.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6fb] px-6 py-12">
        <Card className="w-full max-w-xl rounded-[28px] p-10 text-center">
          <div className="theme-text-strong text-xl font-black tracking-tight">{NO_SYSTEM_TITLE}</div>
          <p className="theme-text-muted mt-3 text-sm leading-7">{NO_SYSTEM_DESC}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6fb] px-6 py-12">
      <div
        className={
          accessibleEntries.length === 1
            ? 'w-full max-w-md'
            : accessibleEntries.length === 2
              ? 'w-full max-w-3xl'
              : 'w-full max-w-5xl'
        }
      >
        <div
          className={
            accessibleEntries.length === 1
              ? 'grid justify-center'
              : accessibleEntries.length === 2
                ? 'grid gap-6 md:grid-cols-2'
                : 'grid gap-6 md:grid-cols-2 xl:grid-cols-3'
          }
        >
          {accessibleEntries.map((entry) => (
            <button
              key={entry.id}
              className="group min-h-[220px] rounded-[28px] border border-slate-200 bg-white p-8 text-left shadow-[0_24px_60px_-42px_rgba(15,23,42,0.26)] transition-all duration-200 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_28px_70px_-38px_rgba(37,99,235,0.24)]"
              onClick={() => {
                openSystemEntry(session, entry.route, entry.id);
              }}
              type="button"
            >
              <div className="flex items-center justify-between gap-3">
                <Badge tone={entry.tone}>{entry.shortLabel}</Badge>
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-300 transition-colors group-hover:text-slate-500">
                  Enter
                </span>
              </div>
              <div className="mt-10 text-2xl font-black tracking-tight text-slate-900">{entry.title}</div>
              <p className="mt-4 text-sm leading-7 text-slate-500">{entry.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import type { PortalAuthBootstrapPayload } from '@lserp/auth';

import { apiConfig } from '../../../config';
import { apiRequest } from './http-client';

type PortalSsoEnvelope = {
  code?: number;
  data?: unknown;
  message?: string;
  msg?: string;
  success?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPortalAuthBootstrapPayload(value: unknown): value is PortalAuthBootstrapPayload {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isRecord(value.user)
    && Array.isArray(value.roleAssignments)
    && Array.isArray(value.systemGrants)
  );
}

function extractEnvelopeError(envelope: PortalSsoEnvelope) {
  return envelope.message || envelope.msg || 'Portal 免登录票据校验失败。';
}

function unwrapPortalSsoPayload(response: unknown): PortalAuthBootstrapPayload {
  let current = response;

  for (let depth = 0; depth < 4; depth += 1) {
    if (isPortalAuthBootstrapPayload(current)) {
      return current;
    }

    if (!isRecord(current) || !('data' in current)) {
      break;
    }

    const envelope = current as PortalSsoEnvelope;
    if (typeof envelope.code === 'number' && envelope.code !== 0) {
      throw new Error(extractEnvelopeError(envelope));
    }

    if (envelope.success === false) {
      throw new Error(extractEnvelopeError(envelope));
    }

    current = envelope.data;
  }

  throw new Error('Portal 免登录返回数据格式不正确。');
}

export async function exchangePortalSsoTicket(ticket: string): Promise<PortalAuthBootstrapPayload> {
  const response = await apiRequest<unknown>(apiConfig.auth.ssoExchange, {
    body: { ticket },
    method: 'POST',
  });
  return unwrapPortalSsoPayload(response);
}

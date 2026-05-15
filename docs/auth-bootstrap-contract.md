# Portal Auth Bootstrap Contract

## Purpose

The portal shell has one login entry, but login alone must not grant access to every product system.

After authentication succeeds, the frontend should request one bootstrap payload that contains:

- current user identity
- current role assignments
- merged system grants
- default system preference

The frontend then normalizes that payload into the local `AuthSession` shape and uses it for:

- navigation filtering
- `/systems` access gate rendering
- route guards for `/designer`, `/erp`, and future domains

## Login Tenant And Business DB Flow

This flow is functionally aligned with LumClaw. It does not mean copying LumClaw page layout, styling, or component structure into Portal.

- `GET /api/auth/tenants` should expose the default platform database pseudo-option before real tenant rows.
- The platform database pseudo-option is identified by `tenantCode=__platform__` or `tenantType=PLATFORM_DB`.
- Do not treat `tenantType=PLATFORM` as the pseudo platform option unless its `tenantCode` is `__platform__`; Java auth treats every other non-`__platform__` code as a real tenant login.
- Selecting the platform database submits `POST /api/auth/login/identity` without a real `tenantCode`.
- Selecting a real tenant may use the same identity endpoint with `tenantCode`; the backend delegates it into the tenant-login path.
- Portal must preserve backend `loginStage` and `businessDbRequired`.
- After login, route to `/systems`; that page owns both business database selection and system selection.
- In `/systems`, after any non-company identity or tenant session, call `GET /api/auth/business-dbs` unless the backend explicitly returns `businessDbRequired=false`.
- If accessible business databases are returned, render them in the left business-database area of `/systems`; the user confirms one there before entering a system.
- Business database activation should use the selected `companyKey` contract and avoid inventing frontend-only database id fields.

Important regression trap: platform selection must not call the plain password login endpoint as a fallback, because that can create a company-stage platform-default session and skip the `/systems` business database selector.

## Recommended Backend Tables

The current direction is compatible with this backend model:

- `platform_system`
  - one row per accessible product system
  - examples: `designer`, `erp`, `mes`, `app`
- `platform_system_user`
  - direct user to system bindings
- `platform_system_role`
  - role to system bindings

The frontend does not need to know how those tables are joined internally.

It only needs the merged result.

## Recommended API

Suggested endpoint:

- `GET /auth/portal/bootstrap`

Suggested response:

```json
{
  "user": {
    "employeeId": 1,
    "username": "portal.demo",
    "displayName": "Portal Demo Admin"
  },
  "defaultSystemId": "designer",
  "roleAssignments": [
    {
      "id": "role-platform-admin",
      "label": "Platform Admin"
    },
    {
      "id": "role-erp-operator",
      "label": "ERP Operator"
    }
  ],
  "systemGrants": [
    {
      "systemId": "designer",
      "source": "role",
      "sourceId": "role-platform-admin",
      "sourceLabel": "Platform Admin"
    },
    {
      "systemId": "erp",
      "source": "user",
      "sourceId": "user-1",
      "sourceLabel": "Direct user grant"
    }
  ]
}
```

## Frontend Mapping

Frontend normalization is implemented in:

- `packages/platform/auth/src/index.tsx`

Important rules:

- role assignments are deduplicated by role id
- system grants are deduplicated by `systemId + source + sourceId`
- `defaultSystemId` is only trusted if it is also present in the merged grant list
- if no valid default exists, the frontend falls back to the first granted system

## Frontend Responsibilities

The frontend should:

1. authenticate once
2. fetch the bootstrap payload
3. normalize it into `AuthSession`
4. route the user to `/systems`
5. allow direct domain entry only when the domain is granted

The frontend should not:

- infer hidden system access rules on its own
- merge role and user grants differently from the backend contract
- assume every authenticated user can enter every system

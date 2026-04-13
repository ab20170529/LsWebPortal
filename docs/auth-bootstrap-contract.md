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

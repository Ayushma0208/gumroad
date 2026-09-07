# Customer account

## Architecture

Authenticated customers use a unified **Account** area under `/account`.

Existing self-service surfaces stay in place and are linked from Account nav:

- Library → `/library`
- Orders → `/orders`
- Wishlist → `/wishlist`
- Notification prefs → `/account/notifications` (API unchanged)

`/profile` and `/settings/notifications` redirect into Account.

Auth remains JWT httpOnly cookie (`lumen_session`). There is **no** DB session/device table.

## `/me` APIs

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/auth/me` | Current user |
| `GET` | `/api/v1/users/me` | Same public user payload |
| `PATCH` | `/api/v1/users/me` | Update **name** only |
| `POST` | `/api/v1/users/me/avatar` | Upload avatar (Cloudinary) |
| `DELETE` | `/api/v1/users/me/avatar` | Remove avatar |
| `GET` | `/api/v1/users/me/reviews` | Reviews authored by current user |
| `DELETE` | `/api/v1/users/me` | Soft-close account |
| `POST` | `/api/v1/auth/change-password` | Change password |

Notification preferences remain:

- `GET|PATCH /api/v1/notification-preferences`

## Profile rules

Editable: `name` (2–80 chars).

Not editable via customer APIs: `role`, `email`, `status`, `passwordHash`, admin flags.

Email change is **not** implemented (would require verified dual-email flow).

## Avatar

Folder: `marketplace/users/{userId}/avatar`

- Image type/size validated (existing media rules)
- Stores `User.avatarUrl` + `User.avatarPublicId`
- Replaces/deletes previous Cloudinary asset safely

## Password / security

- `change-password` verifies current password with bcrypt
- New password: min 8, letter + number
- Cookie re-issued after success
- JWT is still stateless — old tokens remain valid until expiry if stolen; logout clears cookie only
- Device/session list: **not implemented** (no session store)

Password reset remains a frontend stub (`/forgot-password`) — no email token API yet.

## Preferences

- Appearance: client-only via `next-themes` (system/light/dark)
- Email notifications: existing NotificationPreference model

## Account deletion

`DELETE /api/v1/users/me` with `{ password, confirm: true }`:

1. Verify password
2. Reject ADMIN and CREATOR accounts (support path)
3. Anonymize name/email, clear avatar, randomize password hash
4. Set `status = SUSPENDED`
5. Clear auth cookie

Orders, purchases, and reviews are **retained** for financial/history integrity.

## Privacy

Public product reviews still show display name/avatar only. Account endpoints never accept `userId` from the client.

## Frontend

- Shell: `AccountShell` + sidebar/mobile sheet
- Pages: overview, profile, security, preferences, notifications, reviews
- Hooks: `use-account.ts`
- Menu: Your account / Notifications / Settings

## Tests

`apps/api/tests/account.test.ts` covers profile mass-assignment, password change, my reviews ownership, soft-close.

## Limitations

- No verified email-change flow
- No password-reset email tokens
- No multi-device session management
- Creators cannot self-close
- No username/bio fields (not on User schema)
- Theme not persisted server-side

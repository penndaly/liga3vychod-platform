# Task: User Management System (Component A)

## Status: IN PROGRESS

Build the user management interface for managing 54+ users across 6 role tiers.

## Requirements

### 1. UserManagement Page (/admin/users)

3-tab interface:

**Tab 1: All Users (Zoznam používateľov)**
- User table: avatar (initials), name, email, role badge, assigned clubs (pills), edit/delete on hover
- Search/filter by name or email
- Stats: Total, Superadmins, Club admins, Editors

**Tab 2: Roles & Permissions (Roly a oprávnenia)**
- Role hierarchy table — 6 tiers with user count per role
- Permission matrix for CLUB_ADMIN (Resources × Actions)

**Tab 3: Create User (Vytvoriť používateľa)**
- Fields: Full name, Email, Role dropdown, Clubs multi-select
- Info notice: email invitation sent to set password
- Submit: "Vytvoriť používateľa"

### 2. Role Tiers

| Role | Slovak label | Scope |
|------|-------------|-------|
| SUPERADMIN | Superadmin | Full access — league + all 14 clubs |
| CLUB_ADMIN | Club Admin | Full access — assigned clubs only |
| EDITOR | Editor | Create/edit content, no publish |
| CONTRIBUTOR | Contributor | Create drafts only |
| BROADCAST_OPERATOR | Broadcast | Live stream controls |
| VIEWER | Viewer | Read-only |

### 3. Firestore Path

```
users/{uid}
  name: string
  email: string
  role: SUPERADMIN | CLUB_ADMIN | EDITOR | CONTRIBUTOR | BROADCAST_OPERATOR | VIEWER
  clubs: string[]   // club names e.g. ["FK Bardejov"]
  createdAt: timestamp
  createdBy: string (uid)
```

### 4. Create User Flow

1. `createUserWithEmailAndPassword` on secondary Firebase app instance (preserves admin session)
2. `setDoc` user metadata to Firestore
3. `sendPasswordResetEmail` so new user sets their own password

### 5. Components

- RoleBadge.jsx — color-coded role pill
- ClubPill.jsx — club assignment pill
- PermissionMatrix.jsx — Resources × Actions read-only grid
- UserModal.jsx — inline edit modal (for Tab 1 edit)

### 6. useAuth.jsx Updates

Extended to fetch `userData` from Firestore on auth state change. Exposes:
- `userData` — Firestore metadata
- `isSuperadmin` — boolean
- `isClubAdmin(clubSlug)` — boolean
- `hasPermission(clubSlug, resource, action)` — boolean

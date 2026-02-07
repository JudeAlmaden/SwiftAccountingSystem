# Audit Trails – Immutability

Audit trail records must not be updated or deleted so that logs remain trustworthy for compliance and auditing.

## Application-level protection (already in place)

1. **Model** (`App\Models\AuditTrail`): `updating` and `deleting` model events throw a `RuntimeException`, so any Eloquent `update()` or `delete()` on audit trail records fails in code.
2. **Policy** (`App\Policies\AuditTrailPolicy`): All update/delete/restore/forceDelete actions are denied for every user (including admin). Any future controller that uses `authorize()` for these actions will be blocked.
3. **No routes**: There are no web/API routes that update or delete audit trails; only read (index) and write via `AuditTrail::log()`.

## Database-level protection (recommended for production)

To ensure that even someone with application or DB access cannot clear or alter audit data, restrict the **application’s MySQL user** so it cannot run `UPDATE` or `DELETE` on `audit_trails`:

```sql
-- After migrations have been run, revoke update/delete on audit_trails from the app user.
-- Replace 'your_app_db_user' and your_database with your actual names.

REVOKE UPDATE, DELETE ON your_database.audit_trails FROM 'your_app_db_user'@'%';
FLUSH PRIVILEGES;
```

The app user should keep **SELECT** (for the audit trails view) and **INSERT** (for `AuditTrail::log()`). Migrations (CREATE/ALTER) are usually run with a different, privileged user, so this only affects the runtime connection.

## Verifying

- In the app, any call to `$auditTrail->delete()` or `$auditTrail->update([...])` will throw: *"Audit trail records cannot be modified or deleted."*
- With DB privileges revoked, direct SQL `UPDATE audit_trails ...` or `DELETE FROM audit_trails ...` as the app user will return a permission error.

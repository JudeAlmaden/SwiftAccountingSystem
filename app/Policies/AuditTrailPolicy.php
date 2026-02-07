<?php

namespace App\Policies;

use App\Models\AuditTrail;
use App\Models\User;

class AuditTrailPolicy
{
    /**
     * Anyone with "view audit trails" can view (enforced by route middleware).
     */
    public function viewAny(?User $user): bool
    {
        return $user?->can('view audit trails') ?? false;
    }

    public function view(?User $user, AuditTrail $auditTrail): bool
    {
        return $user?->can('view audit trails') ?? false;
    }

    /** Audit trails are append-only; no one may create via normal CRUD (use AuditTrail::log only). */
    public function create(User $user): bool
    {
        return false;
    }

    /** Audit trail records are immutable. */
    public function update(User $user, AuditTrail $auditTrail): bool
    {
        return false;
    }

    /** Audit trail records must never be deleted (including by admin). */
    public function delete(User $user, AuditTrail $auditTrail): bool
    {
        return false;
    }

    public function restore(User $user, AuditTrail $auditTrail): bool
    {
        return false;
    }

    public function forceDelete(User $user, AuditTrail $auditTrail): bool
    {
        return false;
    }
}

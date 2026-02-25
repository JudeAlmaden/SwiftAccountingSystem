<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Journal;
use App\Models\JournalTracking;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Models\User;
use App\Models\Notification;
use App\Models\ControlNumberPrefix;
use App\Models\AuditTrail;

class JournalController extends Controller
{
    public function index(Request $request)
    {
        // Validate incoming request parameters
        $validated = $request->validate([
            'search'       => 'nullable|string|max:255',
            'date_from'    => 'nullable|date',
            'date_to'      => 'nullable|date|after_or_equal:date_from',
            'status'       => 'nullable|string|in:pending,approved,rejected',
            'type'         => 'nullable|string|max:100',
            'current_step' => 'nullable|integer|in:1,2,3,4',
            'sort_by'      => 'nullable|string|in:created_at,control_number,title,status,current_step',
            'sort_order'   => 'nullable|string|in:asc,desc',
        ]);

        // Build the query
        $query = Journal::query()->withCount('items');

        // Search functionality (control_number, title, description)
        if (!empty($validated['search'])) {
            $searchTerm = $validated['search'];
            $query->where(function ($q) use ($searchTerm) {
                $q->where('control_number', 'like', '%' . $searchTerm . '%')
                    ->orWhere('title', 'like', '%' . $searchTerm . '%')
                    ->orWhere('description', 'like', '%' . $searchTerm . '%');
            });
        }

        // Date range filtering
        if (!empty($validated['date_from'])) {
            $query->whereDate('created_at', '>=', $validated['date_from']);
        }

        if (!empty($validated['date_to'])) {
            $query->whereDate('created_at', '<=', $validated['date_to']);
        }

        // Status filtering
        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        // Type filtering
        if (!empty($validated['type'])) {
            $query->where('type', $validated['type']);
        }

        // Filter by current step (workflow position)
        if (!empty($validated['current_step'])) {
            $query->where('current_step', $validated['current_step']);
        }

        // Sorting
        $sortBy    = $validated['sort_by']    ?? 'created_at';
        $sortOrder = $validated['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        // Get paginated results
        $journals = $query->paginate(10);

        // Return JSON response with pagination data
        return response()->json([
            'data'          => $journals->items(),
            'current_page'  => $journals->currentPage(),
            'last_page'     => $journals->lastPage(),
            'next_page_url' => $journals->nextPageUrl(),
            'prev_page_url' => $journals->previousPageUrl(),
            'total'         => $journals->total(),
            'from'          => $journals->firstItem(),
            'to'            => $journals->lastItem(),
            'per_page'      => $journals->perPage(),
        ]);
    }

    public function show($id)
    {
        $journal = Journal::with(['items.account', 'tracking.handler', 'attachments'])->findOrFail($id);
        $data = $journal->toArray();
        $data['step_flow'] = $journal->step_flow_for_api;
        return response()->json(['journal' => $data]);
    }

    public function store(Request $request)
    {
        // Handle JSON accounts if sent as a string (common with FormData)
        if ($request->has('accounts') && is_string($request->accounts)) {
            $request->merge(['accounts' => json_decode($request->accounts, true)]);
        }

        $validated = $request->validate([
            'title'                    => 'required|string|max:255',
            'description'              => 'nullable|string',
            'type'                     => 'nullable|string|max:100',
            'control_number_prefix_id' => 'required|exists:control_number_prefixes,id',
            'accounts'                 => 'required|array|min:1',
            'accounts.*.account_id'    => 'required|exists:accounts,id',
            'accounts.*.type'          => 'required|in:debit,credit',
            'accounts.*.amount'        => 'required|numeric',
            'accounts.*.order_number'  => 'required|integer',
            'attachments'              => 'nullable|array',
            'attachments.*'            => 'string', // These are temp folder IDs/UUIDs
        ]);

        $prefix     = ControlNumberPrefix::findOrFail($validated['control_number_prefix_id']);
        $prefixCode = Str::upper($prefix->code);

        // Get the latest journal with this prefix to determine the next number
        $latestJournal = Journal::where('control_number', 'like', "{$prefixCode}-%")
            ->orderBy('id', 'desc')
            ->first();

        $nextNumber = 1;
        if ($latestJournal) {
            $parts    = explode('-', $latestJournal->control_number);
            $lastPart = end($parts);
            if (is_numeric($lastPart)) {
                $nextNumber = intval($lastPart) + 1;
            }
        }

        $paddedNumber  = str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
        $controlNumber = "{$prefixCode}-{$paddedNumber}";

        $type     = $validated['type'] ?? 'disbursement';
        $stepFlow = $type === 'journal'
            ? Journal::journalStepFlow()
            : Journal::defaultStepFlow();

        $journal  = Journal::create([
            'control_number' => $controlNumber,
            'type'           => $type,
            'title'          => $validated['title'],
            'description'    => $validated['description'] ?? '',
            'step_flow'      => $stepFlow,
            'current_step'   => 2, // Next: Accounting Head
            'status'         => 'pending',
        ]);

        // Save items
        foreach ($validated['accounts'] as $account) {
            $journal->items()->create([
                'account_id'   => $account['account_id'],
                'type'         => $account['type'],
                'amount'       => $account['amount'],
                'order_number' => $account['order_number'],
            ]);
        }

        // Handle Asynchronous Attachments
        if (!empty($validated['attachments'])) {
            foreach ($validated['attachments'] as $tempId) {
                $temporaryUpload = \App\Models\TemporaryUpload::where('folder', $tempId)->first();

                if ($temporaryUpload) {
                    $oldPath   = 'attachments/tmp/' . $tempId . '/' . $temporaryUpload->filename;
                    $newFolder = 'attachments/' . date('Y/m/d');
                    $newPath   = $newFolder . '/' . $temporaryUpload->filename;

                    if (Storage::disk('public')->exists($oldPath)) {
                        Storage::disk('public')->move($oldPath, $newPath);

                        $journal->attachments()->create([
                            'file_path'  => $newPath,
                            'file_name'  => $temporaryUpload->filename,
                            'file_type'  => Storage::disk('public')->mimeType($newPath),
                        ]);

                        Storage::disk('public')->deleteDirectory('attachments/tmp/' . $tempId);
                        $temporaryUpload->delete();
                    }
                }
            }
        }

        // Tracking — step 1 auto-approved by creating assistant
        $handledBy = Auth::user()->id;
        JournalTracking::create([
            'handled_by'  => $handledBy,
            'journal_id'  => $journal->id,
            'step'        => 1,
            'role'        => 'accounting assistant',
            'action'      => 'approved',
            'remarks'     => 'Voucher generated and approved by assistant.',
            'acted_at'    => now(),
        ]);

        // Notify Accounting Head(s) — Step 2
        $this->notifyUsersWithRole('accounting head', 'New Journal for Review', "A new journal ({$journal->control_number}) has been generated and requires your approval.", route('vouchers.view', ['id' => $journal->id]));

        return response()->json($journal);
    }

    public function approve(Request $request, $id)
    {
        $journal     = Journal::findOrFail($id);
        $user        = Auth::user();
        $roles       = array_map('strtolower', $user->getRoleNames()->toArray());
        $currentStep = (int) $journal->current_step;
        $stepFlow    = $journal->step_flow ?? Journal::defaultStepFlow();

        $stepConfig       = $stepFlow[$currentStep - 1] ?? [];
        $requiredRole     = $currentStep === 1 ? 'accounting assistant' : ($stepConfig['role'] ?? null);
        $restrictedToUserId = isset($stepConfig['user_id']) ? (int) $stepConfig['user_id'] : null;

        if (!in_array('admin', $roles)) {
            if ($restrictedToUserId !== null && $restrictedToUserId !== (int) $user->id) {
                return response()->json(['message' => 'Unauthorized for this step.'], 403);
            }
            if ($requiredRole === null || !in_array(strtolower($requiredRole), $roles)) {
                return response()->json(['message' => 'Unauthorized for this step.'], 403);
            }
        }

        $totalSteps = count($stepFlow);

        // Final step: check_id required only for disbursement vouchers
        if ($currentStep === $totalSteps && $journal->type !== 'journal') {
            $request->validate(['check_id' => 'required|string|max:255']);
        }

        $trackingRole = $currentStep === 1 ? 'accounting assistant' : ($stepConfig['role'] ?? 'admin');
        $nextStep     = $currentStep + 1;
        $status       = $nextStep > $totalSteps ? 'approved' : $journal->status;

        $updateData = [
            'current_step' => min($nextStep, $totalSteps + 1),
            'status'       => $status,
        ];

        if ($currentStep === $totalSteps && $request->has('check_id')) {
            $updateData['check_id'] = $request->check_id;
        }

        $journal->update($updateData);

        JournalTracking::create([
            'handled_by' => $user->id,
            'journal_id' => $journal->id,
            'step'       => $currentStep,
            'role'       => $trackingRole,
            'action'     => 'approved',
            'remarks'    => $request->remarks ?? 'Approved.',
            'acted_at'   => now(),
        ]);

        AuditTrail::log(
            'journal_approved',
            "Journal approved: {$journal->control_number} by {$user->name} (step {$currentStep})",
            $user->id,
            Journal::class,
            $journal->id,
            ['control_number' => $journal->control_number, 'step' => $currentStep, 'status' => $status]
        );

        if ($nextStep <= $totalSteps) {
            $nextRole = $stepFlow[$nextStep - 1]['role'] ?? null;
            if ($nextRole) {
                $this->notifyUsersWithRole($nextRole, 'Review Required', "Journal {$journal->control_number} needs your approval.", route('vouchers.view', ['id' => $journal->id]));
            }
        } else {
            // Final Approval — notify everyone involved
            $involvedUserIds = JournalTracking::where('journal_id', $journal->id)
                ->whereNotNull('handled_by')
                ->pluck('handled_by')
                ->unique();

            foreach ($involvedUserIds as $involvedUserId) {
                Notification::create([
                    'user_id' => $involvedUserId,
                    'title'   => 'Journal Approved',
                    'message' => "Journal ({$journal->control_number}) has been fully approved.",
                    'link'    => route('vouchers.view', ['id' => $journal->id])
                ]);
            }
        }

        $fresh = $journal->fresh(['items.account', 'tracking.handler', 'attachments']);
        $data  = $fresh->toArray();
        $data['step_flow'] = $fresh->step_flow_for_api;
        return response()->json([
            'message' => 'Journal approved successfully.',
            'journal' => $data,
        ]);
    }

    public function decline(Request $request, $id)
    {
        $journal     = Journal::findOrFail($id);
        $user        = Auth::user();
        $roles       = array_map('strtolower', $user->getRoleNames()->toArray());
        $currentStep = (int) $journal->current_step;
        $stepFlow    = $journal->step_flow ?? Journal::defaultStepFlow();

        $stepConfig       = $stepFlow[$currentStep - 1] ?? [];
        $requiredRole     = $currentStep === 1 ? 'accounting assistant' : ($stepConfig['role'] ?? null);
        $restrictedToUserId = isset($stepConfig['user_id']) ? (int) $stepConfig['user_id'] : null;

        if (!in_array('admin', $roles)) {
            if ($restrictedToUserId !== null && $restrictedToUserId !== (int) $user->id) {
                return response()->json(['message' => 'Unauthorized for this step.'], 403);
            }
            if ($requiredRole === null || !in_array(strtolower($requiredRole), $roles)) {
                return response()->json(['message' => 'Unauthorized for this step.'], 403);
            }
        }

        $trackingRole = $currentStep === 1 ? 'accounting assistant' : ($stepConfig['role'] ?? 'admin');

        $journal->update(['status' => 'rejected']);

        AuditTrail::log(
            'journal_declined',
            "Journal declined: {$journal->control_number} by {$user->name} (step {$currentStep})",
            $user->id,
            Journal::class,
            $journal->id,
            ['control_number' => $journal->control_number, 'step' => $currentStep, 'remarks' => $request->remarks ?? null]
        );

        JournalTracking::create([
            'handled_by' => $user->id,
            'journal_id' => $journal->id,
            'step'       => $currentStep,
            'role'       => $trackingRole,
            'action'     => 'rejected',
            'remarks'    => $request->remarks ?? 'Declined.',
            'acted_at'   => now(),
        ]);

        $initiator = $journal->tracking()->where('step', 1)->first();
        if ($initiator && $initiator->handled_by) {
            $reason = $request->remarks ?? 'No reason provided.';
            Notification::create([
                'user_id' => $initiator->handled_by,
                'title'   => 'Journal Declined',
                'message' => "Your journal ({$journal->control_number}) was declined. Reason: {$reason}",
                'link'    => route('vouchers.view', ['id' => $journal->id])
            ]);
        }

        $fresh = $journal->fresh(['items.account', 'tracking.handler', 'attachments']);
        $data  = $fresh->toArray();
        $data['step_flow'] = $fresh->step_flow_for_api;
        return response()->json([
            'message' => 'Journal declined successfully.',
            'journal' => $data,
        ]);
    }

    /**
     * Helper to notify users with a specific role.
     */
    private function notifyUsersWithRole($role, $title, $message, $link)
    {
        $users = User::role($role)->get();
        foreach ($users as $user) {
            Notification::create([
                'user_id' => $user->id,
                'title'   => $title,
                'message' => $message,
                'link'    => $link
            ]);
        }
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Disbursement;
use App\Models\DisbursementTracking;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Models\User;
use App\Models\Notification;
use App\Models\ControlNumberPrefix;

class DisbursementController extends Controller
{
    public function index(Request $request)
    {
        // Validate incoming request parameters
        $validated = $request->validate([
            'search' => 'nullable|string|max:255',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'status' => 'nullable|string|in:pending,approved,rejected',
            'step' => 'nullable|integer|in:1,2,3,4',
            'sort_by' => 'nullable|string|in:created_at,control_number,title,status,step',
            'sort_order' => 'nullable|string|in:asc,desc',
        ]);

        // Build the query
        $query = Disbursement::query()->withCount('items');

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

        // Status filtering - now using status column directly
        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        // Step filtering - filter by current step
        if (!empty($validated['step'])) {
            $query->where('step', $validated['step']);
        }

        // Sorting
        $sortBy = $validated['sort_by'] ?? 'created_at';
        $sortOrder = $validated['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        // Get paginated results
        $disbursements = $query->paginate(10);



        // Return JSON response with pagination data and statistics
        return response()->json([
            'data' => $disbursements->items(),
            'current_page' => $disbursements->currentPage(),
            'last_page' => $disbursements->lastPage(),
            'next_page_url' => $disbursements->nextPageUrl(),
            'prev_page_url' => $disbursements->previousPageUrl(),
            'total' => $disbursements->total(),
            'from' => $disbursements->firstItem(),
            'to' => $disbursements->lastItem(),
            'per_page' => $disbursements->perPage(),

        ]);
    }

    public function show($id){
        $disbursement = Disbursement::with(['items.account', 'tracking.handler', 'attachments'])->findOrFail($id);
        return response()->json([
            'disbursement' => $disbursement
        ]);
    }

    public function store(Request $request){
        // Handle JSON accounts if sent as a string (common with FormData)
        if ($request->has('accounts') && is_string($request->accounts)) {
            $request->merge(['accounts' => json_decode($request->accounts, true)]);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'recommended_by' => 'nullable|string|max:255',
            'control_number_prefix_id' => 'required|exists:control_number_prefixes,id',
            'accounts' => 'required|array|min:1',
            'accounts.*.account_id' => 'required|exists:accounts,id',
            'accounts.*.type' => 'required|in:debit,credit',
            'accounts.*.amount' => 'required|numeric',
            'accounts.*.order_number' => 'required|integer',
            'attachments' => 'nullable|array',
            'attachments.*' => 'string', // These are now temp folder IDs/UUIDs
        ]);

        $prefix = ControlNumberPrefix::findOrFail($validated['control_number_prefix_id']);
        $prefixCode = Str::upper($prefix->code);
        $yearTwo = substr((string) date('Y'), -2);
        $random = Str::upper(Str::random(6));
        $controlNumber = "{$prefixCode}-{$yearTwo}-{$random}";
        
        $disbursement = Disbursement::create([
            'control_number' => $controlNumber,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? '',
            'recommended_by' => $validated['recommended_by'] ?? null,
            'step' => 2, // Waiting for Accounting Head
            'status' => 'pending',
        ]);

        // Save items
        foreach ($validated['accounts'] as $account) {
            $disbursement->items()->create([
                'account_id' => $account['account_id'],
                'type' => $account['type'],
                'amount' => $account['amount'],
                'order_number' => $account['order_number'],
            ]);
        }

        // Handle Asynchronous Attachments
        if (!empty($validated['attachments'])) {
            foreach ($validated['attachments'] as $tempId) {
                $temporaryUpload = \App\Models\TemporaryUpload::where('folder', $tempId)->first();
                
                if ($temporaryUpload) {
                    $oldPath = 'attachments/tmp/' . $tempId . '/' . $temporaryUpload->filename;
                    $newFolder = 'attachments/' . date('Y/m/d');
                    $newPath = $newFolder . '/' . $temporaryUpload->filename;

                    // Move file from tmp to permanent storage
                    if (Storage::disk('public')->exists($oldPath)) {
                        Storage::disk('public')->move($oldPath, $newPath);
                        
                        $disbursement->attachments()->create([
                            'file_path' => $newPath,
                            'file_name' => $temporaryUpload->filename,
                            'file_type' => Storage::disk('public')->mimeType($newPath),
                        ]);

                        // Cleanup tmp folder
                        Storage::disk('public')->deleteDirectory('attachments/tmp/' . $tempId);
                        $temporaryUpload->delete();
                    }
                }
            }
        }

        // Tracking
        $handledBy = Auth::user()->id;
        DisbursementTracking::create([
            'handled_by' => $handledBy,
            'disbursement_id' => $disbursement->id,
            'step' => 1,
            'role' => 'accounting assistant',
            'action' => 'approved',
            'remarks' => 'Voucher generated and approved by assistant.',
            'acted_at' => now(),
        ]);

        // Notify Accounting Head(s) - Step 2
        $this->notifyUsersWithRole('accounting head', 'New Disbursement for Review', "A new disbursement ({$disbursement->control_number}) has been generated and requires your approval.", route('disbursement.view', ['id' => $disbursement->id]));
       
        return response()->json($disbursement);
    }

    public function approve(Request $request, $id)
    {
        $disbursement = Disbursement::findOrFail($id);
        $user = Auth::user();
        $roles = $user->getRoleNames()->toArray();
        
        // Step 1 was Assistant (Auto-approved on store)
        $stepRoles = [
            2 => 'accounting head',
            3 => 'auditor',
            4 => 'SVP',
        ];

        $currentStep = $disbursement->step;
        
        // Check if user has the required role for the current step
        if (!in_array('admin', $roles) && (!isset($stepRoles[$currentStep]) || !in_array($stepRoles[$currentStep], $roles))) {
            return response()->json(['message' => 'Unauthorized for this step.'], 403);
        }

        $nextStep = $currentStep + 1;
        $status = $disbursement->status;

        // If SVP approves (Step 4), mark as approved (Step 5)
        if ($currentStep === 4) {
            $status = 'approved';
        }

        $disbursement->update([
            'step' => $nextStep,
            'status' => $status
        ]);

        DisbursementTracking::create([
            'handled_by' => $user->id,
            'disbursement_id' => $disbursement->id,
            'step' => $currentStep,
            'role' => $stepRoles[$currentStep] ?? 'admin',
            'action' => 'approved',
            'remarks' => $request->remarks ?? 'Approved.',
            'acted_at' => now(),
        ]);

        // Trigger Notifications
        if (isset($stepRoles[$nextStep])) {
            $this->notifyUsersWithRole($stepRoles[$nextStep], 'Review Required', "Disbursement {$disbursement->control_number} needs your approval.", route('disbursement.view', ['id' => $disbursement->id]));
        } elseif ($status === 'approved') {
            $initiator = $disbursement->tracking()->where('step', 1)->first();
            if ($initiator) {
                Notification::create([
                    'user_id' => $initiator->handled_by,
                    'title' => 'Disbursement Approved',
                    'message' => "Your disbursement ({$disbursement->control_number}) has been fully approved.",
                    'link' => route('disbursement.view', ['id' => $disbursement->id])
                ]);
            }
        }

        return response()->json([
            'message' => 'Disbursement approved successfully.',
            'disbursement' => $disbursement
        ]);
    }

    public function decline(Request $request, $id)
    {
        $disbursement = Disbursement::findOrFail($id);
        $user = Auth::user();
        $roles = $user->getRoleNames()->toArray();
        
        $stepRoles = [
            2 => 'accounting head',
            3 => 'auditor',
            4 => 'SVP',
        ];

        $currentStep = $disbursement->step;
        
        if (!in_array('admin', $roles) && (!isset($stepRoles[$currentStep]) || !in_array($stepRoles[$currentStep], $roles))) {
            return response()->json(['message' => 'Unauthorized for this step.'], 403);
        }

        $disbursement->update([
            'status' => 'rejected'
        ]);

        DisbursementTracking::create([
            'handled_by' => $user->id,
            'disbursement_id' => $disbursement->id,
            'step' => $currentStep,
            'role' => $stepRoles[$currentStep] ?? 'admin',
            'action' => 'rejected',
            'remarks' => $request->remarks ?? 'Declined.',
            'acted_at' => now(),
        ]);

        // Notify Initiator
        $initiator = $disbursement->tracking()->where('step', 1)->first();
        if ($initiator) {
            $reason = $request->remarks ?? 'No reason provided.';
            Notification::create([
                'user_id' => $initiator->handled_by,
                'title' => 'Disbursement Declined',
                'message' => "Your disbursement ({$disbursement->control_number}) was declined. Reason: {$reason}",
                'link' => route('disbursement.view', ['id' => $disbursement->id])
            ]);
        }

        return response()->json([
            'message' => 'Disbursement declined successfully.',
            'disbursement' => $disbursement
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
                'title' => $title,
                'message' => $message,
                'link' => $link
            ]);
        }
    }


}

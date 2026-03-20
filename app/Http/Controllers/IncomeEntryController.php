<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Journal;
use App\Models\Notification;
use App\Models\User;
use App\Models\JournalTracking;
use App\Models\ControlNumberPrefix;
use App\Models\AuditTrail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class IncomeEntryController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->query('date', now()->format('Y-m-d'));
        
        $entries = Journal::with(['items.account'])
            ->where('type', 'Manual Income Entry')
            ->whereDate('created_at', $date)
            ->get();

        // Fetch all manual income entries to show indicators on the calendar
        $allEntries = Journal::where('type', 'Manual Income Entry')
            ->select('created_at', 'status', 'proposed_data')
            ->get();

        $dayStatuses = $allEntries->mapWithKeys(function ($entry) {
            $day = Carbon::parse($entry->created_at)->format('Y-m-d');
            return [$day => [
                'has_entry' => true,
                'pending_edit' => $entry->status === 'pending' && !empty($entry->proposed_data),
            ]];
        });

        $prefixes = ControlNumberPrefix::orderBy('sort_order')->get();
        
        return Inertia::render('Income Entry/index', [
            'entries' => $entries,
            'prefixes' => $prefixes,
            'selectedDate' => $date,
            'dayStatuses' => $dayStatuses,
            'accounts' => \App\Models\Account::orderBy('account_code')->get(),
        ]);
    }


    public function store(Request $request)
    {
        // Handle JSON accounts if sent as a string (common with FormData)
        if ($request->has('accounts') && is_string($request->accounts)) {
            $request->merge(['accounts' => json_decode($request->accounts, true)]);
        }

        $validated = $request->validate([
            'title'                    => 'required|string|max:255',
            'description'              => 'required|string',
            'date'                     => 'required|date',
            'control_number_prefix_id' => 'required|exists:control_number_prefixes,id',
            'accounts'                 => 'required|array|min:1',
            'accounts.*.account_id'    => 'required|exists:accounts,id',
            'accounts.*.type'          => 'required|in:debit,credit',
            'accounts.*.amount'        => 'required|numeric',
        ]);

        // Constraint: Only one manual income entry per day
        $exists = Journal::where('type', 'Manual Income Entry')
            ->whereDate('created_at', $validated['date'])
            ->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['date' => 'A manual income entry already exists for this date.']);
        }

        $isToday = Carbon::parse($validated['date'])->isToday();

        DB::transaction(function () use ($validated, $isToday) {
            $stepFlow = $isToday 
                ? Journal::manualIncomeStepFlow()
                : [
                    ['step' => 1, 'role' => 'accounting head'],
                    ['step' => 2, 'role' => 'auditor'],
                ];

            $journal = Journal::create([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'type' => 'Manual Income Entry',
                'status' => $isToday ? 'approved' : 'pending',
                'current_step' => $isToday ? 2 : 2, // Both skip to finish or Auditor step
                'step_flow' => $stepFlow,
                'control_number' => Journal::generateControlNumber($validated['control_number_prefix_id']),
                'created_at' => $validated['date'],
            ]);

            foreach ($validated['accounts'] as $index => $item) {
                $journal->items()->create([
                    'account_id' => $item['account_id'],
                    'type' => $item['type'],
                    'amount' => $item['amount'],
                    'order_number' => $index + 1,
                ]);
            }

            JournalTracking::create([
                'handled_by' => Auth::id(),
                'journal_id' => $journal->id,
                'step' => 1,
                'role' => 'accounting head',
                'action' => $isToday ? 'approved' : 'prepared',
                'remarks' => $isToday ? 'Income entry recorded and auto-approved.' : 'Income entry recorded, pending Auditor approval.',
                'acted_at' => now(),
            ]);

            AuditTrail::log('income_entry_recorded', "Manual Income Entry recorded: {$journal->control_number}", Auth::id(), Journal::class, $journal->id);

            if (!$isToday) {
                // Notify Auditors
                $auditors = User::role('auditor')->get();
                foreach ($auditors as $auditor) {
                    Notification::create([
                        'user_id' => $auditor->id,
                        'title'   => 'New Income Entry',
                        'message' => "Accounting Head has recorded a historical income entry ({$journal->control_number}).",
                        'link'    => route('income-entry.index') . "?date=" . $journal->created_at->format('Y-m-d'),
                    ]);
                }
            }
        });

        return back()->with('success', 'Income entry recorded successfully.');
    }


    public function update(Request $request, $id)
    {
        $journal = Journal::findOrFail($id);
        // Handle JSON accounts
        if ($request->has('accounts') && is_string($request->accounts)) {
            $request->merge(['accounts' => json_decode($request->accounts, true)]);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'description' => 'required|string|max:255',
            'accounts' => 'required|array|min:2',
            'accounts.*.account_id' => 'required|exists:accounts,id',
            'accounts.*.type' => 'required|in:debit,credit',
            'accounts.*.amount' => 'required|numeric|min:0',
        ]);

        $isToday = Carbon::parse($journal->created_at)->isToday();

        if ($isToday) {
            // Immediate update for today's entries
            DB::transaction(function () use ($journal, $validated) {
                $journal->update([
                    'title' => $validated['title'],
                    'description' => $validated['description'],
                ]);

                $journal->items()->delete();
                foreach ($validated['accounts'] as $index => $item) {
                    $journal->items()->create([
                        'account_id' => $item['account_id'],
                        'type' => $item['type'],
                        'amount' => $item['amount'],
                        'order_number' => $index + 1,
                    ]);
                }

                AuditTrail::log('income_entry_updated', "Manual Income Entry updated: {$journal->control_number}", Auth::id(), Journal::class, $journal->id);
            });

            return back()->with('success', 'Income entry updated successfully.');
        } else {
            // Historical Entry: Send edit request to Auditor
            // We'll update the step_flow to include Auditor for this specific request
            $editStepFlow = [
                ['step' => 1, 'role' => 'accounting head'],
                ['step' => 2, 'role' => 'auditor'], // Added for approval
            ];

            $journal->update([
                'proposed_data' => [
                    'title' => $validated['title'],
                    'description' => $validated['description'],
                    'accounts' => $validated['accounts'],
                ],
                'status' => 'pending',
                'current_step' => 2, // Skip to Auditor
                'step_flow' => $editStepFlow,
            ]);

            JournalTracking::create([
                'journal_id' => $journal->id,
                'handled_by' => Auth::id(),
                'step'       => 1,
                'role'       => 'accounting head',
                'action'     => 'edit_request',
                'remarks'    => 'Requested historical edit. Pending Auditor approval.',
                'acted_at'   => now(),
            ]);

            AuditTrail::log('income_entry_edit_requested', "Manual Income Entry edit request sent: {$journal->control_number}", Auth::id(), Journal::class, $journal->id);

            // Notify Auditors
            $auditors = User::role('auditor')->get();
            foreach ($auditors as $auditor) {
                Notification::create([
                    'user_id' => $auditor->id,
                    'title'   => 'New Edit Request',
                    'message' => "Accounting Head has requested to edit a previous income entry for ({$journal->created_at->format('Y-m-d')}).",
                    'link'    => route('income-entry.index') . "?date=" . $journal->created_at->format('Y-m-d'),
                ]);
            }

            return back()->with('success', 'Edit request has been sent to the Auditor for approval.');
        }
    }
}

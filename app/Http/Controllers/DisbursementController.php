<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Disbursement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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

        // Add total_amount as a computed field by summing disbursement_items
        $query->addSelect([
            'disbursements.*',
            DB::raw('(SELECT COALESCE(SUM(amount), 0) FROM disbursement_items WHERE disbursement_items.disbursement_id = disbursements.id) as total_amount')
        ]);

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

        // Calculate statistics
        $statistics = $this->calculateStatistics();

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
            'statistics' => $statistics,
        ]);
    }

    public function show($id){
        $disbursement = Disbursement::with('items')->findOrFail($id);
        return response()->json([
            'disbursement' => $disbursement
        ]);
    }

    public function store(Request $request){
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            
            //Accoutns row
            'accounts' => 'required|array|min:1',
            'accounts.*.account_id' => 'required|exists:accounts,id',
            'accounts.*.type' => 'required|in:debit,credit',
            'accounts.*.amount' => 'required|numeric|min:0',
            'accounts.*.order_number' => 'required|integer|min:1',
        ]);

        $controlNumber = 'DV-' . date('Y') . '-' . Str::upper(Str::random(6));
        // DV-2026-A9XKQ2

        $disbursement = Disbursement::create([
            'control_number' => $controlNumber,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'step' => 1,
            'status' => 'pending',
        ]);

        $disbursement->items()->create([
            'account_id' => $validated['account_id'],
            'type' => $validated['type'],
            'amount' => $validated['amount'],
            'order_number' => $validated['order_number'],
        ]);
        return response()->json($disbursement);
    }

    /**
     * Calculate statistics for disbursements
     */
    private function calculateStatistics(): array
    {
        $statistics = [
            'total' => Disbursement::count(),
            'pending' => Disbursement::where('status', 'pending')->count(),
            'approved' => Disbursement::where('status', 'approved')->count(),
            'rejected' => Disbursement::where('status', 'rejected')->count(),
        ];

        return $statistics;
    }
}

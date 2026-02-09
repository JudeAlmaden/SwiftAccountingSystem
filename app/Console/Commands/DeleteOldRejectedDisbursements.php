<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Disbursement;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class DeleteOldRejectedDisbursements extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'disbursements:cleanup-rejected';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete rejected disbursements older than 30 days along with their attachments';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $thirtyDaysAgo = Carbon::now()->subDays(30);
        
        // Find rejected disbursements older than 30 days
        $oldRejectedDisbursements = Disbursement::where('status', 'rejected')
            ->where('updated_at', '<', $thirtyDaysAgo)
            ->with('attachments')
            ->get();

        if ($oldRejectedDisbursements->isEmpty()) {
            $this->info('No rejected disbursements found that are older than 30 days.');
            return Command::SUCCESS;
        }

        $count = $oldRejectedDisbursements->count();
        $this->info("Found {$count} rejected disbursement(s) to delete.");

        foreach ($oldRejectedDisbursements as $disbursement) {
            // Delete physical attachment files from storage
            foreach ($disbursement->attachments as $attachment) {
                if (Storage::disk('public')->exists($attachment->file_path)) {
                    Storage::disk('public')->delete($attachment->file_path);
                    $this->line("  - Deleted file: {$attachment->file_name}");
                }
            }

            // Delete the disbursement (cascade will delete items, tracking, and attachment records)
            $controlNumber = $disbursement->control_number;
            $disbursement->delete();
            $this->info("  ✓ Deleted disbursement: {$controlNumber}");
        }

        $this->newLine();
        $this->info("Successfully deleted {$count} rejected disbursement(s) and their attachments.");
        
        return Command::SUCCESS;
    }
}

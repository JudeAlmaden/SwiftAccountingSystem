<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Journal;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class DeleteOldRejectedJournals extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'journals:cleanup-rejected';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete rejected journals older than 30 days along with their attachments';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $thirtyDaysAgo = Carbon::now()->subDays(30);

        // Find rejected journals older than 30 days
        $oldRejectedJournals = Journal::where('status', 'rejected')
            ->where('updated_at', '<', $thirtyDaysAgo)
            ->with('attachments')
            ->get();

        if ($oldRejectedJournals->isEmpty()) {
            $this->info('No rejected journals found that are older than 30 days.');
            return Command::SUCCESS;
        }

        $count = $oldRejectedJournals->count();
        $this->info("Found {$count} rejected journal(s) to delete.");

        foreach ($oldRejectedJournals as $journal) {
            // Delete physical attachment files from storage
            foreach ($journal->attachments as $attachment) {
                if (Storage::disk('public')->exists($attachment->file_path)) {
                    Storage::disk('public')->delete($attachment->file_path);
                    $this->line("  - Deleted file: {$attachment->file_name}");
                }
            }

            // Delete the journal (cascade will delete items, tracking, and attachment records)
            $controlNumber = $journal->control_number;
            $journal->delete();
            $this->info("  ✓ Deleted journal: {$controlNumber}");
        }

        $this->newLine();
        $this->info("Successfully deleted {$count} rejected journal(s) and their attachments.");

        return Command::SUCCESS;
    }
}

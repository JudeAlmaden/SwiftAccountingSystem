<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class PruneTemporaryUploads extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'uploads:prune';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Remove temporary uploads older than 24 hours';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting pruning of temporary uploads...');

        $uploads = \App\Models\TemporaryUpload::where('created_at', '<', now()->subHours(24))->get();
        $count = $uploads->count();

        foreach ($uploads as $upload) {
            $folder = $upload->folder;

            // Delete the entire unique folder for this temp upload
            if (\Illuminate\Support\Facades\Storage::disk('public')->exists('attachments/tmp/'.$folder)) {
                \Illuminate\Support\Facades\Storage::disk('public')->deleteDirectory('attachments/tmp/'.$folder);
            }

            $upload->delete();
        }

        $this->info("Successfully pruned {$count} temporary uploads.");
    }
}

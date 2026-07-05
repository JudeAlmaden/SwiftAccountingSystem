<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    /**
     * Download or view a journal attachment.
     */
    public function download(Request $request, $id)
    {
        $attachment = \App\Models\JournalAttachment::findOrFail($id);

        if (! Storage::disk('public')->exists($attachment->file_path)) {
            abort(404, 'File not found on disk.');
        }

        return Storage::disk('public')->download($attachment->file_path, $attachment->file_name);
    }
}

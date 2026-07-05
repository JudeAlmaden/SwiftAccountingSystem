<?php

namespace App\Http\Controllers;

use App\Models\TemporaryUpload;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TemporaryUploadController extends Controller
{
    /**
     * Upload a file to temporary storage.
     */
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,pdf,docx,doc,xlsx,xls|max:10240', // 10MB limit
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filename = $file->getClientOriginalName();
            $folder = uniqid().'-'.now()->timestamp;

            // Store in a unique temporary folder
            $path = $file->storeAs('attachments/tmp/'.$folder, $filename, 'public');

            TemporaryUpload::create([
                'folder' => $folder,
                'filename' => $filename,
            ]);

            return response()->json([
                'id' => $folder, // We use the folder name as the unique id
                'filename' => $filename,
            ]);
        }

        return response()->json(['error' => 'No file uploaded'], 400);
    }

    /**
     * Revert/Delete a temporary upload.
     */
    public function revert(Request $request)
    {
        $folder = $request->getContent(); // Standard FilePond/Async revert often sends raw string

        $temporaryUpload = TemporaryUpload::where('folder', $folder)->first();

        if ($temporaryUpload) {
            Storage::disk('public')->deleteDirectory('attachments/tmp/'.$folder);
            $temporaryUpload->delete();

            return response()->json(['message' => 'File reverted successfully']);
        }

        return response()->json(['error' => 'File not found'], 404);
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notification;
use App\Models\Journal;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index()
    {
        $notifications = Notification::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json([
            'notifications' => $notifications,
            ...self::getSidebarCounts(Auth::user())
        ]);
    }

    /**
     * Get all sidebar notification counts for a user.
     */
    public static function getSidebarCounts($user): array
    {
        if (!$user) return [];
        
        return [
            'unread_notifications_count' => Notification::where('user_id', $user->id)->where('is_read', false)->count(),
            'pending_vouchers_count' => Journal::pendingForUser($user)->count(),
        ];
    }

    public function markAsRead($id)
    {
        $notification = Notification::where('user_id', Auth::id())->findOrFail($id);
        $notification->update(['is_read' => true]);
        
        $unreadCount = Notification::where('user_id', Auth::id())->where('is_read', false)->count();
        broadcast(new \App\Events\NotificationRead(Auth::id(), $unreadCount));
        
        return response()->json(['success' => true, 'unread_count' => $unreadCount]);
    }

    public function markAllAsRead()
    {
        Notification::where('user_id', Auth::id())
            ->where('is_read', false)
            ->update(['is_read' => true]);
        
        $unreadCount = 0;
        broadcast(new \App\Events\NotificationRead(Auth::id(), $unreadCount));
            
        return response()->json(['success' => true, 'unread_count' => $unreadCount]);
    }
}

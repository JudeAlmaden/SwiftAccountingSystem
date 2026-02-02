interface StatusIndicatorProps {
    status: 'active' | 'inactive';
    label?: string;
    showLabel?: boolean;
}

export function StatusIndicator({ status, label, showLabel = true }: StatusIndicatorProps) {
    const displayLabel = label || (status.charAt(0).toUpperCase() + status.slice(1));
    
    return (
        <span className="inline-flex items-center gap-2 text-xs font-medium">
            <span className={status === 'active' ? 'status-dot-active' : 'status-dot-inactive'}></span>
            {showLabel && displayLabel}
        </span>
    );
}

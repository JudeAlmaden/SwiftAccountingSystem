import { Card } from '@/components/ui/card';
import { useState, useRef, useEffect } from 'react';
import { FileText, Image as ImageIcon, X, Paperclip, FileIcon, Plus, Download, Loader2, AlertCircle } from 'lucide-react';
import { JournalAttachment as DBAttachment } from '@/types/database';
import { DottedSeparator } from '@/components/dotted-line';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';

interface FileWithStatus {
    file: File;
    status: 'uploading' | 'completed' | 'error';
    tempId?: string;
    errorMessage?: string;
}

interface JournalAttachmentProps {
    onFilesChange?: (tempIds: string[]) => void;
    attachments?: DBAttachment[];
    mode?: 'generate' | 'view';
}

export function JournalAttachment({ onFilesChange, attachments = [], mode = 'generate' }: JournalAttachmentProps) {
    const [filesWithStatus, setFilesWithStatus] = useState<FileWithStatus[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const ITEMS_PER_PAGE = 5;

    // Get CSRF token for async uploads
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    const token = meta?.content || '';

    const uploadFile = async (file: File, index: number) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/attachments/upload-temp', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': token,
                    'Accept': 'application/json',
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle Laravel validation errors (422)
                if (response.status === 422 && data.errors?.file) {
                    throw new Error(data.errors.file[0]);
                }

                // Show status code for other errors (like 413 Payload Too Large)
                throw new Error(data.error || data.message || `Upload failed (Status: ${response.status})`);
            }

            setFilesWithStatus(prev => {
                const next = [...prev];
                if (next[index]) {
                    next[index] = { ...next[index], status: 'completed', tempId: data.id };
                }
                return next;
            });
        } catch (error: any) {
            setFilesWithStatus(prev => {
                const next = [...prev];
                if (next[index]) {
                    next[index] = { ...next[index], status: 'error', errorMessage: error.message };
                }
                return next;
            });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(Array.from(e.target.files));
        }
    };

    const processFiles = (newFiles: File[]) => {
        const startIndex = filesWithStatus.length;

        const newWithStatus: FileWithStatus[] = newFiles.map(f => ({
            file: f,
            status: 'uploading'
        }));

        setFilesWithStatus(prev => [...prev, ...newWithStatus]);

        newFiles.forEach((f, i) => {
            uploadFile(f, startIndex + i);
        });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            processFiles(files);
        }
    };

    useEffect(() => {
        if (onFilesChange && mode === 'generate') {
            const completedIds = filesWithStatus
                .filter(f => f.status === 'completed' && f.tempId)
                .map(f => f.tempId as string);
            onFilesChange(completedIds);
        }
    }, [filesWithStatus, onFilesChange, mode]);

    const removeFile = async (index: number) => {
        const target = filesWithStatus[index];

        // If it was already uploaded, notify server to revert
        if (target.status === 'completed' && target.tempId) {
            try {
                await fetch('/attachments/revert-temp', {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN': token,
                    },
                    body: target.tempId
                });
            } catch (e) {
                console.error('Failed to revert upload', e);
            }
        }

        setFilesWithStatus(prev => prev.filter((_, i) => i !== index));
    };

    const getFileIcon = (fileName: string, fileType?: string) => {
        const lowerName = fileName.toLowerCase();
        if (fileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/.test(lowerName))
            return <ImageIcon className="h-4 w-4 text-blue-500" />;
        if (fileType === 'application/pdf' || lowerName.endsWith('.pdf'))
            return <FileText className="h-4 w-4 text-red-500" />;
        if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls'))
            return <FileIcon className="h-4 w-4 text-green-600" />;
        if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc'))
            return <FileIcon className="h-4 w-4 text-blue-600" />;
        return <FileIcon className="h-4 w-4 text-gray-500" />;
    };

    const formatSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const hasFiles = filesWithStatus.length > 0 || attachments.length > 0;

    // Pagination logic
    const totalPages = Math.ceil(attachments.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentAttachments = attachments.slice(startIndex, endIndex);

    // Reset to page 1 when modal opens
    useEffect(() => {
        if (isModalOpen) {
            setCurrentPage(1);
        }
    }, [isModalOpen]);

    // View mode with modal
    if (mode === 'view') {
        return (
            <>
                <Card className="bg-card p-4">
                    <div>
                        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                            Attachments
                        </h3>
                        <p className="text-xs text-muted-foreground py-2">
                            Supporting documents for this journal
                        </p>
                    </div>
                    <DottedSeparator className='-mt-4' />

                    {attachments.length > 0 ? (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full py-2.5 px-4 rounded-lg border-[1.5px] border-green-700 bg-white hover:bg-green-50 transition-colors text-green-600 font-medium text-xs"
                        >
                            View attachments
                        </button>
                    ) : (
                        <div className="text-center py-3 mt-2 opacity-60 italic">
                            <p className="text-xs text-muted-foreground">No files attached</p>
                        </div>
                    )}
                </Card>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="w-[600px] h-[500px] flex flex-col p-0 gap-0 border-0 [&>button]:text-white [&>button]:hover:text-white/80">
                        <div className="bg-[#13a825] px-6 py-4 rounded-t-lg relative">
                            <div className="flex items-center gap-2 text-white">
                                <Paperclip className="h-5 w-5" />
                                <h2 className="text-lg font-semibold">Attachments</h2>
                            </div>
                            <p className="text-sm text-white/90 mt-1">
                                Supporting documents for this journal
                            </p>
                        </div>
                        <div className="flex-1 space-y-3 overflow-hidden px-6 py-4">
                            {currentAttachments.map((attachment) => (
                                <div key={attachment.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-muted/10 hover:bg-muted/30 transition-colors group">
                                    <div className="shrink-0">
                                        {getFileIcon(attachment.file_name, attachment.file_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate text-foreground">{attachment.file_name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">{attachment.file_type.split('/')[1] || 'FILE'}</p>
                                    </div>
                                    <a
                                        href={`/attachments/download/${attachment.id}`}
                                        className="p-1.5 rounded-md hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
                                        title="Download"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                    </a>
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t">
                                <p className="text-xs text-muted-foreground">
                                    Page {currentPage} of {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-md border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-md border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    // Generate mode (original implementation)

    return (
        <Card className="border-border bg-card p-6 flex flex-col">
            <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Attachments
                </h3>
                <p className="text-xs text-muted-foreground mt-3 text-balance">
                    {mode === 'generate' ? 'Upload supporting documents (PDF, Images, Excel, Word)' : 'Supporting documents for this journal'}
                </p>
            </div>
            <DottedSeparator className='-mt-2 pb-2' />

            {mode === 'generate' && (
                <div className="mb-4 overflow-hidden">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
                            cursor-pointer transition-all duration-400 ease-in-out
                            ${!hasFiles
                                ? `border-2 border-dashed rounded-lg p-4 ${isDragging ? 'border-green-500 bg-green-50' : 'border-green-500 hover:border-green-600 hover:bg-green-50/50'}`
                                : `border rounded-lg px-4 py-2 ${isDragging ? 'border-green-500 bg-green-50' : 'border-green-500 hover:bg-green-50/50 hover:border-green-600'}`
                            }
                        `}
                    >
                        <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            accept="image/*,.pdf,.docx,.doc,.xlsx,.xls"
                        />
                        <div className={`
                            flex items-center justify-center gap-2 transition-all duration-400 ease-in-out
                            ${!hasFiles ? 'flex-col' : 'flex-row'}
                        `}>
                            <div className={`
                                rounded-full bg-green-100 flex items-center justify-center transiti eaall duration-400 ease-in-out
                                ${!hasFiles ? 'h-8 w-8 hover:scale-110' : 'h-4 w-4'}
                            `}>
                                <Plus className={`text-green-600 transition-all duration-400 ease-in-out ${!hasFiles ? 'h-4 w-4' : 'h-4 w-4'}`} />
                            </div>
                            <div className={`transition-all duration-400 ease-in-out ${!hasFiles ? 'text-center' : ''}`}>
                                <p className={`font-semibold text-foreground transition-all duration-400 ease-in-out ${!hasFiles ? 'text-sm' : 'text-sm'}`}>
                                    {!hasFiles ? 'Upload Files' : 'Add More Files'}
                                </p>
                                {!hasFiles && (
                                    <p className="text-xs text-muted-foreground transition-opacity duration-400 ease-in-out">
                                        Click to browse or drag and drop
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2 flex-1 overflow-y-auto max-h-[350px] pr-1">
                {/* Existing Attachments (View Mode) */}
                {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-3 p-2 rounded-lg border bg-muted/10 hover:bg-muted/30 transition-colors group">
                        <div className="shrink-0">
                            {getFileIcon(attachment.file_name, attachment.file_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium truncate text-foreground">{attachment.file_name}</p>
                            <p className="text-[9px] text-muted-foreground uppercase">{attachment.file_type.split('/')[1] || 'FILE'}</p>
                        </div>
                        <a
                            href={`/attachments/download/${attachment.id}`}
                            className="p-1.5 rounded-md hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
                            title="Download"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Download className="h-3.5 w-3.5" />
                        </a>
                    </div>
                ))}

                {/* Selected Files with Status (Generate Mode) */}
                {mode === 'generate' && filesWithStatus.map((item, index) => (
                    <div
                        key={`${item.file.name}-${index}`}
                        className={`
                            flex items-center gap-2 p-2 rounded-lg border transition-all
                            ${item.status === 'error'
                                ? 'bg-red-50 border-red-200'
                                : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-sm'
                            }
                        `}
                    >
                        <div className="shrink-0">
                            {item.status === 'uploading' ? (
                                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                            ) : item.status === 'error' ? (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                            ) : (
                                getFileIcon(item.file.name, item.file.type)
                            )}
                        </div>
                        <div className="flex-1 min-w-0 mt-px">
                            <p className="text-xs font-medium text-foreground truncate">
                                {item.file.name}
                            </p>
                            <p className={`text-[10px] ${item.status === 'error' ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                {item.status === 'uploading' ? 'Uploading...' :
                                    item.status === 'error' ? (item.errorMessage || 'Upload failed') :
                                        formatSize(item.file.size)}
                            </p>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                removeFile(index);
                            }}
                            className="shrink-0 p-1 rounded-md hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                            title="Remove file"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}

                {attachments.length === 0 && filesWithStatus.length === 0 && (
                    <div className="text-center py-5 opacity-60 italic">
                        <p className="text-xs text-muted-foreground">No files attached.</p>
                    </div>
                )}
            </div>
        </Card>
    );
}

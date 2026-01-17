import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File as FileIcon, X, CheckCircle } from 'lucide-react';
import { Button } from './button';
import { Progress } from './progress';
import { cn } from './utils';

interface FileUploadProps {
    onFileSelect: (file: File) => Promise<void>;
    onRemove?: () => void;
    file?: { name: string; size: number };
    accept?: Record<string, string[]>;
    label?: string;
    loading?: boolean;
}

export function FileUpload({ onFileSelect, onRemove, file, accept, label, loading }: FileUploadProps) {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: async (acceptedFiles) => {
            if (acceptedFiles?.[0]) {
                await onFileSelect(acceptedFiles[0]);
            }
        },
        accept,
        maxFiles: 1,
        disabled: loading
    });

    if (file) {
        return (
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                </div>
                {onRemove && (
                    <Button variant="ghost" size="icon" onClick={onRemove} className="text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div
            {...getRootProps()}
            className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200",
                isDragActive
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800",
                loading && "opacity-50 cursor-not-allowed"
            )}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2 text-gray-500">
                {loading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                ) : (
                    <>
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-1">
                            <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium">{label || "Faylni yuklash"}</p>
                        <p className="text-xs">
                            {isDragActive ? "Shu yerga tashlang" : "Yoki bosing va tanlang"}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

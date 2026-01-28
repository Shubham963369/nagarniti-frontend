"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { uploadFile, UploadFolder } from "@/lib/api";
import { X, Upload, Loader2, FileText, File, Download } from "lucide-react";
import { cn } from "@/lib/utils";

// Allowed document types
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt"];
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

function getFileIcon(url: string) {
  const extension = url.split(".").pop()?.toLowerCase();
  if (extension === "pdf") {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  if (extension === "doc" || extension === "docx") {
    return <FileText className="h-5 w-5 text-blue-500" />;
  }
  if (extension === "xls" || extension === "xlsx") {
    return <FileText className="h-5 w-5 text-green-500" />;
  }
  return <File className="h-5 w-5 text-gray-500" />;
}

function getFileName(url: string): string {
  try {
    const urlPath = new URL(url).pathname;
    const parts = urlPath.split("/");
    return parts[parts.length - 1] || "Document";
  } catch {
    return url.split("/").pop() || "Document";
  }
}

interface DocumentUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: UploadFolder;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  disabled?: boolean;
  className?: string;
}

export function DocumentUpload({
  value = [],
  onChange,
  folder = "documents",
  maxFiles = 5,
  maxFileSize = 10,
  disabled = false,
  className,
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxFiles - value.length;
    if (remainingSlots <= 0) {
      alert(`Maximum ${maxFiles} documents allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);

    const uploadedUrls: string[] = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];

      // Validate file type
      const extension = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(extension) && !ALLOWED_MIME_TYPES.includes(file.type)) {
        alert(`${file.name} is not a supported document type. Allowed: PDF, DOC, DOCX, XLS, XLSX, TXT`);
        continue;
      }

      // Validate file size
      if (file.size > maxFileSize * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is ${maxFileSize}MB`);
        continue;
      }

      setUploadProgress(`Uploading ${i + 1}/${filesToUpload.length}...`);

      const url = await uploadFile(file, folder);
      if (url) {
        uploadedUrls.push(url);
      }
    }

    if (uploadedUrls.length > 0) {
      onChange([...value, ...uploadedUrls]);
    }

    setIsUploading(false);
    setUploadProgress("");

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeDocument = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Document list */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((url, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted rounded-lg group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {getFileIcon(url)}
                <span className="text-sm truncate">{getFileName(url)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(url, "_blank")}
                >
                  <Download className="h-4 w-4" />
                </Button>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                    onClick={() => removeDocument(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {value.length < maxFiles && !disabled && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            "hover:border-primary hover:bg-primary/5",
            isUploading && "pointer-events-none opacity-50"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_EXTENSIONS.join(",")}
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{uploadProgress}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-primary/10 rounded-full">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Click to upload documents</p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOC, DOCX, XLS, XLSX up to {maxFileSize}MB ({value.length}/{maxFiles})
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Single document upload variant
interface SingleDocumentUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: UploadFolder;
  maxFileSize?: number;
  disabled?: boolean;
  className?: string;
}

export function SingleDocumentUpload({
  value,
  onChange,
  folder = "documents",
  maxFileSize = 10,
  disabled = false,
  className,
}: SingleDocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension) && !ALLOWED_MIME_TYPES.includes(file.type)) {
      alert("Please select a valid document file (PDF, DOC, DOCX, XLS, XLSX, TXT)");
      return;
    }

    // Validate file size
    if (file.size > maxFileSize * 1024 * 1024) {
      alert(`File is too large. Maximum size is ${maxFileSize}MB`);
      return;
    }

    setIsUploading(true);
    const url = await uploadFile(file, folder);
    if (url) {
      onChange(url);
    }
    setIsUploading(false);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {value ? (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3 min-w-0">
            {getFileIcon(value)}
            <span className="text-sm truncate">{getFileName(value)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => window.open(value, "_blank")}
            >
              <Download className="h-4 w-4" />
            </Button>
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700"
                onClick={() => onChange(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            "hover:border-primary hover:bg-primary/5",
            isUploading && "pointer-events-none opacity-50",
            disabled && "pointer-events-none opacity-50"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_EXTENSIONS.join(",")}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-primary/10 rounded-full">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Click to upload document</p>
                <p className="text-xs text-muted-foreground">PDF, DOC, DOCX up to {maxFileSize}MB</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Document List Display (read-only)
interface DocumentListProps {
  documents: string[];
  className?: string;
}

export function DocumentList({ documents, className }: DocumentListProps) {
  if (!documents || documents.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {documents.map((url, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-3 bg-muted rounded-lg"
        >
          <div className="flex items-center gap-3 min-w-0">
            {getFileIcon(url)}
            <span className="text-sm truncate">{getFileName(url)}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => window.open(url, "_blank")}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

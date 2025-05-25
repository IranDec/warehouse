// src/components/common/file-upload-card.tsx
"use client";

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileText, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadCardProps {
  title: string;
  description: string;
  acceptedFileTypes?: string; // e.g., ".xlsx,.csv"
  onFileUpload: (file: File) => Promise<void>; 
  icon?: React.ReactNode;
  disabled?: boolean; // Added disabled prop
}

export function FileUploadCard({
  title,
  description,
  acceptedFileTypes = ".xlsx,.csv", 
  onFileUpload,
  icon = <UploadCloud className="h-12 w-12 text-primary" />,
  disabled = false, // Default to false
}: FileUploadCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const inputId = React.useId();


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = acceptedFileTypes.split(',').map(ext => ext.trim().substring(1));

      if (fileExtension && allowedExtensions.includes(fileExtension)) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
        toast({
          title: "Invalid File Type",
          description: `Please upload a file with one of the following extensions: ${allowedExtensions.join(', ')}`,
          variant: "destructive",
        });
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleRemoveFile = () => {
    if (disabled) return;
    setSelectedFile(null);
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) input.value = '';
  }

  const handleSubmit = async () => {
    if (disabled) return;
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      await onFileUpload(selectedFile);
      setSelectedFile(null); 
      const input = document.getElementById(inputId) as HTMLInputElement;
      if (input) input.value = '';
    } catch (error) {
      console.error("Upload error in FileUploadCard:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    event.stopPropagation();
  }, [disabled]);

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = acceptedFileTypes.split(',').map(ext => ext.trim().substring(1));

      if (fileExtension && allowedExtensions.includes(fileExtension)) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: `Please upload a file with one of a supported extension: ${allowedExtensions.join(', ')}`,
          variant: "destructive",
        });
      }
      event.dataTransfer.clearData();
    }
  }, [acceptedFileTypes, toast, disabled]);

  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300", disabled && "opacity-70 bg-muted/50")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          className={cn(
            "border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors",
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          )}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => !disabled && document.getElementById(inputId)?.click()}
        >
          <Input
            id={inputId}
            type="file"
            accept={acceptedFileTypes}
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled}
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <UploadCloud className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {disabled 
                ? "Upload disabled" 
                : <>Drag & drop your file here, or <span className="font-semibold text-primary">click to browse</span></>
              }
            </p>
            <p className="text-xs text-muted-foreground">Supports: {acceptedFileTypes.split(',').map(ext => ext.toUpperCase()).join(', ')}</p>
          </div>
        </div>

        {selectedFile && (
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-xs">{selectedFile.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="text-muted-foreground hover:text-destructive" disabled={disabled}>
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
        )}

        <Button onClick={handleSubmit} disabled={!selectedFile || isUploading || disabled} className="w-full">
          {isUploading ? "Processing..." : "Upload & Process File"}
        </Button>
      </CardContent>
    </Card>
  );
}

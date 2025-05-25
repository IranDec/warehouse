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
  onFileUpload: (file: File) => Promise<void>; // Simulate upload
  icon?: React.ReactNode;
}

export function FileUploadCard({
  title,
  description,
  acceptedFileTypes = ".xlsx,.csv",
  onFileUpload,
  icon = <UploadCloud className="h-12 w-12 text-primary" />
}: FileUploadCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    // Also reset the input field value if needed
    const input = document.getElementById('file-upload-input') as HTMLInputElement;
    if (input) input.value = '';
  }

  const handleSubmit = async () => {
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
      toast({
        title: "Upload Successful",
        description: `${selectedFile.name} has been processed. (Simulated)`,
      });
      setSelectedFile(null); // Clear selection after successful upload
      const input = document.getElementById('file-upload-input') as HTMLInputElement;
      if (input) input.value = '';
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: `Could not process ${selectedFile.name}. Please try again. (Simulated error)`,
        variant: "destructive",
      });
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if(file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.type === "text/csv") {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload an .xlsx or .csv file.",
          variant: "destructive",
        });
      }
      event.dataTransfer.clearData();
    }
  }, [toast]);

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => document.getElementById('file-upload-input')?.click()}
        >
          <Input
            id="file-upload-input"
            type="file"
            accept={acceptedFileTypes}
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <UploadCloud className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag & drop your file here, or <span className="font-semibold text-primary">click to browse</span>
            </p>
            <p className="text-xs text-muted-foreground">Supports: {acceptedFileTypes.split(',').join(', ')}</p>
          </div>
        </div>

        {selectedFile && (
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-xs">{selectedFile.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="text-muted-foreground hover:text-destructive">
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
        )}

        <Button onClick={handleSubmit} disabled={!selectedFile || isUploading} className="w-full">
          {isUploading ? "Uploading..." : "Upload File"}
        </Button>
      </CardContent>
    </Card>
  );
}

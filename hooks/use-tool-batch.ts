"use client";

import { useCallback, useEffect, useState } from "react";
import { LARGE_BATCH_WARNING, validateImageFile } from "@/lib/image/validate";

export type BatchItemStatus = "queued" | "processing" | "done" | "error";

export interface BatchResult {
  blob: Blob;
  name: string;
  size: number;
}

export interface BatchItem {
  id: string;
  file: File;
  /** Object URL used for the thumbnail; revoked when the item is removed. */
  url: string;
  status: BatchItemStatus;
  errorKey?: "corrupt" | "memory" | "unknown";
  /** Present once a tool has processed the image. */
  result?: BatchResult;
}

export interface ValidationError {
  id: string;
  key: "fileTooLarge" | "tooManyFiles" | "unsupported";
  name?: string;
}

export interface UseToolBatch {
  items: BatchItem[];
  errors: ValidationError[];
  showBatchWarning: boolean;
  doneResults: { name: string; blob: Blob }[];
  addFiles: (files: File[]) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  updateItem: (id: string, patch: Partial<BatchItem>) => void;
}

const MAX_BATCH = 50; // mirrored from config/limits.ts (DEFAULT, owner undecided)

/**
 * Shared batch state for all image tools: validated file list, object-URL
 * lifecycle, validation errors, and per-item status updates from the
 * processing pipeline.
 */
export function useToolBatch(): UseToolBatch {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [showBatchWarning, setShowBatchWarning] = useState(false);

  // Revoke any object URLs still open when the page unloads.
  useEffect(() => {
    return () => {
      setItems((current) => {
        for (const item of current) URL.revokeObjectURL(item.url);
        return current;
      });
    };
  }, []);

  const addFiles = useCallback((files: File[]) => {
    const newErrors: ValidationError[] = [];
    setItems((current) => {
      let capacity = MAX_BATCH - current.length;
      if (capacity <= 0) {
        newErrors.push({
          id: crypto.randomUUID(),
          key: "tooManyFiles",
        });
        return current;
      }
      const accepted: BatchItem[] = [];
      for (const file of files) {
        const validation = validateImageFile(file);
        if (!validation.ok) {
          newErrors.push({
            id: crypto.randomUUID(),
            key: validation.reason,
            name: file.name,
          });
          continue;
        }
        if (capacity <= 0) {
          newErrors.push({ id: crypto.randomUUID(), key: "tooManyFiles" });
          break;
        }
        capacity--;
        accepted.push({
          id: crypto.randomUUID(),
          file,
          url: URL.createObjectURL(file),
          status: "queued",
        });
      }
      const next = [...current, ...accepted];
      setShowBatchWarning(next.length > LARGE_BATCH_WARNING);
      return next;
    });
    setErrors(newErrors);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => {
      const item = current.find((entry) => entry.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return current.filter((entry) => entry.id !== id);
    });
    setShowBatchWarning(false);
  }, []);

  const clearAll = useCallback(() => {
    setItems((current) => {
      for (const item of current) URL.revokeObjectURL(item.url);
      return [];
    });
    setErrors([]);
    setShowBatchWarning(false);
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<BatchItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }, []);

  const doneResults = items
    .filter((item) => item.result)
    .map((item) => ({ name: item.result!.name, blob: item.result!.blob }));

  return {
    items,
    errors,
    showBatchWarning,
    doneResults,
    addFiles,
    removeItem,
    clearAll,
    updateItem,
  };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  /** Object URL for the processed result (used by the compare slider). */
  resultUrl?: string;
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
  resetProcessing: () => void;
}

const MAX_BATCH = 50; // mirrored from config/limits.ts (DEFAULT, owner undecided)

function revokeItem(item: BatchItem): void {
  URL.revokeObjectURL(item.url);
  if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
}

/**
 * Shared batch state for all image tools: validated file list, object-URL
 * lifecycle, validation errors, and per-item status updates from the
 * processing pipeline.
 */
export function useToolBatch(): UseToolBatch {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [showBatchWarning, setShowBatchWarning] = useState(false);

  // Mirror for synchronous reads (addFiles) and unmount cleanup — calling
  // setState inside the unmount cleanup would be discarded by React.
  const itemsRef = useRef<BatchItem[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) revokeItem(item);
    };
  }, []);

  const addFiles = useCallback((files: File[]) => {
    const current = itemsRef.current;
    const capacity = MAX_BATCH - current.length;
    const newErrors: ValidationError[] = [];
    const accepted: BatchItem[] = [];

    if (capacity <= 0) {
      newErrors.push({ id: crypto.randomUUID(), key: "tooManyFiles" });
    }
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
      if (current.length + accepted.length >= MAX_BATCH) {
        newErrors.push({ id: crypto.randomUUID(), key: "tooManyFiles" });
        break;
      }
      accepted.push({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        status: "queued",
      });
    }

    const next = [...current, ...accepted];
    itemsRef.current = next;
    setItems(next);
    setErrors(newErrors);
    setShowBatchWarning(next.length > LARGE_BATCH_WARNING);
  }, []);

  const removeItem = useCallback((id: string) => {
    const current = itemsRef.current;
    const item = current.find((entry) => entry.id === id);
    if (item) revokeItem(item);
    const next = current.filter((entry) => entry.id !== id);
    itemsRef.current = next;
    setItems(next);
    setShowBatchWarning(next.length > LARGE_BATCH_WARNING);
  }, []);

  const clearAll = useCallback(() => {
    for (const item of itemsRef.current) revokeItem(item);
    itemsRef.current = [];
    setItems([]);
    setErrors([]);
    setShowBatchWarning(false);
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<BatchItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }, []);

  const resetProcessing = useCallback(() => {
    setItems((current) =>
      current.map((item) =>
        item.status === "processing" ? { ...item, status: "queued" } : item,
      ),
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
    resetProcessing,
  };
}

import type { WorkerRequest, WorkerResponse } from "./protocol";

interface PendingJob<TResult> {
  resolve: (result: TResult) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

/**
 * Thin typed wrapper around a Web Worker: one promise per job, progress
 * callbacks, cooperative cancellation, and clean disposal. The actual
 * worker (image codecs) arrives in Milestone 3.
 */
export class WorkerClient<TJob, TResult> {
  private worker: Worker | null = null;
  private pending = new Map<string, PendingJob<TResult>>();
  private cancelled = new Set<string>();

  constructor(private factory: () => Worker) {}

  private ensure(): Worker {
    if (this.worker) return this.worker;
    this.worker = this.factory();
    this.worker.onmessage = (event: MessageEvent<WorkerResponse<TResult>>) => {
      const { id, type } = event.data;
      const job = this.pending.get(id);
      if (!job) return;
      if (type === "progress") {
        job.onProgress?.(event.data.progress);
      } else if (type === "success") {
        this.pending.delete(id);
        job.resolve(event.data.result);
      } else if (type === "error") {
        this.pending.delete(id);
        job.reject(new Error(`${event.data.code}: ${event.data.message}`));
      }
    };
    this.worker.onerror = (event) => {
      // Worker-level failure (crash, OOM): reject everything pending.
      const error = new Error(event.message || "worker crashed");
      for (const [, job] of this.pending) job.reject(error);
      this.pending.clear();
    };
    return this.worker;
  }

  run(job: TJob, onProgress?: (progress: number) => void): Promise<TResult> {
    const id = crypto.randomUUID();
    this.cancelled.delete(id);
    return new Promise<TResult>((resolve, reject) => {
      this.pending.set(id, { resolve, reject, onProgress });
      const message: WorkerRequest<TJob> = { id, type: "job", job };
      this.ensure().postMessage(message);
    });
  }

  cancel(id: string): void {
    this.pending.delete(id);
    this.cancelled.add(id);
    this.worker?.postMessage({ id, type: "cancel" });
  }

  cancelAll(): void {
    for (const id of this.pending.keys()) this.cancel(id);
  }

  dispose(): void {
    this.cancelAll();
    this.worker?.terminate();
    this.worker = null;
  }
}

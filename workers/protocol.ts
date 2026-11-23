/** Typed message protocol shared between the main thread and image workers. */

export interface WorkerJobMessage<TJob> {
  id: string;
  type: "job";
  job: TJob;
}

export interface WorkerCancelMessage {
  id: string;
  type: "cancel";
}

export type WorkerRequest<TJob> = WorkerJobMessage<TJob> | WorkerCancelMessage;

export type WorkerResponse<TResult> =
  | { id: string; type: "progress"; progress: number } // 0..1
  | { id: string; type: "success"; result: TResult }
  | { id: string; type: "error"; code: "corrupt" | "memory" | "unsupported" | "unknown"; message: string };

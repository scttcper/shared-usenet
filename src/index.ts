import type { FetchOptions } from 'ofetch';

export type UsenetLookupTarget = 'queueJob' | 'historyJob';

export class UsenetNotFoundError extends Error {
  readonly code = 'USENET_NOT_FOUND';
  readonly client: string;
  readonly target: UsenetLookupTarget;
  readonly id: string;

  constructor(client: string, target: UsenetLookupTarget, id: string) {
    super(`Normalized ${target} not found for id "${id}" in ${client}`);
    this.name = 'UsenetNotFoundError';
    this.client = client;
    this.target = target;
    this.id = id;
  }
}

export interface UsenetClient {
  config: UsenetClientConfig;
  state: UsenetClientState;
  /**
   * Export the current state of the client. Can be restored with `createFromState`.
   */
  exportState(): UsenetClientState;
  /**
   * Returns queue, history, categories, scripts, and status in normalized form.
   */
  getAllData(): Promise<AllClientData>;
  getQueue(): Promise<NormalizedUsenetJob[]>;
  getHistory(): Promise<NormalizedUsenetHistoryItem[]>;
  getQueueJob(id: string): Promise<NormalizedUsenetJob>;
  getHistoryJob(id: string): Promise<NormalizedUsenetHistoryItem>;
  findJob(id: string): Promise<FoundUsenetJob | null>;
  pauseQueue(): Promise<boolean>;
  resumeQueue(): Promise<boolean>;
  pauseJob(id: string): Promise<boolean>;
  resumeJob(id: string): Promise<boolean>;
  removeJob(id: string, removeData?: boolean): Promise<boolean>;
  moveJob(id: string, position: number): Promise<boolean>;
  setCategory(id: string, category: string): Promise<boolean>;
  setPriority(id: string, priority: UsenetPriority): Promise<boolean>;
  addNzbFile(nzb: string | Uint8Array, options?: Partial<AddNzbOptions>): Promise<string>;
  addNzbUrl(url: string, options?: Partial<AddNzbOptions>): Promise<string>;
  normalizedAddNzb(input: NzbInput, options?: Partial<AddNzbOptions>): Promise<NormalizedUsenetJob>;
}

/**
 * A JSON serializable object that stores the state of the client.
 */
export interface UsenetClientState {
  /**
   * Authentication credentials or metadata.
   */
  auth?: Record<string, unknown>;
  /**
   * Client version information.
   */
  version?: Record<string, unknown>;
}

export interface UsenetClientConfig {
  /**
   * ex - `http://localhost:8080/`
   */
  baseUrl: string;
  /**
   * ex - `'/api'` or `'/jsonrpc'`
   */
  path?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  nzbKey?: string;
  /**
   * Pass proxy agent to ofetch.
   * Only supported in Node.js >= 18 using undici.
   *
   * @see https://undici.nodejs.org/#/docs/api/Dispatcher
   * @link https://github.com/unjs/ofetch#%EF%B8%8F-adding-https-agent
   */
  dispatcher?: FetchOptions['dispatcher'];
  /**
   * global request timeout
   * @link https://github.com/unjs/ofetch#%EF%B8%8F-timeout
   */
  timeout?: number;
}

/**
 * @deprecated Use `UsenetClientConfig` instead.
 */
export type UsenetSettings = UsenetClientConfig;

export enum UsenetJobState {
  grabbing = 'grabbing',
  queued = 'queued',
  downloading = 'downloading',
  paused = 'paused',
  postProcessing = 'postProcessing',
  completed = 'completed',
  warning = 'warning',
  error = 'error',
  deleted = 'deleted',
  unknown = 'unknown',
}

export enum UsenetStateMessage {
  grabbing = 'Grabbing',
  queued = 'Queued',
  downloading = 'Downloading',
  paused = 'Paused',
  postProcessing = 'Post-processing',
  completed = 'Completed',
  failed = 'Failed',
  warning = 'Warning',
  deleted = 'Deleted',
  unknown = 'Unknown',
}

export enum UsenetPriority {
  stopped = 'stopped',
  duplicate = 'duplicate',
  paused = 'paused',
  veryLow = 'veryLow',
  low = 'low',
  default = 'default',
  normal = 'normal',
  high = 'high',
  veryHigh = 'veryHigh',
  force = 'force',
}

export enum UsenetPostProcess {
  default = 'default',
  none = 'none',
  repair = 'repair',
  repairUnpack = 'repairUnpack',
  repairUnpackDelete = 'repairUnpackDelete',
}

export interface Category {
  id: string;
  name: string;
  path?: string;
}

export interface Script {
  id: string;
  name: string;
}

export interface NormalizedUsenetStatus {
  isDownloadPaused: boolean;
  isPostProcessingPaused?: boolean;
  speedBytesPerSecond: number;
  speedLimitBytesPerSecond?: number;
  totalRemainingSize: number;
  totalDownloadedSize?: number;
  completeDir?: string;
  /**
   * Raw data returned by client.
   */
  raw: unknown;
}

export interface NormalizedUsenetJob {
  /**
   * Job id.
   */
  id: string;
  /**
   * Job name.
   */
  name: string;
  /**
   * progress percent out of 100
   */
  progress: number;
  isCompleted: boolean;
  category?: string;
  priority?: UsenetPriority;
  state: UsenetJobState;
  stateMessage: UsenetStateMessage;
  /**
   * bytes per second
   */
  downloadSpeed: number;
  /**
   * seconds until finish
   */
  eta: number;
  queuePosition: number;
  totalSize: number;
  remainingSize: number;
  pausedSize?: number;
  savePath?: string;
  dateAdded?: string;
  dateCompleted?: string;
  postProcessScript?: string;
  failureMessage?: string;
  /**
   * Raw data returned by client.
   */
  raw: unknown;
}

export interface NormalizedUsenetHistoryItem extends NormalizedUsenetJob {
  storagePath?: string;
  succeeded: boolean;
}

export interface AllClientData {
  categories: Category[];
  scripts: Script[];
  queue: NormalizedUsenetJob[];
  history: NormalizedUsenetHistoryItem[];
  status: NormalizedUsenetStatus;
  /**
   * Raw data returned by client.
   */
  raw: unknown;
}

export type FoundUsenetJob =
  | { source: 'queue'; job: NormalizedUsenetJob }
  | { source: 'history'; job: NormalizedUsenetHistoryItem };

export interface AddNzbOptions {
  /**
   * start job paused
   * default: false
   */
  startPaused: boolean;
  category: string;
  priority: UsenetPriority;
  postProcessScript: string;
  name: string;
  password: string;
  postProcess: UsenetPostProcess;
}

export type NzbInput = { url: string } | { file: string | Uint8Array };

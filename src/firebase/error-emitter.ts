import { EventEmitter } from 'events';
import { FirestorePermissionError } from './errors';

type AppEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
};

// Typed EventEmitter
declare interface AppEventEmitter {
  on<U extends keyof AppEvents>(event: U, listener: AppEvents[U]): this;
  emit<U extends keyof AppEvents>(event: U, ...args: Parameters<AppEvents[U]>): boolean;
}

class AppEventEmitter extends EventEmitter {}

export const errorEmitter = new AppEventEmitter();

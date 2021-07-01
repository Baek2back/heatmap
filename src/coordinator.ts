import { fArgsVoid, fArgsReturn } from "./interface";

class Coordinator {
  private eStore: Record<string, fArgsReturn[]>;

  constructor() {
    this.eStore = {};
  }

  on(eventName: string, callback: fArgsVoid, scope?: any): Coordinator {
    if (!this.eStore[eventName]) this.eStore[eventName] = [];
    this.eStore[eventName].push((data: any) => callback.call(scope, data));
    return this;
  }

  emit<T>(eventName: string, data: T): void {
    if (!this.eStore[eventName]) return;
    this.eStore[eventName].forEach((event) => event(data));
  }
}

export default Coordinator;

import { EventEmitter } from "events";
import { ipcRenderer as ipc } from "electron";
import { IPCHandlerResponse } from './types';
export class IPCHandler extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(300);
  }

  private listening = false;

  public listen(): boolean {
    this.listening = true;
    ipc.on("response", (event, args) => {
      console.log(args.event, args);
      this.emit(args.event, args);
    });
    return this.listening;
  }

  public stopListening(): boolean {
    this.listening = false;
    return this.listening;
  }

  public isListening(): boolean {
    return this.listening;
  }

  public send(event: string, data?: Record<string, unknown>): Promise<IPCHandlerResponse<string|Record<string, unknown>>> {
    if (!this.listening) {
      this.listen();
    }
    ipc.send("request", {
      event,
      data
    });

    return new Promise(resolve => {
      this.once(event, responseData => {
        resolve(responseData);
      });
    });
  }
}

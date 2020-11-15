import { EventEmitter } from "events";
import { ipcRenderer as ipc } from "electron";

type IPCHandlerResponse<T> = {
  event: T;
  url?: string;
  path?: string;
};

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

  public send(event: string, data?: any): Promise<IPCHandlerResponse<string>> {
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

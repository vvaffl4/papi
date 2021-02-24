import Api from "./api";
import { Application } from "express";

class Server {
  private app: Application;
  private apis: Api[];
  private path: string;
  
  constructor(app: Application, path: string, api: Api[]) {
    this.path = path;
    this.apis = [];
  }

  start() {
    this.apis.forEach(api => 
      this.app.use(this.path, api.app));
  }
}

export default Server;
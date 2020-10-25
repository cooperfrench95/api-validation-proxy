import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import axios, { AxiosRequestConfig } from "axios";
import { ipcRenderer as ipc } from "electron";

// Axios defaults to XHR in the browser (which electron technically is) so we then can't set headers like origin and host. So we override it to the node one here - it's not a security issue in this use case
const safeAxios = axios.create({
  adapter: require("axios/lib/adapters/http"),
  // No need to throw an error when status > 300, we want to pass the error through to the client instead of handling it here
  validateStatus: status => status >= 200
});

const corsOptions = {
  origin: (requestOrigin: string | undefined, callback: Function) => {
    callback(null, true);
  }
};

const app = express();
app.use(bodyParser.json());
app.use(cors(corsOptions));

let actualURL = "http://localhost:3030";

ipc.on("request", async (event, data) => {
  switch (data.event) {
    case "change-backend-url":
      actualURL = data.url;
      ipc.send("response", { url: actualURL, event: "change-backend-url" });
      break;
    case "get-backend-url":
      ipc.send("response", { url: actualURL, event: "get-backend-url" });
      break;
    default:
      break;
  }
});

app.all("*", async (req, res) => {
  // Log details
  console.log("-------REQUEST---------");
  console.log(req.body, "BODY");
  console.log(req.headers, "HEADERS");
  console.log(req.method, "METHOD");
  console.log(req.params, "PARAMS");
  console.log("-----------------------");

  let target = actualURL;
  if (req.params) {
    target += req.params[0];
  }

  let method: AxiosRequestConfig["method"];

  switch (req.method ? req.method.toLowerCase() : null) {
    case "get":
      method = "GET";
      break;
    case "post":
      method = "POST";
      break;
    case "put":
      method = "PUT";
      break;
    case "delete":
      method = "DELETE";
      break;
    case "patch":
      method = "PATCH";
      break;
    case "options":
      method = "OPTIONS";
      break;
    case "link":
      method = "LINK";
      break;
    case "unlink":
      method = "UNLINK";
      break;
    case "head":
      method = "HEAD";
      break;
    case "purge":
      method = "PURGE";
      break;
    default:
      break;
  }

  try {
    // TODO Validate incoming request here

    // Send the request through to the target server
    const response = await safeAxios.request({
      method: method,
      url: target,
      data: req.body,
      headers: req.headers,
      params: req.query
    });

    // TODO Validate incoming response here

    // Make our response to the client the same as the response we received from the server

    // Headers
    Object.keys(response.headers).forEach(key => {
      res.set(key, response.headers[key]);
    });

    // Status code
    res.status(response.status);

    // Body (This sends the response)
    res.json(response.data);
  } catch (e) {
    console.error(e);
    res.status(500);
    res.json({
      message:
        "There was an issue processing your request in the validation proxy",
      error: e
    });
  }
});

export default app;

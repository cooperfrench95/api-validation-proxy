import { IncomingRequest, IncomingResponse } from "./../types";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import axios, { AxiosRequestConfig } from "axios";
import { ipcRenderer as ipc } from "electron";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import { validate } from "./validator";
import httpProxy from "http-proxy";

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

const SEND_TO_UI_THREAD = "response";
const RECEIVE_FROM_UI_THREAD = "request";

const app = express();
app.use(bodyParser.json());
app.use(cors(corsOptions));

let actualURL = "http://localhost:3030/";

// let proxy = null;

ipc.on(RECEIVE_FROM_UI_THREAD, async (event, data) => {
  switch (data.event) {
    case "change-backend-url":
      console.log(data);
      actualURL = data.data.url;
      // Forward websockets
      // proxy = httpProxy.createServer({
      //   target: "ws://" + actualURL.replace('https://', '').replace('http://', ''),
      //   ws: true
      // });
      // console.log('Websocket proxy', 'ws://' + actualURL, proxy)
      // proxy.on("error", (e: Error) => {
      //   console.log(e);
      // });
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
  // console.log("-------REQUEST---------");
  // console.log(req.body, "BODY");
  // console.log(req.headers, "HEADERS");
  // console.log(req.method, "METHOD");
  // console.log(req.params, "PARAMS");
  // console.log(req.hostname, "HOST");
  // console.log("-----------------------");

  const uniqueIdentifier = uuidv4();

  let target = actualURL;
  let endpoint = "/";
  let additionalPaths = "";
  console.log("params", req.params);
  if (req.params) {
    target = target.substr(0, target.length - 1);
    console.log(target);
    const path: string[] = req.params[0].split("/");
    path.splice(0, 1);
    console.log("here", path);
    // Add the path e.g. /employees/2/username to the target url
    target += req.params[0];
    for (let i = 0; i < path.length; i += 1) {
      console.log("這裡", path[i]);
      if (i === 0) {
        endpoint = path[i];
      }
      else {
        additionalPaths += `/${path[i]}`;
      }
    }
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
    let isValid = true
    let invalidFields
    const validationResult = await validate(
      endpoint,
      req.body,
      'request',
      req.method,
      "/home/cooper/Documents/ecu project/prototype/exampleValidations/"
    );

    if (validationResult.couldBeValidated) {
      if (validationResult.result && !validationResult.result.valid) {
        isValid = false
        invalidFields = validationResult.result.invalidFields
      }
    }

    const requestForUIThread: IncomingRequest = {
      event: "new-request",
      request: {
        id: uniqueIdentifier,
        headers: req.headers,
        data: req.body,
        method: req.method,
        isValid,
        origin: req.hostname,
        destination: target,
        endpoint,
        params: req.query,
        timestamp: moment().valueOf(),
        invalidFields: invalidFields
      }
    };

    // Let the UI know a request occurred
    ipc.send(SEND_TO_UI_THREAD, requestForUIThread);

    isValid = true
    invalidFields = []

    // Send the request through to the target server
    const response = await safeAxios.request({
      method: method,
      url: target,
      data: req.body,
      headers: req.headers,
      params: req.query
    });

    const responseValidation = await validate(
      endpoint,
      response.data,
      'response',
      req.method,
      "/home/cooper/Documents/ecu project/prototype/exampleValidations/"
    )

    if (responseValidation.couldBeValidated) {
      if (responseValidation.result && !responseValidation.result.valid) {
        isValid = false
        invalidFields = responseValidation.result.invalidFields
      }
    }

    const responseForUIThread: IncomingResponse = {
      event: "new-response",
      response: {
        id: uniqueIdentifier,
        headers: response.headers,
        method: req.method,
        statusCode: response.status,
        statusText: response.statusText,
        data: response.data,
        isValid,
        invalidFields,
        responseTime: moment().diff(
          moment(requestForUIThread.request.timestamp),
          "ms"
        )
      }
    };
    // Let the UI know a response occurred
    ipc.send(SEND_TO_UI_THREAD, responseForUIThread);

    // If either request or response failed validation, create system notification
    if (!responseForUIThread.response.isValid || !requestForUIThread.request.isValid) {
      ipc.send('validation-failure', {
        id: uniqueIdentifier,
        endpoint,
      })
    }

    // Make our response to the client the same as the response we received from the server
    // Headers
    Object.keys(response.headers).forEach(key => {
      res.set(key, response.headers[key]);
    });

    // Status code
    res.status(response.status);

    // Body (This sends the response)
    res.json(response.data);
  }
  catch (e) {
    console.error(e);
    res.status(500);
    if (e.code === "ECONNREFUSED") {
      ipc.send(SEND_TO_UI_THREAD, {
        event: "backend-down"
      });
    }
    res.json({
      message:
        "There was an issue processing your request in the validation proxy",
      error: e
    });
  }
});

export default app;

import { IncomingRequest, IncomingResponse, RecordingResult } from "./../types";
import validator from "validator";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import axios, { AxiosRequestConfig } from "axios";
import { ipcRenderer as ipc } from "electron";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import { createValidationTemplate, saveValidationTemplate, validate } from "./validator";
import httpProxy from "http-proxy";
import fs from 'fs';
// import https from 'https';
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// const Agent = new https.Agent({
//   rejectUnauthorized: false
// })

// Axios defaults to XHR in the browser (which electron technically is) so we then can't set headers like origin and host. So we override it to the node one here - it's not a security issue in this use case
const safeAxios = axios.create({
  adapter: require("axios/lib/adapters/http"),
  // httpsAgent: Agent,
  // No need to throw an error when status > 300, we want to pass the error through to the client instead of handling it here
  validateStatus: status => status >= 200,
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

let actualURL = "";
let validationPath = "";
let isRecording = false;
let isRecordingAll = false;
let recordingEndpoint = ''
let recordingMethod = ''
let arrayCheckLimit = 1
let lang: 'zh'|'en' = 'en'

const allTemplates = {}

function getAllTemplates(path: string, grabFileContents = false) {
  const contents = {}
  const contentsForResolve = {}
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, files) => {
      if (err) {
        console.log(err)
      }

      files.forEach(file => {
        contents[file] = __non_webpack_require__(path + file)
        const noExtension = file.replace('.js', '')
        allTemplates[noExtension] = []
        Object.values(contents[file].response).forEach(method => {
          if (typeof method === 'object' && method) {
            Object.keys(method).forEach(fullPath => {
              allTemplates[noExtension].push(fullPath)
            })
          }
        })
        if (grabFileContents) {
          contentsForResolve[noExtension] = { ...contents[file] }
        }
        delete contents[file]
      })
      if (!grabFileContents) {
        resolve(allTemplates)
      }
      else {
        resolve(contentsForResolve)
      }
    })
    console.log('allTemplates', allTemplates)
  })
}

// Determines whether a request should be handled by a particular handler based on its URL path. For instance, GET /employees is different to GET /employees/:uuid
function findRequestTypeFromURL(endpoint: string, fullPath: string) {
  const possibleTypesForAURLString = ['number', 'uuid', 'timestamp', 'locale', 'jwt']
  const typeChecker = [
    (i: unknown) => !isNaN(Number(i)),
    (i: unknown) => typeof i === "string" && validator.isUUID(i),
    (i: unknown) => typeof i === "string" && validator.isISO8601(i),
    (i: string) => validator.isLocale(i),
    (i: string) => validator.isJWT(i),
  ]
  const allPathParts = fullPath.split('/').filter((i, index) => index > 1)
  let rebuiltPath = `/${endpoint}`
  allPathParts.forEach(part => {
    console.log('part', part)
    let found = false
    for (let i = 0; i < typeChecker.length; i += 1) {
      if (typeChecker[i](part)) {
        rebuiltPath += `/:${possibleTypesForAURLString[i]}`
        found = true
        break
      }
    }
    if (!found) {
      rebuiltPath += `/${part}`
    }
  })
  console.log('rebuild path', rebuiltPath)
  return rebuiltPath
}

ipc.on(RECEIVE_FROM_UI_THREAD, async (event, data) => {
  switch (data.event) {
    case "change-backend-url":
      console.log(data);
      actualURL = data.data.url;
      validationPath = data.data.path;
      getAllTemplates(data.data.path);
      safeAxios.defaults.headers.common.host = actualURL;
      // Forward websockets
      // proxy = httpProxy.createServer({
      //   target: "ws://" + actualURL.replace('https://', '').replace('http://', ''),
      //   ws: true
      // });
      // console.log('Websocket proxy', 'ws://' + actualURL, proxy)
      // proxy.on("error", (e: Error) => {
      //   console.log(e);
      // });
      ipc.send("response", { url: actualURL, path: validationPath, event: "change-backend-url" });
      break;
    case "get-backend-url":
      ipc.send("response", { url: actualURL, path: validationPath, event: "get-backend-url" });
      break;
    case "record-endpoint":
      isRecording = true
      recordingMethod = data.data.method
      recordingEndpoint = data.data.endpoint
      console.log('SENT ENDPOINT', data.data.endpoint, 'PARSED', recordingEndpoint)
      ipc.send('response', {
        success: true,
        event: 'record-endpoint'
      })
      break
    case "record-all-endpoints":
      isRecordingAll = true
      ipc.send('response', {
        success: true,
        event: 'record-all-endpoints'
      })
      break
    case 'stop-recording-all-endpoints':
      isRecordingAll = false;
      ipc.send('response', {
        success: true,
        event: 'stop-recording-all-endpoints'
      })
      break
    case "save-validation":
      ipc.send('response', {
        success: await saveValidationTemplate(
          data.data.endpoint,
          data.data.method,
          data.data.requestTemplate,
          data.data.responseTemplate,
          validationPath
        ),
        event: 'save-validation'
      })
      getAllTemplates(validationPath);
      break
    case 'change-lang':
      lang = data.data.lang
      ipc.send('response', {
        success: true,
        event: 'change-lang'
      })
      break
    case 'arrayCheckLimit':
      arrayCheckLimit = data.data.value
      ipc.send('response', {
        event: 'arrayCheckLimit',
        success: true
      })
      break
    case 'getAllTemplates':
      // eslint-disable-next-line no-case-declarations
      const templateFiles = await getAllTemplates(validationPath, true)
      ipc.send('response', {
        event: 'getAllTemplates',
        templates: templateFiles
      })
      break
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
  let fullPath = "/";
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
        fullPath += path[i];
      }
      else {
        fullPath += `/${path[i]}`;
      }
    }
  }

  console.log('fullPath', fullPath)
  const reqType = findRequestTypeFromURL(endpoint, fullPath)
  console.log(recordingEndpoint, reqType)

  let doNotValidate = false
  if ((isRecording && reqType === recordingEndpoint && recordingMethod === req.method) || isRecordingAll) {
    doNotValidate = true
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
    if (doNotValidate) {
      const hostRemoved = { ...req.headers }
      hostRemoved.host = target.split('://')[1].split('/')[0]
      hostRemoved.url = target
      hostRemoved['cache-control'] = 'no-cache'
      // Send the request through to the target server
      const response = await safeAxios.request({
        method: method,
        url: target,
        data: req.body,
        headers: hostRemoved,
        params: req.query
      });
      let reqValidationTemplate = null
      if (!(method === 'GET' || method === 'DELETE')) {
        reqValidationTemplate = await createValidationTemplate(req.body)
      }
      const resValidationTemplate = await createValidationTemplate(response.data)

      const recordingResult: RecordingResult = {
        event: 'recording',
        requestTemplate: reqValidationTemplate,
        responseTemplate: resValidationTemplate,
        endpoint: reqType,
        method: method,
        request: {
          id: uniqueIdentifier,
          headers: req.headers,
          data: req.body,
          method: req.method,
          origin: req.hostname,
          destination: target,
          endpoint,
          isValid: false,
          timestamp: 0,
          params: req.query,
        },
        response: {
          id: uniqueIdentifier,
          headers: response.headers,
          method: req.method,
          statusCode: response.status,
          statusText: response.statusText,
          data: response.data,
          isValid: false,
          responseTime: 0
        }
      }

      ipc.send(SEND_TO_UI_THREAD, recordingResult)

      isRecording = false
      recordingEndpoint = ''
      recordingMethod = ''

      // Make our response to the client the same as the response we received from the server
      // Headers
      Object.keys(response.headers).forEach(key => {
        if (key !== "transfer-encoding") {
          res.set(key, response.headers[key]);
        }
      });

      // Status code
      res.status(response.status);

      // Body (This sends the response)
      res.json(response.data);
    }
    else {
      // Validate incoming request
      let isValid = true
      let invalidFields
      if (!(method === 'GET' || method === 'DELETE')) {
        const validationResult = await validate(
          endpoint,
          req.body,
          'request',
          req.method,
          validationPath,
          reqType,
          lang,
          arrayCheckLimit
        );
        if (validationResult.couldBeValidated) {
          if (validationResult.result && !validationResult.result.valid) {
            isValid = false
            invalidFields = validationResult.result.invalidFields
          }
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

      const hostRemoved = { ...req.headers }
      hostRemoved.host = target.split('://')[1].split('/')[0]
      hostRemoved.url = target
      hostRemoved['cache-control'] = 'no-cache'

      // Send the request through to the target server
      const response = await safeAxios.request({
        method: method,
        url: target,
        data: req.body,
        headers: hostRemoved,
        params: req.query,
      });

      console.log(response)

      let resBody = response.data
      if (Array.isArray(response.data) && response.data.length) {
        resBody = [response.data[0]]
      }
      console.log(resBody, response, method, endpoint)

      const responseValidation = await validate(
        endpoint,
        resBody,
        'response',
        req.method,
        validationPath,
        reqType,
        lang,
        arrayCheckLimit
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
          data: resBody,
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
          endpoint: reqType,
        })
      }

      // Make our response to the client the same as the response we received from the server
      // Headers
      Object.keys(response.headers).forEach(key => {
        if (key !== "transfer-encoding") {
          res.set(key, response.headers[key]);
        }
      });

      // Status code
      res.status(response.status);

      // Body (This sends the response)
      res.json(response.data);
    }
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

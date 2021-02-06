export interface Request {
  id: string;
  headers: object;
  method: string;
  data: object;
  isValid: boolean;
  invalidFields?: invalidField[];
  origin: string;
  destination: string;
  endpoint: string;
  params: object;
  timestamp: number;
  response?: Response;
}

export interface Response {
  id: string;
  headers: object;
  method: string;
  statusCode: number;
  statusText: string;
  data: object;
  isValid: boolean;
  invalidFields?: invalidField[];
  responseTime: number;
}

export interface IncomingRequest {
  event: "new-request";
  request: Request;
}

export interface IncomingResponse {
  event: "new-response";
  response: Response;
}

export type invalidField = {
  key: string;
  reason: string;
};

export type validationResult = {
  valid: boolean;
  invalidFields?: Array<invalidField>;
};

export type IPCHandlerResponse<T> = {
  event: T;
  url?: string;
  path?: string;
  templates?: object;
};

export type validationAttemptResult = {
  couldBeValidated: boolean;
  result?: validationResult;
}

export interface ValidationNotification {
  id: string;
  endpoint: string;
  problems: validationResult[];
}

export interface ValidationFailureEvent {
  event: 'validation-failure';
  id: string;
}

export interface ViewValidationFailureEvent {
  event: 'view-validation-failure';
  id: string;
}

export interface RecordingResult {
  event: "recording";
  requestTemplate: object | string[] | object[] | null;
  responseTemplate: object | string[] | object[] | null;
  endpoint: string;
  method: string|undefined;
  shouldSave?: boolean;
  request: Request;
  response: Response;
}

export interface LineDescription {
  type?: string;
  optional: boolean;
  display: string;
  displayAfter?: string;
}

export interface ConversionResult {
  asObject: object;
  asString: string;
}

export interface SaveTemplateCommand {
  endpoint: string;
  method: string;
  requestTemplate: object;
  responseTemplate: object;
}

export interface SaveTemplateResult {
  event: 'save-validation';
  success: boolean;
}

export interface EndpointContent {
  name: string;
  content: object;
}

export type unStringifiedContent = {
  request: {
    GET?: {
      [s: string]: string;
    };
    PUT?: {
      [s: string]: string;
    };
    POST?: {
      [s: string]: string;
    };
    PATCH?: {
      [s: string]: string;
    };
    DELETE?: {
      [s: string]: string;
    };
  };
  response?: {
    GET?: {
      [s: string]: string;
    };
    PUT?: {
      [s: string]: string;
    };
    POST?: {
      [s: string]: string;
    };
    PATCH?: {
      [s: string]: string;
    };
    DELETE?: {
      [s: string]: string;
    };
  };
};

export interface SelectedEndpointContent {
  name: string;
  content: string;
  unStringifiedContent: unStringifiedContent;
}

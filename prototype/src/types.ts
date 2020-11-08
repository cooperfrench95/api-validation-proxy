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

export interface Request {
  id: string;
  headers: object;
  method: string;
  data: object;
  isValid: boolean;
  invalidFields?: object;
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
  invalidFields?: object;
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

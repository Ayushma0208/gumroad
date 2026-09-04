export class AppError extends Error {
  readonly statusCode: number;
  readonly errors?: unknown;

  constructor(statusCode: number, message: string, errors?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export function badRequest(message: string, errors?: unknown) {
  return new AppError(400, message, errors);
}

export function unauthorized(message = "Unauthenticated") {
  return new AppError(401, message);
}

export function forbidden(message = "You do not have access.") {
  return new AppError(403, message);
}

export function notFound(message = "Not found") {
  return new AppError(404, message);
}

export function conflict(message: string) {
  return new AppError(409, message);
}

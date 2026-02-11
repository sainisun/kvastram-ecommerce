/**
 * Global Error Handler Middleware
 * Catches and formats all errors consistently
 */

import { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { StatusCode, ContentfulStatusCode } from "hono/utils/http-status";
import { ZodError } from "zod";
import {
  errorResponse,
  ErrorMessages,
  HttpStatus,
} from "../utils/api-response";
import { formatZodErrors } from "../utils/validation";

// Custom API Error class
// Note: We accept number to be backward compatible and generic,
// but internally we treat it as StatusCode for Hono.
export class APIError extends Error {
  public statusCode: StatusCode;

  constructor(
    message: string,
    statusCode: number = 400,
    public errors?: any,
  ) {
    super(message);
    this.name = "APIError";
    this.statusCode = statusCode as StatusCode;
  }
}

// Not Found Error
export class NotFoundError extends APIError {
  constructor(message: string = ErrorMessages.NOT_FOUND) {
    super(message, HttpStatus.NOT_FOUND);
    this.name = "NotFoundError";
  }
}

// Validation Error
export class ValidationError extends APIError {
  constructor(message: string = ErrorMessages.VALIDATION_ERROR, errors?: any) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY as number, errors);
    this.name = "ValidationError";
  }
}

// Auth Error
export class AuthError extends APIError {
  constructor(message: string = ErrorMessages.UNAUTHORIZED) {
    super(message, HttpStatus.UNAUTHORIZED);
    this.name = "AuthError";
  }
}

// Forbidden Error
export class ForbiddenError extends APIError {
  constructor(message: string = ErrorMessages.FORBIDDEN) {
    super(message, HttpStatus.FORBIDDEN);
    this.name = "ForbiddenError";
  }
}

// Conflict Error
export class ConflictError extends APIError {
  constructor(message: string = ErrorMessages.CONFLICT) {
    super(message, HttpStatus.CONFLICT);
    this.name = "ConflictError";
  }
}

// Global error handler middleware
export async function errorHandler(err: Error, c: Context) {
  console.error("[ERROR]", err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return errorResponse(
      c,
      ErrorMessages.VALIDATION_ERROR,
      formatZodErrors(err),
      HttpStatus.UNPROCESSABLE_ENTITY as StatusCode,
    );
  }

  // Handle HTTP Exceptions from Hono
  if (err instanceof HTTPException) {
    return errorResponse(c, err.message, null, err.status as StatusCode);
  }

  // Handle custom API errors
  if (err instanceof APIError) {
    return errorResponse(c, err.message, err.errors, err.statusCode);
  }

  // Handle specific error types by message (legacy support)
  if (
    err.message?.includes("not found") ||
    err.message?.includes("Not found")
  ) {
    return errorResponse(
      c,
      ErrorMessages.NOT_FOUND,
      null,
      HttpStatus.NOT_FOUND,
    );
  }

  if (err.message?.toLowerCase().includes("unauthorized")) {
    return errorResponse(
      c,
      ErrorMessages.UNAUTHORIZED,
      null,
      HttpStatus.UNAUTHORIZED,
    );
  }

  if (
    err.message?.toLowerCase().includes("conflict") ||
    err.message?.includes("already exists")
  ) {
    return errorResponse(c, ErrorMessages.CONFLICT, null, HttpStatus.CONFLICT);
  }

  // Default: Internal Server Error
  // In production, don't expose error details
  const isDev = process.env.NODE_ENV === "development";

  return errorResponse(
    c,
    ErrorMessages.INTERNAL_ERROR,
    isDev ? { message: err.message, stack: err.stack } : null,
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
}

// Async handler wrapper to catch errors automatically
export function asyncHandler(fn: (c: Context) => Promise<Response>) {
  return async (c: Context) => {
    try {
      return await fn(c);
    } catch (error) {
      return errorHandler(error as Error, c);
    }
  };
}

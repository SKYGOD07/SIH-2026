import { Response } from 'express';
import { ApiResponse } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200
) => {
  const responseBody: ApiResponse<T> = {
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
  };
  return res.status(statusCode).json(responseBody);
};

export const sendError = (
  res: Response,
  error: string,
  statusCode = 500,
  details?: any
) => {
  const responseBody: ApiResponse = {
    success: false,
    error,
    ...(details && { details }),
  };
  return res.status(statusCode).json(responseBody);
};

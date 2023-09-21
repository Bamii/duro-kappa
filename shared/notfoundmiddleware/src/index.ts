import { NextFunction, Request, Response } from 'express';
import { sendError, ApplicationError } from "config";

const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404);
  const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
  next(error);
}

export const errorMiddleware = (error: any, _: Request, res: Response, __: NextFunction) => {
  console.log(error);
  console.log(error instanceof Error);
  res.status(404);
  if (error instanceof ApplicationError)
    return sendError(res, error.message, { status: 401 });

  return sendError(res, "An application error occured.", { status: 500 })
}

export default notFound;
import { Request, Response, NextFunction } from 'express';

export default (req: Request, _res: Response, next: NextFunction) => {
  const value = req.headers['x-access-token'];
  if (!value) {
    return next();
  }
  req.headers.cookie = `connect.sid=${value}`;
  return next();
};

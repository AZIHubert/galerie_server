import { Request, Response } from 'express';

export default (req: Request, res: Response) => {
  req.logOut();
  res.status(204).end();
};

import { Request, Response } from 'express';

export default (_: Request, res: Response) => {
  const { user } = res.locals;
  res.status(200).send(user);
};

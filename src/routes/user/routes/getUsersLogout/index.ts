import { Request, Response } from 'express';

export default (req: Request, res: Response) => {
  req.logOut();
  req.session.destroy((sessionError) => {
    if (sessionError) {
      res.status(401).send({
        errors: sessionError,
      });
    }
  });
  res.status(204).end();
};

import { Request, Response } from 'express';

import {
  sendRefreshToken,
} from '@src/helpers/auth';

export default (_req: Request, res: Response) => {
  sendRefreshToken(res, '');
  res.status(204).end();
};

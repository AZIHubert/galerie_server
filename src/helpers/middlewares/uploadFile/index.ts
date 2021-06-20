import {
  NextFunction,
  Request,
  Response,
} from 'express';
import multer from 'multer';

import {
  DEFAULT_ERROR_MESSAGE,
} from '@src/helpers/errorMessages';

export default (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const upload = multer({
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    storage: multer.memoryStorage(),
  }).single('image');

  upload(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.message === 'Unexpected field') {
        return res.status(400).send({
          errors: DEFAULT_ERROR_MESSAGE,
        });
      }
      return res.status(500).send(err);
    } if (err) {
      return res.status(500).send(err);
    }
    return next();
  });
};

import {
  NextFunction,
  Request,
  Response,
} from 'express';
import multer from 'multer';

export default (
  next: NextFunction,
  req: Request,
  res: Response,
) => {
  const upload = multer({
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    storage: multer.memoryStorage(),
  }).array('images', 6);

  upload(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).send({
          errors: 'too much files have been sent',
        });
      }
      if (err.message === 'Unexpected field') {
        return res.status(400).send({
          errors: 'something went wrong with attached file',
        });
      }
      return res.status(500).send(err);
    } if (err) {
      return res.status(500).send(err);
    }
    return next();
  });
};

import { Request, Response, NextFunction } from 'express';

import passport from '@src/helpers/passport';

export default (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('facebook', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).send(err);
    }
    if (Object.keys(info).length) {
      return res.status(401).send({
        errors: info.message,
      });
    }
    if (user) {
      req.user = user;
    }
    return next();
  })(req, res, next);
};

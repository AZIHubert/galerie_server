import {
  NextFunction,
  Request,
  Response,
} from 'express';

import {
  DEFAULT_ERROR_MESSAGE,
  USER_SHOULD_NOT_BE_BLACK_LISTED,
} from '#src/helpers/errorMessages';
import passport from '#src/helpers/passport';

export default (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return res.status(500).send(err);
    if (!user) {
      const errors = info.message || DEFAULT_ERROR_MESSAGE;
      const status = info.status || 500;

      if (errors === USER_SHOULD_NOT_BE_BLACK_LISTED) {
        req.logOut();
      }

      return res.status(status).send({
        errors,
      });
    }
    req.user = user;
    return next();
  })(req, res, next);
};

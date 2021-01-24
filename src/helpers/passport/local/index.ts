import { Request } from 'express';
import passportLocal from 'passport-local';

const LocalStrategy = passportLocal.Strategy;

export default new LocalStrategy({
  passReqToCallback: true,
  usernameField: 'userNameOrEmail',
}, async (
  req: Request,
  _userNameOrEmail: string,
  _password: string,
  done: Function,
) => {
  const { user } = req;
  if (!user) done(null, false);
  done(null, user);
});

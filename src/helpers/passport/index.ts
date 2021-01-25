import passport from 'passport';

import { User } from '@src/db/models';

import jwt from './jwt';
import GoogleStrategy from './google';
import FacebookStrategy from './facebook';

passport.serializeUser((user, done) => {
  const currentUser = user as User;
  done(null, currentUser.id);
});

passport.deserializeUser(async (id, done) => {
  const userId = id as string;
  try {
    const user = await User.findByPk(userId);
    if (user) done(null, user);
    else done(null, false);
  } catch (err) {
    done(err);
  }
});

passport.use(jwt);
passport.use('google', GoogleStrategy);
passport.use('facebook', FacebookStrategy);

export default passport;

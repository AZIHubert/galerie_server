import passport from 'passport';

import User from '@src/db/models/user';

import GoogleStrategy from './google';
import LocalStrategy from './local';

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

passport.use('google', GoogleStrategy);
passport.use('local', LocalStrategy);

export default passport;

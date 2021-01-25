import passport from 'passport';
import passportJwt from 'passport-jwt';
import path from 'path';
import fs from 'fs';

import { User } from '@src/db/models';

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

const JwtStrategy = passportJwt.Strategy;
const { ExtractJwt } = passportJwt;

const PUB_KEY = fs.readFileSync(path.join('./id_rsa_pub.authToken.pem'));

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: PUB_KEY,
  algorithms: ['RS256'],
};

const strategy = new JwtStrategy(options, async (payload, done) => {
  let user: User | null;
  try {
    user = await User.findByPk(payload.sub);
  } catch (err) {
    return done(err, null);
  }
  if (!user) {
    return done(null, false);
  }
  return done(null, user);
});

passport.use(strategy);
passport.use('google', GoogleStrategy);
passport.use('local', LocalStrategy);

export default passport;

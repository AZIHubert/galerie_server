import passportJwt from 'passport-jwt';
import path from 'path';
import fs from 'fs';

import { User } from '@src/db/models';

const PUB_KEY = fs.readFileSync(path.join('./id_rsa_pub.authToken.pem'));
const { ExtractJwt } = passportJwt;
const JwtStrategy = passportJwt.Strategy;

const options = {
  algorithms: ['RS256'],
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: PUB_KEY,
};

export default new JwtStrategy(options, async (payload, done) => {
  let user: User | null;

  // TODO:
  // check if payload.sub is a uuidv4.

  try {
    user = await User.findByPk(payload.sub);
  } catch (err) {
    return done(err, null);
  }
  if (!user) {
    return done(null, false);
  }
  if (user.authTokenVersion !== payload.authTokenVersion) {
    return done(null, false);
  }
  if (!user.confirmed) {
    return done(null, false);
  }
  return done(null, user);
});

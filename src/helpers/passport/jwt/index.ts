import passportJwt from 'passport-jwt';
import path from 'path';
import fs from 'fs';

import { User } from '@src/db/models';

const JwtStrategy = passportJwt.Strategy;
const { ExtractJwt } = passportJwt;

const PUB_KEY = fs.readFileSync(path.join('./id_rsa_pub.authToken.pem'));

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: PUB_KEY,
  algorithms: ['RS256'],
};

export default new JwtStrategy(options, async (payload, done) => {
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

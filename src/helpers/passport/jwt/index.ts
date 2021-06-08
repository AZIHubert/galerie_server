import passportJwt from 'passport-jwt';
import path from 'path';
import fs from 'fs';

import { User } from '@src/db/models';

import checkBlackList from '@src/helpers/checkBlackList';
import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
  USER_SHOULD_BE_CONFIRMED,
  USER_SHOULD_NOT_BE_BLACK_LISTED,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
import uuidValidateV4 from '@src/helpers/uuidValidateV4';

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
  let userIsBlackListed: boolean;

  // Check if user.id is a valid UUIDv4
  if (!uuidValidateV4(payload.sub)) {
    return done(null, false, {
      message: INVALID_UUID,
      status: 401,
    });
  }

  // Fetch user.
  try {
    user = await User.findByPk(payload.sub);
  } catch (err) {
    return done(err, null);
  }

  // Check if user exist.
  if (!user) {
    return done(null, false, {
      message: MODEL_NOT_FOUND('user'),
      status: 404,
    });
  }

  // Check if user is confirmed.
  if (!user.confirmed) {
    return done(null, false, {
      message: USER_SHOULD_BE_CONFIRMED,
      status: 400,
    });
  }

  // Check if user is black listed
  try {
    userIsBlackListed = await checkBlackList(user);
  } catch (err) {
    return done(err, null);
  }
  if (userIsBlackListed) {
    return done(null, false, {
      message: USER_SHOULD_NOT_BE_BLACK_LISTED,
      status: 401,
    });
  }

  // Check if authTokenVersion is valid.
  // It may changed if user has changed his password
  // or his email on other device.
  if (user.authTokenVersion !== payload.authTokenVersion) {
    return done(null, false, {
      message: WRONG_TOKEN_VERSION,
      status: 401,
    });
  }

  return done(null, user);
});

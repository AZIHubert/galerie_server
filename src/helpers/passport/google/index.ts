import { Op } from 'sequelize';

import User from '@src/db/models/user';

import pgo from 'passport-google-oauth';

import accEnv from '@src/helpers/accEnv';
import {
  USER_IS_BLACK_LISTED,
} from '@src/helpers/errorMessages';

const GOOGLE_CLIENT_ID = accEnv('GOOGLE_CLIENT_ID');
const GOOGLE_SECRET = accEnv('GOOGLE_SECRET');
const GOOGLE_CALLBACK_URL = accEnv('GOOGLE_CALLBACK_URL');

const GoogleStrategy = pgo.OAuth2Strategy;

export default new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_SECRET,
  callbackURL: GOOGLE_CALLBACK_URL,
}, async (_accessToken, _refreshToken, {
  id: googleId,
  displayName,
  emails,
  photos,
}, done) => {
  const email = emails ? emails[0].value : null;
  const defaultProfilePicture = photos ? photos[0].value : null;
  let userEmail: User | null;
  if (email) {
    try {
      userEmail = await User.findOne({
        where: {
          email,
          [Op.or]: [
            {
              googleId: {
                [Op.not]: googleId,
              },
            },
            {
              googleId: null,
            },
          ],
        },
      });
    } catch (err) {
      return done(err, false);
    }
    if (userEmail) {
      if (userEmail.facebookId) {
        return done(null, false, {
          message: 'you\'re email is already used for a facebook account',
        });
      }
      return done(null, false, {
        message: 'you\'re email is already used',
      });
    }
  }
  let user: User | null;
  try {
    user = await User.findOne({ where: { googleId } });
  } catch (err) {
    return done(err, false);
  }
  if (!user) {
    const newUser = await User.create({
      userName: `${displayName.replace(/ /g, '')}G`,
      email,
      confirmed: true,
      googleId,
      defaultProfilePicture,
    });
    return done(null, newUser);
  }
  if (user.blackListId) {
    return done({
      errors: USER_IS_BLACK_LISTED,
    });
  }
  if (
    email !== user.email
      || defaultProfilePicture !== user.defaultProfilePicture
  ) {
    await user.update({ email, defaultProfilePicture });
  }
  return done(null, user);
});

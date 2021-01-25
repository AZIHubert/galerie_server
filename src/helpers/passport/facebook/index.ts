import { Op } from 'sequelize';
import User from '@src/db/models/user';

import pf from 'passport-facebook';

import accEnv from '@src/helpers/accEnv';
import {
  USER_IS_BLACK_LISTED,
} from '@src/helpers/errorMessages';

const FACEBOOK_CLIENT_ID = accEnv('FACEBOOK_CLIENT_ID');
const FACEBOOK_SECRET = accEnv('FACEBOOK_SECRET');
const FACEBOOK_CALLBACK_URL = accEnv('FACEBOOK_CALLBACK_URL');

const FacebookStrategy = pf.Strategy;

export default new FacebookStrategy({
  clientID: FACEBOOK_CLIENT_ID,
  clientSecret: FACEBOOK_SECRET,
  callbackURL: FACEBOOK_CALLBACK_URL,
  profileFields: ['id', 'displayName', 'emails', 'photos'],
}, async (_accessToken, _refreshToken, {
  id: facebookId,
  emails,
  photos,
  displayName,
}, done) => {
  try {
    const email = emails ? emails[0].value : null;
    const defaultProfilePicture = photos ? photos[0].value : null;
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { facebookId },
          { email },
        ],
      },
    });
    if (!user) {
      const newUser = await User.create({
        userName: displayName.replace(/ /g, ''),
        email,
        confirmed: true,
        facebookId,
        defaultProfilePicture,
      });
      return done(null, newUser);
    }
    if (user.blackListId) {
      return done({
        errors: USER_IS_BLACK_LISTED,
      });
    }
    if (!user.facebookId) {
      await user.update({ facebookId });
    }
    if (
      email !== user.email
      || defaultProfilePicture !== user.defaultProfilePicture
    ) {
      await user.update({ email, defaultProfilePicture });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
});

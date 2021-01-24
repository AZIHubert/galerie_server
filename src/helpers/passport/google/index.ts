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
  try {
    const user = await User.findOne({ where: { googleId } });
    const email = emails ? emails[0].value : null;
    const defaultProfilePicture = photos ? photos[0].value : null;
    if (!user) {
      const newUser = await User.create({
        userName: displayName,
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
      displayName !== user.userName
      || email !== user.email
      || defaultProfilePicture !== user.defaultProfilePicture
    ) {
      await user.update({ userName: displayName, email, defaultProfilePicture });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
});

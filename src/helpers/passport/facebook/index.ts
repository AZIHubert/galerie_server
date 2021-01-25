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
              facebookId: {
                [Op.not]: facebookId,
              },
            },
            {
              facebookId: null,
            },
          ],
        },
      });
    } catch (err) {
      return done(err, false);
    }
    if (userEmail) {
      if (userEmail.googleId) {
        return done(null, false, {
          message: 'you\'re email is already used for a google account',
        });
      }
      return done(null, false, {
        message: 'you\'re email is already used',
      });
    }
  }
  let user: User | null;
  try {
    user = await User.findOne({ where: { facebookId } });
  } catch (err) {
    return done(err, false);
  }
  if (!user) {
    const newUser = await User.create({
      userName: `${displayName.replace(/ /g, '')}F`,
      email,
      confirmed: true,
      facebookId,
      defaultProfilePicture,
    });
    return done(null, newUser);
  }
  if (user.blackListId) {
    return done(null, false, {
      message: USER_IS_BLACK_LISTED,
    });
  }
  if (email !== user.email
      || defaultProfilePicture !== user.defaultProfilePicture) {
    await user.update({ email, defaultProfilePicture });
  }
  return done(null, user);
});

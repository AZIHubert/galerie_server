// POST /users/login/socialMedia/

import {
  Request,
  Response,
} from 'express';

import { User } from '@src/db/models';

import accEnv from '@src/helpers/accEnv';
import checkBlackList from '@src/helpers/checkBlackList';
import { USER_SHOULD_NOT_BE_BLACK_LISTED } from '@src/helpers/errorMessages';
import {
  signAuthToken,
} from '@src/helpers/issueJWT';
import setRefreshToken from '@src/helpers/setRefreshToken';

const IS_BETA = accEnv('IS_BETA', 'false');

export default async (req: Request, res: Response) => {
  const {
    email,
    id,
    profilePicture,
    type,
    userName,
  } = req.body;
  let user: User | null;
  let userEmail: User | null;
  let userIsBlackListed: boolean;

  if (IS_BETA === 'true') {
    return res.status(400).send({
      errors: 'you can\'t signin with this route in beta',
    });
  }

  // Check if id has been send.
  // Id should be a facebookId or a googleId.
  if (!id) {
    return res.status(400).send({
      errors: 'id not found',
    });
  }

  // Check if type has been send.
  if (!type) {
    return res.status(400).send({
      errors: 'type not found',
    });
  }
  // Type should be 'Facebook' or 'Google'.
  if (type !== 'Facebook' && type !== 'Google') {
    return res.status(400).send({
      errors: 'type should be \'Facebook\' or \'Google\'',
    });
  }

  // Check if email is already register
  // For a social media account,
  // email is not required.
  if (email) {
    try {
      userEmail = await User.findOne({
        where: {
          email,
        },
      });
    } catch (err) {
      return res.status(500).send(err);
    }
    if (userEmail) {
      // If someone try to logged in with Facebook
      // and the email is already register for a Google account,
      // return a 400 error.
      if (type === 'Facebook' && userEmail.googleId) {
        return res.status(400).send({
          errors: 'you\'re email is already used for a google account',
        });
      }

      // If someone try to logged in with Google
      // and the email is already register for a Facebook account,
      // return a 400 error.
      if (type === 'Google' && userEmail.facebookId) {
        return res.status(400).send({
          errors: 'you\'re email is already used for a facebook account',
        });
      }

      // If someone try to logged in with any social media
      // and the email is already register for a regular account,
      // return a 400 error.
      if (!userEmail.googleId && !userEmail.facebookId) {
        return res.status(400).send({
          errors: 'you\'re email is already used',
        });
      }
    }
  }

  // Check if user with id exist.
  try {
    switch (type) {
      case 'Facebook':
        user = await User.findOne({
          where: {
            facebookId: id,
          },
        });
        break;
      case 'Google':
        user = await User.findOne({
          where: {
            googleId: id,
          },
        });
        break;
      default:
        user = null;
    }
  } catch (err) {
    return res.status(500).send(err);
  }

  // If user doesn't exist
  // create a new one.
  if (!user) {
    // userName is allow to create an account
    // userName is not gonna be saved as user.userName
    // but instead as user.socialMediaUserName.
    // user.userName is a unique field,
    // not user.socialMediaUserName.
    if (!userName) {
      return res.status(400).send({
        errors: 'user name not found',
      });
    }
    try {
      user = await User.create({
        confirmed: true,
        defaultProfilePicture: profilePicture,
        email,
        facebookId: type === 'Facebook' ? id : null,
        googleId: type === 'Google' ? id : null,
        pseudonym: userName,
        socialMediaUserName: userName,
      });
    } catch (err) {
      return res.status(500).send(err);
    }
  } else {
    // Check if user is black listed.
    try {
      userIsBlackListed = await checkBlackList(user);
    } catch (err) {
      return res.status(500).send(err);
    }
    if (userIsBlackListed) {
      return res.status(400).send({
        errors: USER_SHOULD_NOT_BE_BLACK_LISTED,
      });
    }

    // If default profile picture
    // or email have changed
    // update user.
    if (
      profilePicture !== user.defaultProfilePicture
      || email !== user.email
    ) {
      await user.update({
        defaultProfilePicture: profilePicture,
        email,
      });
    }
  }

  // Send auth token
  // and create Session with refresh token.
  setRefreshToken(req, user);
  const jwt = signAuthToken(user);
  return res.status(200).send({
    data: {
      expiresIn: jwt.expires,
      token: jwt.token,
    },
  });
};

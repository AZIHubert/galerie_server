import { Request, Response } from 'express';
import { Op } from 'sequelize';

import { User } from '@src/db/models';

// import {
//   USER_IS_BLACK_LISTED,
// } from '@src/helpers/errorMessages';
import { signAuthToken } from '@src/helpers/issueJWT';
import setRefreshToken from '@src/helpers/setRefreshToken';

export default async (req: Request, res: Response) => {
  const {
    email, id: facebookId, name, picture,
  } = req.body;
  if (!facebookId) {
    return res.status(400).send({
      errors: 'facebook id not found',
    });
  }
  if (!name) {
    return res.status(400).send({
      errors: 'user name not found',
    });
  }
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
      return res.status(500).send(err);
    }
    if (userEmail) {
      if (userEmail.googleId) {
        return res.status(400).send({
          errors: 'you\'re email is already used for a google account',
        });
      }
      return res.status(400).send({
        errors: 'you\'re email is already used',
      });
    }
  }
  let user: User | null;
  try {
    user = await User.findOne({ where: { facebookId } });
  } catch (err) {
    return res.status(500).send(err);
  }
  const defaultProfilePicture = picture ? picture.data.url : null;
  if (!user) {
    const newUser = await User.create({
      userName: `@${name.replace(/ /g, '')}`,
      pseudonym: name.replace(/ /g, ''),
      email,
      confirmed: true,
      facebookId,
      defaultProfilePicture,
    });
    return res.status(200).send(newUser);
  }
  // if (user.blackListId) {
  //   return res.status(400).send({
  //     errors: USER_IS_BLACK_LISTED,
  //   });
  // }
  if (email !== user.email
      || defaultProfilePicture !== user.defaultProfilePicture) {
    await user.update({ email, defaultProfilePicture });
  }
  setRefreshToken(req, user);
  const jwt = signAuthToken(user);
  return res.status(200).send({ token: jwt.token, expiresIn: jwt.expires, session: req.sessionID });
};

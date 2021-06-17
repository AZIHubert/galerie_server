// POST /galeries/:galerieId/users/:userId/blackLists/

import {
  Request,
  Response,
} from 'express';

import {
  Galerie,
  GalerieBlackList,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import {
  galerieBlackListExcluder,
  userExcluder,
} from '@src/helpers/excluders';
import {
  fetchCurrentProfilePicture,
} from '@src/helpers/fetch';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    galerieId,
    userId,
  } = req.params;
  const currentUser = req.user as User;
  const objectUserExcluder: { [key:string]: undefined} = {};
  const objectGalerieBlackListExcluder: { [key:string]: undefined} = {};
  let adminCurrentProfilePicture;
  let currentProfilePicture;
  let galerie: Galerie | null;
  let galerieBlackList: GalerieBlackList;
  let user: User | null;
  let userIdBlackListed: GalerieBlackList | null;

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }

  // Check if request.params.userId
  // is a UUID v4.
  if (!uuidValidatev4(userId)) {
    return res.status(400).send({
      errors: INVALID_UUID('user'),
    });
  }

  // TODO:
  // check that currentUser.id !== userId
  if (currentUser.id === userId) {
    return res.status(400).send({
      errors: 'you can\'t black list yourself',
    });
  }

  // Fetch galerie.
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [{
        model: User,
        where: {
          id: currentUser.id,
        },
      }],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if galerie exist.
  if (!galerie) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('galerie'),
    });
  }

  // Check if currentUser
  // is the creator or an admin
  // of this galerie.
  const userFromGalerie = galerie.users
    .find((u) => u.id === currentUser.id);
  if (!userFromGalerie || userFromGalerie.GalerieUser.role === 'user') {
    return res.status(400).send({
      errors: 'you\'re not allow to black list a user from this galerie',
    });
  }

  // TODO:
  // when request created
  // if(!user)
  // find user with galerieBlackList where galerieId === galerieId

  // Fetch user.
  try {
    user = await User.findByPk(userId, {
      include: [{
        model: Galerie,
        where: {
          id: galerieId,
        },
      }],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if user exist
  if (!user) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('user'),
    });
  }

  // The creator of this galerie can\'t be blackListed.
  const galerieFromeUser = user.galeries
    .find((u) => u.id === galerieId);
  if (!galerieFromeUser || galerieFromeUser.GalerieUser.role === 'creator') {
    return res.status(400).send({
      errors: 'the creator of this galerie can\'t be black listed',
    });
  }

  // Only the creator of this galerie
  // is allow to blackList an admin
  // of the galerie.
  if (
    galerieFromeUser.GalerieUser.role === 'admin'
    && userFromGalerie.GalerieUser.role === 'admin'
  ) {
    return res.status(400).send({
      errors: 'you\re not allow to black list an admin',
    });
  }

  // Fetch galerieBlackList
  try {
    userIdBlackListed = await GalerieBlackList.findOne({
      where: {
        galerieId,
        userId: user.id,
      },
    });
  } catch (err) {
    return res.status(400).send(err);
  }

  // Check that user is not
  // already blackList from this galerie.
  if (userIdBlackListed) {
    // If this error is reached
    // it mean that black listed user
    // has a galerieUser for the galerie
    // he is supposed to be blackListed.
    // This is a bug, so we destroy his
    // galerieUser for this galerie.
    try {
      await galerieFromeUser.GalerieUser.destroy();
    } catch (err) {
      return res.status(500).send(err);
    }
    return res.status(400).send({
      errors: 'this user is already black listed from this galerie',
    });
  }

  try {
    await galerieFromeUser.GalerieUser.destroy();
  } catch (err) {
    return res.status(500).send(err);
  }

  try {
    galerieBlackList = await GalerieBlackList.create({
      adminId: currentUser.id,
      galerieId,
      userId: user.id,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Fetch admin current profile picture.
  try {
    adminCurrentProfilePicture = await fetchCurrentProfilePicture(currentUser);
  } catch (err) {
    return res.status(500).send(err);
  }

  // Fetch current profile picture
  try {
    currentProfilePicture = await fetchCurrentProfilePicture(user);
  } catch (err) {
    return res.status(500).send(err);
  }

  userExcluder.forEach((e) => {
    objectUserExcluder[e] = undefined;
  });

  galerieBlackListExcluder.forEach((e) => {
    objectGalerieBlackListExcluder[e] = undefined;
  });

  const normalizeGalerieBlackList = {
    ...galerieBlackList.toJSON(),
    ...objectGalerieBlackListExcluder,
    admin: {
      ...currentUser.toJSON(),
      ...objectUserExcluder,
      currentProfilePicture: adminCurrentProfilePicture,
    },
    user: {
      ...user.toJSON(),
      ...objectUserExcluder,
      currentProfilePicture,
    },
  };

  return res.status(200).send({
    action: 'POST',
    data: {
      galerieBlackList: normalizeGalerieBlackList,
      galerieId,
      userId,
    },
  });
};

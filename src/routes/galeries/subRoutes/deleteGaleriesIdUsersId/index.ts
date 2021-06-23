// DELETE /galeries/:galerieId/users/:userId/

import {
  Request,
  Response,
} from 'express';

import {
  Frame,
  Galerie,
  GalerieBlackList,
  GalerieUser,
  Invitation,
  Like,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import gc from '@src/helpers/gc';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    galerieId,
    userId,
  } = req.params;
  const currentUser = req.user as User;
  let galerie: Galerie | null;
  let user: User | null;

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

  // Check if current user.id and req.params.userId
  // are not similar.
  if (currentUser.id === userId) {
    return res.status(400).send({
      errors: 'you cannot delete yourself',
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

  // Check if user's role for this galerie
  // is not user.
  const userFromGalerie = galerie.users
    .find((u) => u.id === currentUser.id);
  if (!userFromGalerie || userFromGalerie.GalerieUser.role === 'user') {
    return res.status(400).send({
      errors: 'you should be an admin or the creator of this galerie to delete a user',
    });
  }

  // Fetch user.
  try {
    user = await User.findOne({
      where: {
        id: userId,
      },
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

  // The creator of this galerie cannot
  // be deleted.
  const galerieFromUser = user.galeries
    .find((g) => g.id === galerieId);
  if (!galerieFromUser || galerieFromUser.GalerieUser.role === 'creator') {
    return res.status(400).send({
      errors: 'you can\'t delete the creator of this galerie',
    });
  }

  // An admin cannot delete
  // another admin.
  if (
    (
      !galerieFromUser
      || galerieFromUser.GalerieUser.role === 'admin'
    )
    && userFromGalerie.GalerieUser.role === 'admin'
  ) {
    return res.status(400).send({
      errors: 'you should be the creator of this galerie to delete an admin',
    });
  }

  // Destroy galerieUser.
  try {
    await GalerieUser.destroy({
      where: {
        userId,
        galerieId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  try {
    const frames = await Frame.findAll({
      include: [{
        all: true,
        include: [{
          all: true,
        }],
      }],
      where: {
        galerieId,
        userId: user.id,
      },
    });

    // Destroy all frames/galeriePictures/images
    // images from Google Buckets/likes.
    await Promise.all(
      frames.map(async (frame) => {
        await frame.destroy();
        await Promise.all(
          frame.galeriePictures.map(
            async (galeriePicture) => {
              const {
                originalImage,
                cropedImage,
                pendingImage,
              } = galeriePicture;

              await gc
                .bucket(pendingImage.bucketName)
                .file(pendingImage.fileName)
                .delete();
              await gc
                .bucket(originalImage.bucketName)
                .file(originalImage.fileName)
                .delete();
              await gc
                .bucket(cropedImage.bucketName)
                .file(cropedImage.fileName)
                .delete();
            },
          ),
        );
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  // Destroy all likes post by
  // deleted user on this galerie.
  // and decrement frames.numOfLikes.
  try {
    const framesLikeByCurrentUser = await Frame.findAll({
      include: [
        {
          model: Like,
          where: {
            userId: user.id,
          },
        },
      ],
      where: {
        galerieId,
      },
    });
    if (framesLikeByCurrentUser) {
      try {
        await Promise.all(
          framesLikeByCurrentUser.map(async (frame) => {
            await frame.decrement({ numOfLikes: 1 });
            await Promise.all(
              frame.likes.map(async (like) => {
                await like.destroy();
              }),
            );
          }),
        );
      } catch (err) {
        return res.status(500).send(err);
      }
    }
  } catch (err) {
    return res.status(500).send(err);
  }

  // Destroy invitation posted by deleted user.
  try {
    await Invitation.destroy({
      where: {
        galerieId,
        userId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Set createdById === nul for all galerieBlackList
  // posted by deleted user
  try {
    await GalerieBlackList.update({
      createdById: null,
    }, {
      where: {
        galerieId,
        createdById: user.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'DELETE',
    data: {
      galerieId,
      userId,
    },
  });
};

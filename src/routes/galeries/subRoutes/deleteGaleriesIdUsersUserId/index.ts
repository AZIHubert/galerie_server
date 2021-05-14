import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  Frame,
  Galerie,
  GalerieUser,
  Image,
  Like,
  User,
} from '@src/db/models';

import gc from '@src/helpers/gc';

export default async (req: Request, res: Response) => {
  const {
    id: galerieId,
    userId: UId,
  } = req.params;
  const { id: userId } = req.user as User;
  let galerie: Galerie | null;
  let user: User | null;

  // Check if current user.id and req.params.userId
  // are not similar.
  if (userId === UId) {
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
          id: userId,
        },
      }],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if galerie exist.
  if (!galerie) {
    return res.status(404).send({
      errors: 'galerie not found',
    });
  }

  // Check if user's role for this galerie
  // is not user.
  const { role } = galerie
    .users
    .filter((u) => u.id === userId)[0]
    .GalerieUser;
  if (role === 'user') {
    return res.status(400).send({
      errors: 'you should be an admin or the creator of this galerie to delete a user',
    });
  }

  // Fetch user.
  try {
    user = await User.findOne({
      where: {
        id: UId,
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
      errors: 'user not found',
    });
  }

  const { role: deletedRole } = user
    .galeries
    .filter((g) => g.id === galerieId)[0]
    .GalerieUser;

  // The creator of this galerie cannot
  // be deleted.
  if (deletedRole === 'creator') {
    return res.status(400).send({
      errors: 'you can\'t delete the creator of this galerie',
    });
  }

  // An admin cannot delete
  // another admin.
  if (
    deletedRole === 'admin'
    && role === 'admin'
  ) {
    return res.status(400).send({
      errors: 'you should be the creator of this galerie to delete an admin',
    });
  }

  // Destroy galerieUser.
  try {
    await GalerieUser.destroy({
      where: {
        userId: UId,
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

    await Promise.all(
      frames.map(async (frame) => {
        // Destroy all frames.
        await frame.destroy();
        await Promise.all(
          frame.galeriePictures.map(
            async (galeriePicture) => {
              const {
                originalImage,
                cropedImage,
                pendingImage,
              } = galeriePicture;
              // Destroy all Images.
              await Image.destroy({
                where: {
                  [Op.or]: [
                    {
                      id: cropedImage.id,
                    },
                    {
                      id: originalImage.id,
                    },
                    {
                      id: pendingImage.id,
                    },
                  ],
                },
              });

              // Delete all images from Google Buckets.
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

        // Destroy all likes posted on this frame.
        await Like.destroy({
          where: {
            frameId: frame.id,
          },
        });
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  // Destroy all likes posted by this user.
  try {
    await Like.destroy({
      where: {
        userId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'DELETE',
    data: {
      galerieId,
      userId: UId,
    },
  });
};

import { Request, Response } from 'express';

import {
  Frame,
  Galerie,
  GaleriePicture,
  Image,
  Like,
  Invitation,
  GalerieUser,
  User,
} from '@src/db/models';

import gc from '@src/helpers/gc';

export default async (req: Request, res: Response) => {
  const { id: userId } = req.user as User;
  const { id: galerieId } = req.params;
  let galerie: Galerie | null;
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
  if (!galerie) {
    return res.status(404).send({
      errors: 'galerie not found',
    });
  }
  const { role } = galerie
    .users
    .filter((user) => user.id === userId)[0]
    .GalerieUser;
  if (role === 'creator') {
    return res.status(400).send({
      errors: 'you cannot unsubscribe a galerie you\'ve created',
    });
  }
  try {
    const galerieUsers = await GalerieUser.findAll({
      where: {
        galerieId,
      },
    });
    await galerieUsers
      .filter((galerieUser) => galerieUser.userId === userId)[0]
      .destroy();
    if (galerieUsers.length - 1 < 1) {
      await galerie.update({ coverPictureId: null });
      const frames = await Frame.findAll({
        where: {
          galerieId: galerie.id,
        },
      });

      await Promise.all(frames.map(async (frame) => {
        const galeriePictures = await GaleriePicture.findAll({
          where: { frameId: frame.id },
          include: [
            {
              all: true,
            },
          ],
        });
        await Promise.all(
          galeriePictures.map(async (galeriePicture) => {
            const {
              originalImage,
              cropedImage,
              pendingImage,
            } = galeriePicture;
            await gc
              .bucket(originalImage.bucketName)
              .file(originalImage.fileName)
              .delete();
            await Image.destroy({
              where: {
                id: originalImage.id,
              },
            });
            await gc
              .bucket(cropedImage.bucketName)
              .file(cropedImage.fileName)
              .delete();
            await Image.destroy({
              where: {
                id: cropedImage.id,
              },
            });
            await gc
              .bucket(pendingImage.bucketName)
              .file(pendingImage.fileName)
              .delete();
            await Image.destroy({
              where: {
                id: pendingImage.id,
              },
            });
          }),
        );
        await GaleriePicture.destroy({
          where: { frameId: frame.id },
        });
        await Like.destroy({
          where: { frameId: frame.id },
        });
        await frame.destroy();
      }));
      await Invitation.destroy({
        where: {
          galerieId: galerie.id,
        },
      });
      await GalerieUser.destroy({
        where: {
          galerieId: galerie.id,
        },
      });
      await galerie.destroy();
    }
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    id: galerieId,
  });
};

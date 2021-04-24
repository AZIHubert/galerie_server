import { Request, Response } from 'express';

import {
  Frame,
  Galerie,
  GaleriePicture,
  Image,
  Like,
  User,
} from '@src/db/models';

import gc from '@src/helpers/gc';

export default async (req: Request, res: Response) => {
  const { id: userId } = req.user as User;
  const { id: galerieId, frameId } = req.params;
  let galerie: Galerie | null;
  let frame: Frame | null;
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
  try {
    frame = await Frame.findOne({
      where: {
        id: frameId,
        galerieId,
      },
      include: [{
        model: GaleriePicture,
      }],
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!frame) {
    return res.status(404).send({
      errors: 'frame not found',
    });
  }
  const { role } = galerie
    .users
    .filter((user) => user.id === userId)[0]
    .GalerieUser;
  if (
    userId !== frame.userId
    && role === 'user'
  ) {
    return res.status(400).send({
      errors: 'not allow to delete this frame',
    });
  }
  try {
    // if (
    //   frame
    //     .galeriePictures
    //     .map((galeriePicture) => galeriePicture.id)
    //     .includes(galerie.coverPictureId)
    // ) {
    //   await galerie.update({ coverPictureId: null });
    // }
    const galeriePictures = await GaleriePicture.findAll({
      where: { frameId },
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
        await galeriePicture.destroy();
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
    await Like.destroy({
      where: { frameId },
    });
    await frame.destroy();
  } catch (err) {
    return res.status(500).end();
  }
  return res.status(200).send({
    id: frameId,
  });
};

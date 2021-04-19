import { Request, Response } from 'express';

import { Image, ProfilePicture, User } from '@src/db/models';
import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const user = req.user as User;
  const { id: userId } = user;
  const { id } = req.params;
  let profilePicture: ProfilePicture | null;
  try {
    profilePicture = await ProfilePicture.findOne({
      where: {
        id,
        userId,
      },
      attributes: {
        exclude: [
          'createdAt',
          'cropedImageId',
          'deletedAt',
          'originalImageId',
          'pendingImageId',
          'updatedAt',
          'userId',
        ],
      },
      include: [
        {
          model: Image,
          as: 'cropedImage',
          attributes: {
            exclude: [
              'createdAt',
              'deletedAt',
              'updatedAt',
            ],
          },
        },
        {
          model: Image,
          as: 'originalImage',
          attributes: {
            exclude: [
              'createdAt',
              'deletedAt',
              'updatedAt',
            ],
          },
        },
        {
          model: Image,
          as: 'pendingImage',
          attributes: {
            exclude: [
              'createdAt',
              'deletedAt',
              'updatedAt',
            ],
          },
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!profilePicture) {
    return res.status(404).send({
      errors: 'profile picture not found',
    });
  }
  // if (user.currentProfilePictureId === id) {
  //   try {
  //     await user.update({ currentProfilePictureId: null });
  //     return res.status(200).send({
  //       type: 'PUT',
  //     });
  //   } catch (err) {
  //     return res.status(500).send(err);
  //   }
  // }
  try {
    await user.update({ currentProfilePictureId: id });
    const cropedImageSignedUrl = await signedUrl(
      profilePicture.cropedImage.bucketName,
      profilePicture.cropedImage.fileName,
    );
    profilePicture.cropedImage.signedUrl = cropedImageSignedUrl;
    const originalImageSignedUrl = await signedUrl(
      profilePicture.originalImage.bucketName,
      profilePicture.originalImage.fileName,
    );
    profilePicture.originalImage.signedUrl = originalImageSignedUrl;
    const pendingImageSignedUrl = await signedUrl(
      profilePicture.pendingImage.bucketName,
      profilePicture.pendingImage.fileName,
    );
    profilePicture.pendingImage.signedUrl = pendingImageSignedUrl;
    return res.status(200).send({
      type: 'PUT',
      profilePicture,
    });
  } catch (err) {
    return res.status(500).send(err);
  }
};

import { Request, Response } from 'express';

import Image from '@src/db/models/image';
import ProfilePicture from '@src/db/models/profilePicture';
import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const { id } = req.params;
  const { user: { id: userId } } = res.locals;
  let profilePicture: ProfilePicture | null;
  try {
    profilePicture = await ProfilePicture.findOne({
      where: {
        id,
        userId,
      },
      attributes: {
        exclude: [
          'originalImageId',
          'cropedImageId',
          'pendingImageId',
          'createdAt',
          'updatedAt',
        ],
      },
      include: [
        {
          model: Image,
          as: 'originalImage',
        },
        {
          model: Image,
          as: 'cropedImage',
        },
        {
          model: Image,
          as: 'pendingImage',
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
  try {
    const originalImageSignedUrl = await signedUrl(
      profilePicture.originalImage.bucketName,
      profilePicture.originalImage.fileName,
    );
    profilePicture.originalImage.signedUrl = originalImageSignedUrl;
    const cropedImageSignedUrl = await signedUrl(
      profilePicture.cropedImage.bucketName,
      profilePicture.cropedImage.fileName,
    );
    profilePicture.cropedImage.signedUrl = cropedImageSignedUrl;
    const pendingImageSignedUrl = await signedUrl(
      profilePicture.pendingImage.bucketName,
      profilePicture.pendingImage.fileName,
    );
    profilePicture.pendingImage.signedUrl = pendingImageSignedUrl;
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send(profilePicture);
};

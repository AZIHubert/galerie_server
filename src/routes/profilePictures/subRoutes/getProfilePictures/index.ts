import {
  Request,
  Response,
} from 'express';

import {
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import {
  imageExcluder,
  profilePictureExcluder,
} from '@src/helpers/excluders';
import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const user = req.user as User;
  const limit = 20;
  const { page } = req.query;
  const returnedProfilePictures: Array<any> = [];
  let offset: number;
  let profilePictures: ProfilePicture[];

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  try {
    profilePictures = await ProfilePicture.findAll({
      attributes: {
        exclude: profilePictureExcluder,
      },
      include: [
        {
          as: 'cropedImage',
          attributes: {
            exclude: imageExcluder,
          },
          model: Image,
        },
        {
          as: 'originalImage',
          attributes: {
            exclude: imageExcluder,
          },
          model: Image,
        },
        {
          as: 'pendingImage',
          attributes: {
            exclude: imageExcluder,
          },
          model: Image,
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      where: {
        userId: user.id,
      },
    });
    await Promise.all(
      profilePictures.map(
        async (profilePicture) => {
          const {
            cropedImage: {
              bucketName: cropedImageBucketName,
              fileName: cropedImageFileName,
            },
            originalImage: {
              bucketName: originalImageBucketName,
              fileName: originalImageFileName,
            },
            pendingImage: {
              bucketName: pendingImageBucketName,
              fileName: pendingImageFileName,
            },
          } = profilePicture;
          const cropedImageSignedUrl = await signedUrl(
            cropedImageBucketName,
            cropedImageFileName,
          );
          const originalImageSignedUrl = await signedUrl(
            originalImageBucketName,
            originalImageFileName,
          );
          const pendingImageSignedUrl = await signedUrl(
            pendingImageBucketName,
            pendingImageFileName,
          );
          const returnedProfilePicture = {
            ...profilePicture.toJSON(),
            cropedImage: {
              ...profilePicture.cropedImage.toJSON(),
              bucketName: undefined,
              fileName: undefined,
              signedUrl: cropedImageSignedUrl,
            },
            originalImage: {
              ...profilePicture.originalImage.toJSON(),
              bucketName: undefined,
              fileName: undefined,
              signedUrl: originalImageSignedUrl,
            },
            pendingImage: {
              ...profilePicture.pendingImage.toJSON(),
              bucketName: undefined,
              fileName: undefined,
              signedUrl: pendingImageSignedUrl,
            },
          };
          returnedProfilePictures.push(returnedProfilePicture);
        },
      ),
    );
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send({
    action: 'GET',
    data: {
      profilePictures: returnedProfilePictures,
    },
  });
};

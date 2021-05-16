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
  const { profilePictureId } = req.params;
  const { id: userId } = req.user as User;
  let profilePicture: ProfilePicture | null;
  let returnedProfilePicture: any;

  // Fetch profile picture
  try {
    profilePicture = await ProfilePicture.findOne({
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
      where: {
        id: profilePictureId,
        userId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!profilePicture) {
    return res.status(404).send({
      errors: 'profile picture not found',
    });
  }

  // fetch signed urls
  try {
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
    returnedProfilePicture = {
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
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      profilePicture: returnedProfilePicture,
    },
  });
};

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
  profilePictureExcluder,
  imageExcluder,
} from '@src/helpers/excluders';
import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const { profilePictureId } = req.params;
  const user = req.user as User;
  const { id: userId } = user;
  let profilePicture: ProfilePicture | null;
  let returnedProfilePicture: any;

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

  // If profile picture with id is not the current one,
  // set current profile picture to false if exist.
  if (!profilePicture.current) {
    try {
      await ProfilePicture.update({
        current: false,
      }, {
        where: {
          current: true,
          userId,
        },
      });
    } catch (err) {
      res.status(500).send(err);
    }
  }

  // Reverse profilePicture.current boolean value.
  try {
    await profilePicture.update({
      current: !profilePicture.current,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  try {
    const cropedImageSignedUrl = await signedUrl(
      profilePicture.cropedImage.bucketName,
      profilePicture.cropedImage.fileName,
    );
    const originalImageSignedUrl = await signedUrl(
      profilePicture.originalImage.bucketName,
      profilePicture.originalImage.fileName,
    );
    const pendingImageSignedUrl = await signedUrl(
      profilePicture.pendingImage.bucketName,
      profilePicture.pendingImage.fileName,
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
        updatedAt: undefined,
      },
      updatedAt: undefined,
    };
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'PUT',
    data: {
      profilePicture: returnedProfilePicture,
    },
  });
};

import {
  Request,
  Response,
} from 'express';

import {
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import { INVALID_UUID } from '@src/helpers/errorMessages';
import {
  imageExcluder,
  profilePictureExcluder,
} from '@src/helpers/excluders';
import gc from '@src/helpers/gc';
import signedUrl from '@src/helpers/signedUrl';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { profilePictureId } = req.params;
  const currentUser = req.user as User;
  let profilePicture: ProfilePicture | null;
  let returnedProfilePicture: any;

  // Check if request.params.blackListId
  // is a UUID v4.
  if (!uuidValidatev4(profilePictureId)) {
    return res.status(400).send({
      errors: INVALID_UUID('profile picture'),
    });
  }

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
        userId: currentUser.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if profile picture exist.
  if (!profilePicture) {
    return res.status(404).send({
      errors: 'profile picture not found',
    });
  }

  // fetch signed urls
  try {
    const {
      cropedImage,
      originalImage,
      pendingImage,
    } = profilePicture;
    if (
      cropedImage
      && originalImage
      && pendingImage
    ) {
      const cropedImageSignedUrl = await signedUrl(
        cropedImage.bucketName,
        cropedImage.fileName,
      );
      const originalImageSignedUrl = await signedUrl(
        originalImage.bucketName,
        originalImage.fileName,
      );
      const pendingImageSignedUrl = await signedUrl(
        pendingImage.bucketName,
        pendingImage.fileName,
      );
      if (
        cropedImageSignedUrl.OK
        && originalImageSignedUrl.OK
        && pendingImageSignedUrl.OK
      ) {
        returnedProfilePicture = {
          ...profilePicture.toJSON(),
          cropedImage: {
            ...profilePicture.cropedImage.toJSON(),
            bucketName: undefined,
            fileName: undefined,
            signedUrl: cropedImageSignedUrl.signedUrl,
          },
          originalImage: {
            ...profilePicture.originalImage.toJSON(),
            bucketName: undefined,
            fileName: undefined,
            signedUrl: originalImageSignedUrl.signedUrl,
          },
          pendingImage: {
            ...profilePicture.pendingImage.toJSON(),
            bucketName: undefined,
            fileName: undefined,
            signedUrl: pendingImageSignedUrl.signedUrl,
          },
        };
      } else {
        if (cropedImageSignedUrl.OK) {
          await gc
            .bucket(cropedImage.bucketName)
            .file(cropedImage.fileName)
            .delete();
        }
        if (originalImageSignedUrl.OK) {
          await gc
            .bucket(originalImage.bucketName)
            .file(originalImage.fileName)
            .delete();
        }
        if (pendingImageSignedUrl.OK) {
          await gc
            .bucket(pendingImage.bucketName)
            .file(pendingImage.fileName)
            .delete();
        }
        await cropedImage.destroy();
        await originalImage.destroy();
        await pendingImage.destroy();
        await profilePicture.destroy();
      }
    } else {
      if (cropedImage) {
        await cropedImage.destroy();
        await gc
          .bucket(cropedImage.bucketName)
          .file(cropedImage.fileName)
          .delete();
      }
      if (originalImage) {
        await originalImage.destroy();
        await gc
          .bucket(originalImage.bucketName)
          .file(originalImage.fileName)
          .delete();
      }
      if (pendingImage) {
        await pendingImage.destroy();
        await gc
          .bucket(pendingImage.bucketName)
          .file(pendingImage.fileName)
          .delete();
      }
      await profilePicture.destroy();
    }
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

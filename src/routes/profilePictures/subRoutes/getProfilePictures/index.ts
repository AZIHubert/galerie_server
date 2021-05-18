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
import gc from '@src/helpers/gc';
import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const { page } = req.query;
  const currentUser = req.user as User;
  const limit = 20;
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
        userId: currentUser.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  try {
    await Promise.all(
      profilePictures.map(
        async (profilePicture) => {
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
              const returnedProfilePicture = {
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
              returnedProfilePictures.push(returnedProfilePicture);
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

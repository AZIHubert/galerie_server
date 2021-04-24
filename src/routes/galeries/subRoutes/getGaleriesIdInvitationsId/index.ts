import { Request, Response } from 'express';

import {
  Galerie,
  Image,
  Invitation,
  ProfilePicture,
  User,
} from '@src/db/models';

import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const { id: userId } = req.user as User;
  const { id: galerieId, invitationId } = req.params;
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
  if (role === 'user') {
    return res.status(400).send({
      errors: 'not allow to fetch the invitation',
    });
  }
  let invitation: Invitation | null;
  try {
    invitation = await Invitation.findOne({
      where: {
        id: invitationId,
        galerieId,
      },
      attributes: {
        exclude: [
          'userId',
        ],
      },
      include: [{
        model: User,
        attributes: {
          exclude: [
            'authTokenVersion',
            'blackListId',
            'confirmed',
            'confirmTokenVersion',
            'currentProfilePictureId',
            'email',
            'facebookId',
            'googleId',
            'password',
            'resetPasswordTokenVersion',
            'updatedEmailTokenVersion',
          ],
        },
        include: [
          {
            model: ProfilePicture,
            as: 'currentProfilePicture',
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
          },
        ],
      }],
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!invitation) {
    return res.status(404).send({
      errors: 'invitation not found',
    });
  }
  try {
    if (invitation.user.currentProfilePicture) {
      const {
        currentProfilePicture: {
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
        },
      } = invitation.user;
      const cropedImageSignedUrl = await signedUrl(
        cropedImageBucketName,
        cropedImageFileName,
      );
      invitation
        .user
        .currentProfilePicture
        .cropedImage
        .signedUrl = cropedImageSignedUrl;
      const originalImageSignedUrl = await signedUrl(
        originalImageBucketName,
        originalImageFileName,
      );
      invitation
        .user
        .currentProfilePicture
        .originalImage
        .signedUrl = originalImageSignedUrl;
      const pendingImageSignedUrl = await signedUrl(
        pendingImageBucketName,
        pendingImageFileName,
      );
      invitation
        .user
        .currentProfilePicture
        .pendingImage
        .signedUrl = pendingImageSignedUrl;
    }
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send(invitation);
};

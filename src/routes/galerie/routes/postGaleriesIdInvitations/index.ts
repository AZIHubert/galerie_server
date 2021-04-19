import { Request, Response } from 'express';
import { customAlphabet } from 'nanoid';

import {
  Galerie,
  Image,
  Invitation,
  ProfilePicture,
  User,
} from '@src/db/models';

import {
  validateInvitation,
  normalizeJoiErrors,
} from '@src/helpers/schemas';
import signedUrl from '@src/helpers/signedUrl';

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
  if (galerie.archived) {
    return res.status(400).send({
      errors: 'you cannot post on an archived galerie',
    });
  }
  const { role } = galerie
    .users
    .filter((user) => user.id === userId)[0]
    .GalerieUser;
  if (role === 'user') {
    return res.status(400).send({
      errors: 'not allow to create an invit',
    });
  }
  const { error, value } = validateInvitation(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }
  let invitation: Invitation | null;
  try {
    const { id } = await Invitation.create({
      ...value,
      userId,
      galerieId,
      code: `${customAlphabet('1234567890', 4)()}-${customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 10)()}}`,
    });
    invitation = await Invitation.findByPk(id, {
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
    return res.status(500).send('something went wrong.');
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
      invitation.user.currentProfilePicture.cropedImage.signedUrl = cropedImageSignedUrl;
      const originalImageSignedUrl = await signedUrl(
        originalImageBucketName,
        originalImageFileName,
      );
      invitation.user.currentProfilePicture.originalImage.signedUrl = originalImageSignedUrl;
      const pendingImageSignedUrl = await signedUrl(
        pendingImageBucketName,
        pendingImageFileName,
      );
      invitation.user.currentProfilePicture.pendingImage.signedUrl = pendingImageSignedUrl;
    }
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send(invitation);
};

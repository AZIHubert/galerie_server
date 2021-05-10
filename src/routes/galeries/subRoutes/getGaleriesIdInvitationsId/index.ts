import {
  Request,
  Response,
} from 'express';

import {
  Galerie,
  Image,
  Invitation,
  ProfilePicture,
  User,
} from '@src/db/models';

import checkBlackList from '@src/helpers/checkBlackList';
import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const { id: userId } = req.user as User;
  const { id: galerieId, invitationId } = req.params;
  let currentProfilePicture: ProfilePicture | null;
  let galerie: Galerie | null;
  let invitation: Invitation | null;
  let returnedCurrentProfilePicture = null;
  let userIsBlackListed: boolean;

  // Fetch galerie.
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

  // Check if galerie exist.
  if (!galerie) {
    return res.status(404).send({
      errors: 'galerie not found',
    });
  }

  // Check if user'role for this galerie
  // is not 'user'.
  const { role } = galerie
    .users
    .filter((user) => user.id === userId)[0]
    .GalerieUser;
  if (role === 'user') {
    return res.status(400).send({
      errors: 'not allow to fetch the invitation',
    });
  }

  // Fetch invitation.
  try {
    invitation = await Invitation.findOne({
      attributes: {
        exclude: [
          'galerieId',
          'updatedAt',
          'userId',
        ],
      },
      include: [{
        attributes: {
          exclude: [
            'authTokenVersion',
            'confirmed',
            'confirmTokenVersion',
            'createdAt',
            'email',
            'emailTokenVersion',
            'facebookId',
            'googleId',
            'password',
            'resetPasswordTokenVersion',
            'updatedAt',
            'updatedEmailTokenVersion',
          ],
        },
        model: User,
      }],
      where: {
        id: invitationId,
        galerieId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if invitation exist.
  if (!invitation) {
    return res.status(404).send({
      errors: 'invitation not found',
    });
  }

  // Check if user is black listed.
  try {
    userIsBlackListed = await checkBlackList(invitation.user);
  } catch (err) {
    return res.status(500).send(err);
  }

  // If user is black listed
  // there no need to fetch
  // current profile picture,
  // invitation.user = null.
  if (!userIsBlackListed) {
    try {
      currentProfilePicture = await ProfilePicture.findOne({
        attributes: {
          exclude: [
            'createdAt',
            'cropedImageId',
            'current',
            'originalImageId',
            'pendingImageId',
            'updatedAt',
            'userId',
          ],
        },
        include: [
          {
            as: 'cropedImage',
            attributes: {
              exclude: [
                'createdAt',
                'id',
                'updatedAt',
              ],
            },
            model: Image,
          },
          {
            as: 'originalImage',
            attributes: {
              exclude: [
                'createdAt',
                'id',
                'updatedAt',
              ],
            },
            model: Image,
          },
          {
            as: 'pendingImage',
            attributes: {
              exclude: [
                'createdAt',
                'id',
                'updatedAt',
              ],
            },
            model: Image,
          },
        ],
        where: {
          current: true,
          userId: invitation.user.id,
        },
      });
    } catch (err) {
      return res.status(500).send(err);
    }

    try {
      if (currentProfilePicture) {
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
        } = currentProfilePicture;
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

        returnedCurrentProfilePicture = {
          ...currentProfilePicture.toJSON(),
          cropedImage: {
            ...currentProfilePicture.cropedImage.toJSON(),
            bucketName: undefined,
            fileName: undefined,
            signedUrl: cropedImageSignedUrl,
          },
          originalImage: {
            ...currentProfilePicture.originalImage.toJSON(),
            bucketName: undefined,
            fileName: undefined,
            signedUrl: originalImageSignedUrl,
          },
          pendingImage: {
            ...currentProfilePicture.pendingImage.toJSON(),
            bucketName: undefined,
            fileName: undefined,
            signedUrl: pendingImageSignedUrl,
          },
        };
      }
    } catch (err) {
      return res.status(500).send(err);
    }
  }

  const returnedInvitation = {
    ...invitation.toJSON(),
    user: !userIsBlackListed ? {
      ...invitation.user.toJSON(),
      currentProfilePicture: returnedCurrentProfilePicture,
    } : null,
  };

  return res.status(200).send({
    action: 'GET',
    data: {
      galerieId,
      invitation: returnedInvitation,
    },
  });
};

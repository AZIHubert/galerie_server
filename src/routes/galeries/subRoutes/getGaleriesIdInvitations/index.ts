import {
  Request,
  Response,
} from 'express';

import checkBlackList from '@src/helpers/checkBlackList';
import signedUrl from '@src/helpers/signedUrl';

import {
  Galerie,
  Image,
  Invitation,
  ProfilePicture,
  User,
} from '@src/db/models';

export default async (req: Request, res: Response) => {
  const limit = 20;
  const { id: galerieId } = req.params;
  const { page } = req.query;
  const { id: userId } = req.user as User;
  const returnedInvitations: Array<any> = [];
  let galerie: Galerie | null;
  let offset: number;

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

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
      errors: 'not allow to fetch the invitations',
    });
  }

  try {
    // Fetch all invitations.
    const invitations = await Invitation.findAll({
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
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      where: {
        galerieId,
      },
    });

    await Promise.all(
      invitations.map(async (invitation) => {
        // TODO:
        // Check if invitation is not exipired.
        // If true, destroy invitation
        // and do not push invitation
        // to returnedInvitations.

        let returnedCurrentProfilePicture = null;
        let userIsBlackListed: boolean = false;

        // check if user is blackListed.
        userIsBlackListed = await checkBlackList(invitation.user);

        // If user is black listed,
        // there no need to fetch current profile picture.
        // invitation.user = null.
        if (!userIsBlackListed) {
          // fetch current profile picture.
          const currentProfilePicture = await ProfilePicture.findOne({
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

          // If user have current profile picture
          // Fetch it's signed urls.
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
        }

        // Composed final invitation
        // and push it in returnedInvitations.
        const invitationWithUserWithProfilePicture: any = {
          ...invitation.toJSON(),
          user: !userIsBlackListed ? {
            ...invitation.user.toJSON(),
            currentProfilePicture: returnedCurrentProfilePicture,
          } : null,
        };
        returnedInvitations.push(invitationWithUserWithProfilePicture);
      }),
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      galerieId,
      invitations: returnedInvitations,
    },
  });
};

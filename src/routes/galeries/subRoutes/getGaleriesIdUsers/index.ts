import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import signedUrl from '@src/helpers/signedUrl';

import {
  Galerie,
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

// TODO:
// queryOrder createdAt should be user.galerieUser.
// [{ model: models.Image, as: 'IdeaHeaderImages' }, 'updated_at', 'asc]

export default async (req: Request, res: Response) => {
  const limit = 20;
  const { id: galerieId } = req.params;
  const { id: userId } = req.user as User;
  let direction = 'DESC';
  let galerie: Galerie | null;
  let offset: number;
  let order = 'createdAt';
  let users: User[];
  const {
    direction: queryDirection,
    order: queryOrder,
    page,
  } = req.query;
  const usersWithProfilePicture: Array<any> = [];

  if (
    queryDirection === 'ASC'
    || queryDirection === 'DESC'
  ) {
    direction = queryDirection;
  }

  if (
    queryOrder === 'createdAt'
    || queryOrder === 'pseudonym'
    || queryOrder === 'userName'
  ) {
    order = queryOrder;
  }

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

  // Find non black listed user
  // who subscribe to this galerie
  // with their respective role.
  try {
    users = await User.findAll({
      attributes: {
        exclude: [
          'authTokenVersion',
          'confirmed',
          'confirmTokenVersion',
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
      include: [
        {
          model: Galerie,
          where: {
            id: galerieId,
          },
        },
      ],
      limit,
      offset,
      order: [[order, direction]],
      where: {
        id: {
          [Op.not]: userId,
        },
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  try {
    await Promise.all(
      users.map(async (user) => {
        let returnedCurrentProfilePicture = null;

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
            userId: user.id,
          },
        });
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
        const returnedUser = {
          ...user.toJSON(),
          createdAt: undefined,
          currentProfilePicture: returnedCurrentProfilePicture,
          galerieRole: user.galeries[0].GalerieUser.role,
          galeries: undefined,
        };
        usersWithProfilePicture.push(returnedUser);
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      galerieId,
      users: usersWithProfilePicture,
    },
  });
};

import { Request, Response } from 'express';
import { Op } from 'sequelize';

import {
  Galerie,
  GaleriePicture,
  GalerieUser,
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

// import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const { id } = req.user as User;
  const limit = 20;
  const { page } = req.query;
  let offset: number;
  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }
  let galeries: Galerie[];
  const galerieWithUsers: Array<any> = [];
  try {
    galeries = await Galerie.findAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [{
        model: User,
        where: {
          id,
        },
      }, {
        model: GaleriePicture,
        attributes: {
          exclude: [
            'cropedImageId',
            'id',
            'index',
            'originalImageId',
            'pendingImageId',
            'frameId',
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
      }],
    });
    const galerieUsers: {[key:string]: 'user' | 'admin' | 'creator'} = {};
    await Promise.all(galeries.map(async (galerie) => {
      const galerieUser = await GalerieUser.findOne({
        where: {
          galerieId: galerie.id,
          userId: id,
        },
      });
      if (galerieUser) {
        galerieUsers[galerie.id] = galerieUser.role;
      }
      // if (galerie.coverPicture) {
      //   const {
      //     cropedImage: {
      //       bucketName: cropedImageBucketName,
      //       fileName: cropedImageFileName,
      //     },
      //     originalImage: {
      //       bucketName: originalImageBucketName,
      //       fileName: originalImageFileName,
      //     },
      //     pendingImage: {
      //       bucketName: pendingImageBucketName,
      //       fileName: pendingImageFileName,
      //     },
      //   } = galerie.coverPicture;
      //   const cropedImageSignedUrl = await signedUrl(
      //     cropedImageBucketName,
      //     cropedImageFileName,
      //   );
      //   galeries[index].coverPicture.cropedImage.signedUrl = cropedImageSignedUrl;
      //   const originalImageSignedUrl = await signedUrl(
      //     originalImageBucketName,
      //     originalImageFileName,
      //   );
      //   galeries[index].coverPicture.originalImage.signedUrl = originalImageSignedUrl;
      //   const pendingImageSignedUrl = await signedUrl(
      //     pendingImageBucketName,
      //     pendingImageFileName,
      //   );
      //   galeries[index].coverPicture.pendingImage.signedUrl = pendingImageSignedUrl;
      // }
      const users = await User.findAll({
        limit: 3,
        where: {
          blackListId: null,
          confirmed: true,
          id: {
            [Op.not]: id,
          },
        },
        attributes: {
          exclude: [
            'authTokenVersion',
            'blackListId',
            'confirmed',
            'confirmTokenVersion',
            'currentProfilePictureId',
            'email',
            'googleId',
            'password',
            'resetPasswordTokenVersion',
            'updatedEmailTokenVersion',
          ],
        },
        include: [{
          model: Galerie,
          where: {
            id: galerie.id,
          },
        }, {
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
        }],
      });
      // await Promise
      //   .all(users.map(async (user, userIndex) => {
      //     if (user.currentProfilePicture) {
      //       const {
      //         currentProfilePicture: {
      //           cropedImage: {
      //             bucketName: userCropedImageBucketName,
      //             fileName: userCropedImageFileName,
      //           },
      //           originalImage: {
      //             bucketName: userOriginalImageBucketName,
      //             fileName: userOriginalImageFileName,
      //           },
      //           pendingImage: {
      //             bucketName: userPendingImageBucketName,
      //             fileName: userPendingImageFileName,
      //           },
      //         },
      //       } = user;
      //       const userCropedImageSignedUrl = await signedUrl(
      //         userCropedImageBucketName,
      //         userCropedImageFileName,
      //       );
      //       users[userIndex]
      //         .currentProfilePicture
      //         .cropedImage
      //         .signedUrl = userCropedImageSignedUrl;
      //       const userOriginalImageSignedUrl = await signedUrl(
      //         userOriginalImageBucketName,
      //         userOriginalImageFileName,
      //       );
      //       users[userIndex]
      //         .currentProfilePicture
      //         .originalImage
      //         .signedUrl = userOriginalImageSignedUrl;
      //       const userPendingImageSignedUrl = await signedUrl(
      //         userPendingImageBucketName,
      //         userPendingImageFileName,
      //       );
      //       users[userIndex]
      //         .currentProfilePicture
      //         .pendingImage
      //         .signedUrl = userPendingImageSignedUrl;
      //     }
      //   }));
      galerieWithUsers.push({
        ...galerie.toJSON(),
        users: users.map((user) => user.toJSON()),
        role: galerieUser ? galerieUser.role : 'user',
      });
    }));
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send(galerieWithUsers);
};

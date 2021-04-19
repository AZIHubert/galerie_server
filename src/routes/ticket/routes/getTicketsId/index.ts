import { Request, Response } from 'express';

import {
  ProfilePicture,
  Image,
  Ticket,
  User,
} from '@src/db/models';

// import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const { id } = req.params;
  let ticket: Ticket | null;
  try {
    ticket = await Ticket.findByPk(id, {
      attributes: {
        exclude: [
          'updatedAt',
          'userId',
        ],
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: {
            exclude: [
              'authTokenVersion',
              'blackListId',
              'confirmed',
              'confirmTokenVersion',
              'currentProfilePictureId',
              'emailTokenVersion',
              'facebookId',
              'googleId',
              'password',
              'resetPasswordTokenVersion',
              'updatedEmailTokenVersion',
              'createdAt',
              'deletedAt',
              'updatedAt',
            ],
          },
          include: [
            {
              model: ProfilePicture,
              as: 'currentProfilePicture',
              attributes: {
                exclude: [
                  'cropedImageId',
                  'originalImageId',
                  'pendingImageId',
                  'userId',
                  'createdAt',
                  'deletedAt',
                  'updatedAt',
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
        },
      ],
    });
  } catch (err) {
    return res.status(500).end();
  }
  if (!ticket) {
    return res.status(404).send({
      errors: 'ticket not found',
    });
  }
  // try {
  //   if (ticket.user && ticket.user.currentProfilePicture) {
  //     const {
  //       currentProfilePicture: {
  //         cropedImage: {
  //           bucketName: cropedImageBucketName,
  //           fileName: cropedImageFileName,
  //         },
  //         originalImage: {
  //           bucketName: originalImageBucketName,
  //           fileName: originalImageFileName,
  //         },
  //         pendingImage: {
  //           bucketName: pendingImageBucketName,
  //           fileName: pendingImageFileName,
  //         },
  //       },
  //     } = ticket.user;
  //     const cropedImageSignedUrl = await signedUrl(
  //       cropedImageBucketName,
  //       cropedImageFileName,
  //     );
  //     ticket.user.currentProfilePicture.cropedImage.signedUrl = cropedImageSignedUrl;
  //     const originalImageSignedUrl = await signedUrl(
  //       originalImageBucketName,
  //       originalImageFileName,
  //     );
  //     ticket.user.currentProfilePicture.originalImage.signedUrl = originalImageSignedUrl;
  //     const pendingImageSignedUrl = await signedUrl(
  //       pendingImageBucketName,
  //       pendingImageFileName,
  //     );
  //     ticket.user.currentProfilePicture.pendingImage.signedUrl = pendingImageSignedUrl;
  //   }
  // } catch (err) {
  //   return res.status(500).send(err);
  // }
  return res.status(200).send(ticket);
};

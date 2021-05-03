import { Request, Response } from 'express';

import {
  Image,
  ProfilePicture,
  Ticket,
  User,
} from '@src/db/models';

import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const returnTickets: Array<any> = [];
  const limit = 20;
  const { page } = req.query;
  let offset: number;
  let tickets: Ticket[];

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  try {
    tickets = await Ticket.findAll({
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
              'confirmed',
              'confirmTokenVersion',
              'email',
              'emailTokenVersion',
              'facebookId',
              'googleId',
              'password',
              'resetPasswordTokenVersion',
              'updatedEmailTokenVersion',
              'updatedAt',
            ],
          },
        },
      ],
      limit,
      offset,
    });
    await Promise.all(
      tickets.map(async (ticket) => {
        let returnedCurrentProfilePicture = {};
        if (ticket.user) {
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
                    'updatedAt',
                  ],
                },
                model: Image,
              },
            ],
            where: {
              current: true,
              userId: ticket.user.id,
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
                createdAt: undefined,
                fileName: undefined,
                id: undefined,
                signedUrl: cropedImageSignedUrl,
                updatedAt: undefined,
              },
              cropedImageId: undefined,
              originalImage: {
                ...currentProfilePicture.originalImage.toJSON(),
                bucketName: undefined,
                createdAt: undefined,
                fileName: undefined,
                id: undefined,
                signedUrl: originalImageSignedUrl,
                updatedAt: undefined,
              },
              originalImageId: undefined,
              pendingImage: {
                ...currentProfilePicture.pendingImage.toJSON(),
                bucketName: undefined,
                createdAt: undefined,
                fileName: undefined,
                id: undefined,
                signedUrl: pendingImageSignedUrl,
                updatedAt: undefined,
              },
              pendingImageId: undefined,
              updatedAt: undefined,
              userId: undefined,
            };
            currentProfilePicture
              .cropedImage
              .signedUrl = cropedImageSignedUrl;
            currentProfilePicture
              .originalImage
              .signedUrl = originalImageSignedUrl;
            currentProfilePicture
              .pendingImage
              .signedUrl = pendingImageSignedUrl;
          }
        }
        const ticketWithUsersWithProfilPicture: any = {
          ...ticket.toJSON(),
          user: ticket.user ? {
            ...ticket.user.toJSON(),
            currentProfilePicture: returnedCurrentProfilePicture || undefined,
          } : undefined,
        };
        returnTickets.push(ticketWithUsersWithProfilPicture);
      }),
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
  return res.status(200).send({
    action: 'GET',
    data: {
      tickets: returnTickets,
    },
  });
};

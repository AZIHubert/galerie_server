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
  normalizeJoiErrors,
  validatePostGaleriesIdInvationsBody,
} from '@src/helpers/schemas';
import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const { id: galerieId } = req.params;
  const user = req.user as User;
  let galerie: Galerie | null;
  let invitation: Invitation | null;
  let returnedCurrentProfilePicture = null;

  // Fetch galerie.
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [{
        model: User,
        where: {
          id: user.id,
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

  // Check if galerie is not archived.
  if (galerie.archived) {
    return res.status(400).send({
      errors: 'you cannot post on an archived galerie',
    });
  }

  // Check if current user's role is
  // creator or admin.
  const { role } = galerie
    .users
    .filter((u) => u.id === user.id)[0]
    .GalerieUser;
  if (role === 'user') {
    return res.status(400).send({
      errors: 'not allow to create an invit',
    });
  }

  // Validate request.body.
  const {
    error,
    value,
  } = validatePostGaleriesIdInvationsBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  // create invitation.
  try {
    invitation = await Invitation.create({
      ...value,
      userId: user.id,
      galerieId,
      code: `${customAlphabet('1234567890', 4)()}-${customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 10)()}`,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Fetch current profile picture.
  try {
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
        userId: user.id,
        current: true,
      },
    });

    // If current profile picture exist,
    // Fetch signed URLs.
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

  const returnedInvitation = {
    ...invitation.toJSON(),
    galerieId: undefined,
    updatedAt: undefined,
    userId: undefined,
    user: {
      ...user.toJSON(),
      authTokenVersion: undefined,
      confirmed: undefined,
      confirmTokenVersion: undefined,
      createdAt: undefined,
      currentProfilePicture: returnedCurrentProfilePicture,
      email: undefined,
      emailTokenVersion: undefined,
      facebookId: undefined,
      googleId: undefined,
      password: undefined,
      resetPasswordTokenVersion: undefined,
      updatedAt: undefined,
      updatedEmailTokenVersion: undefined,
    },
  };

  return res.status(200).send({
    action: 'POST',
    data: {
      galerieId,
      invitation: returnedInvitation,
    },
  });
};

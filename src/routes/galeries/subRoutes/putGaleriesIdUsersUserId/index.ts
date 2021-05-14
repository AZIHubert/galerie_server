import {
  Request,
  Response,
} from 'express';

import {
  Galerie,
  GalerieUser,
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const { id: galerieId, userId: UId } = req.params;
  const { id: userId } = req.user as User;
  let galerie: Galerie | null;
  let galerieUser: GalerieUser | null;
  let returnedCurrentProfilePicture = null;
  let user: User | null;

  // Current user cannot update
  // his role himself.
  if (userId === UId) {
    return res.status(400).send({
      errors: 'you cannot change your role yourself',
    });
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

  // Check if current user role is
  // 'creator' or 'admin'.
  const { role } = galerie
    .users
    .filter((u) => u.id === userId)[0]
    .GalerieUser;
  if (role === 'user') {
    return res.status(400).send({
      errors: 'you should be an admin or the creator to update the role of a user',
    });
  }

  // Fetch galerieUser.
  try {
    galerieUser = await GalerieUser.findOne({
      where: {
        galerieId,
        userId: UId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if galerieUser exist.
  if (!galerieUser) {
    return res.status(404).send({
      errors: 'user not found',
    });
  }

  // The creator's role cannot change.
  if (galerieUser.role === 'creator') {
    return res.status(400).send({
      errors: 'you can\'t change the role of the creator of this galerie',
    });
  }

  // Only the creator of this galerie
  // can update the role of an admin.
  if (
    galerieUser.role === 'admin'
    && role !== 'creator'
  ) {
    return res.status(400).send({
      errors: 'you should be the creator of this galerie to update the role of an admin',
    });
  }

  // Fetch user.
  try {
    user = await User.findByPk(galerieUser.userId, {
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
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if user exist.
  if (!user) {
    return res.status(404).send({
      errors: 'user not found',
    });
  }

  // If user's role with :userId is 'admin',
  // his new role become 'user'.
  // If user's role with :userId is 'user',
  // his new role become 'admin'.
  try {
    await galerieUser.update({
      role: galerieUser.role === 'user' ? 'admin' : 'user',
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Fetch user current profile picture
  // and its signed URLs.
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
  } catch (err) {
    return res.status(500).send(err);
  }

  const returnedUser = {
    ...user.toJSON(),
    createdAt: undefined,
    currentProfilePicture: returnedCurrentProfilePicture,
    galerieRole: galerieUser.role,
  };

  return res.status(200).send({
    action: 'PUT',
    data: {
      galerieId,
      user: returnedUser,
    },
  });
};

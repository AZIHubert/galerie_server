// PUT /profilePictures/:profilePictureId/

import {
  Request,
  Response,
} from 'express';

import {
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import {
  profilePictureExcluder,
  imageExcluder,
} from '@src/helpers/excluders';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { profilePictureId } = req.params;
  const currentUser = req.user as User;
  let profilePicture: ProfilePicture | null;

  // Check if request.params.blackListId
  // is a UUID v4.
  if (!uuidValidatev4(profilePictureId)) {
    return res.status(400).send({
      errors: INVALID_UUID('profile picture'),
    });
  }

  // Fetch profile picture.
  try {
    profilePicture = await ProfilePicture.findOne({
      attributes: {
        exclude: profilePictureExcluder,
      },
      include: [
        {
          as: 'cropedImage',
          attributes: {
            exclude: imageExcluder,
          },
          model: Image,
        },
        {
          as: 'originalImage',
          attributes: {
            exclude: imageExcluder,
          },
          model: Image,
        },
        {
          as: 'pendingImage',
          attributes: {
            exclude: imageExcluder,
          },
          model: Image,
        },
      ],
      where: {
        id: profilePictureId,
        userId: currentUser.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if profile picture exist.
  if (!profilePicture) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('profile picture'),
    });
  }

  // If profile picture with id is not the current one,
  // set current profile picture to false if exist.
  if (!profilePicture.current) {
    try {
      await ProfilePicture.update({
        current: false,
      }, {
        where: {
          current: true,
          userId: currentUser.id,
        },
      });
    } catch (err) {
      res.status(500).send(err);
    }
  }

  // Reverse profilePicture.current boolean value.
  try {
    await profilePicture.update({
      current: !profilePicture.current,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'PUT',
    data: {
      current: profilePicture.current,
      profilePictureId,
    },
  });
};

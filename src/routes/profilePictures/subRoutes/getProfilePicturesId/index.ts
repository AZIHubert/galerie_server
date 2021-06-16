// GET profilePictures/:profilePictureId/

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
} from '@src/helpers/excluders';
import { fetchProfilePicture } from '@src/helpers/fetch';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { profilePictureId } = req.params;
  const currentUser = req.user as User;
  let profilePicture: ProfilePicture | null;
  let returnedProfilePicture: any;

  // Check if request.params.blackListId
  // is a UUID v4.
  if (!uuidValidatev4(profilePictureId)) {
    return res.status(400).send({
      errors: INVALID_UUID('profile picture'),
    });
  }

  // Fetch profile picture
  try {
    profilePicture = await ProfilePicture.findOne({
      attributes: {
        exclude: profilePictureExcluder,
      },
      include: [
        {
          as: 'cropedImage',
          model: Image,
        },
        {
          as: 'originalImage',
          model: Image,
        },
        {
          as: 'pendingImage',
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

  // fetch signed urls
  try {
    returnedProfilePicture = await fetchProfilePicture(profilePicture);
  } catch (err) {
    return res.status(500).send(err);
  }

  if (!returnedProfilePicture) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('profile picture'),
    });
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      profilePicture: returnedProfilePicture,
    },
  });
};

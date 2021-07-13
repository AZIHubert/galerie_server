import {
  Request,
  Response,
} from 'express';

import {
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import {
  fetchCurrentProfilePicture,
} from '#src/helpers/fetch';
import uuidValidateV4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    userId,
  } = req.params;
  const currentUser = req.user as User;
  let currentProfilePicture;
  let user: User | null;

  // Check if request.params.userId is a UUIDv4.
  if (!uuidValidateV4(userId)) {
    return res.status(400).send({
      errors: INVALID_UUID('user'),
    });
  }

  // Fetch user.
  try {
    user = await User.findByPk(userId);
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if user exist.
  if (!user) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('user'),
    });
  }

  // Fetch current profile picture.
  try {
    currentProfilePicture = await fetchCurrentProfilePicture(user, currentUser);
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      currentProfilePicture,
      userId,
    },
  });
};

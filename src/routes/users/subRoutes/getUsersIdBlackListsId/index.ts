import {
  Request,
  Response,
} from 'express';

import {
  BlackList,
  User,
} from '#src/db/models';

import {
  MODEL_NOT_FOUND,
  INVALID_UUID,
} from '#src/helpers/errorMessages';
import {
  blackListExcluder,
  userExcluder,
} from '#src/helpers/excluders';
import uuidValidateV4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    blackListId,
    userId,
  } = req.params;
  let user: User | null;

  // Check if request.params.userId is a UUIDv4.
  if (!uuidValidateV4(userId)) {
    return res.status(400).send({
      errors: INVALID_UUID('user'),
    });
  }

  // Check if request.params.blackListId is a UUIDv4.
  if (!uuidValidateV4(blackListId)) {
    return res.status(400).send({
      errors: INVALID_UUID('black list'),
    });
  }

  // Fetch user.
  try {
    user = await User.findByPk(userId, {
      include: [
        {
          as: 'blackListsUser',
          attributes: {
            exclude: blackListExcluder,
          },
          include: [
            {
              as: 'createdBy',
              attributes: {
                exclude: userExcluder,
              },
              model: User,
            },
            {
              as: 'updatedBy',
              attributes: {
                exclude: userExcluder,
              },
              model: User,
            },
          ],
          model: BlackList,
          required: false,
          where: {
            id: blackListId,
          },
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if user exist.
  if (!user) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('user'),
    });
  }

  // Check if blackList exist.
  if (!user.blackListsUser.length) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('black list'),
    });
  }

  const normalizeBlackList = {
    ...user.blackListsUser[0].toJSON(),
    createdBy: !user.blackListsUser[0].createdBy ? null : {
      ...user.blackListsUser[0].createdBy.toJSON(),
      currentProfilePicture: null,
    },
    updatedBy: !user.blackListsUser[0].updatedBy ? null : {
      ...user.blackListsUser[0].updatedBy.toJSON(),
      currentProfilePicture: null,
    },
  };

  return res.status(200).send({
    action: 'GET',
    data: {
      userId,
      blackList: normalizeBlackList,
    },
  });
};

// GET /users/id/:userId/blackLists/

import {
  Request,
  Response,
} from 'express';

import {
  BlackList,
  User,
} from '@src/db/models';

import {
  MODEL_NOT_FOUND,
  INVALID_UUID,
} from '@src/helpers/errorMessages';
import {
  blackListExcluder,
  userExcluder,
} from '@src/helpers/excluders';
import fetchCurrentProfilePicture from '@src/helpers/fetchCurrentProfilePicture';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { page } = req.query;
  const { userId } = req.params;
  const limit = 20;
  let blackLists: Array<BlackList>;
  let offset: number;
  let returnedBlackLists: Array<any> = [];

  // Check if request.params.userId
  // is a UUID v4.
  if (!uuidValidatev4(userId)) {
    return res.status(400).send({
      errors: INVALID_UUID('user'),
    });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send({
        errors: MODEL_NOT_FOUND('user'),
      });
    }
  } catch (err) {
    return res.status(500).send(err);
  }

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  try {
    blackLists = await BlackList.findAll({
      attributes: {
        exclude: blackListExcluder,
      },
      include: [
        {
          as: 'admin',
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
        {
          as: 'user',
          attributes: {
            exclude: userExcluder,
          },
          model: User,
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      where: {
        userId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  try {
    // Get black listed admin/updatedBy/user's
    // current profile picture  with their signed url.
    returnedBlackLists = await Promise.all(
      blackLists.map(async (blackList) => {
        const currentProfilePicture = await fetchCurrentProfilePicture(blackList.user);
        let adminCurrentProfilePicture;
        let updatedByCurrentProfilePicture;

        if (blackList.admin) {
          adminCurrentProfilePicture = await fetchCurrentProfilePicture(blackList.admin);
        }
        if (blackList.updatedBy) {
          updatedByCurrentProfilePicture = await fetchCurrentProfilePicture(blackList.updatedBy);
        }

        return {
          ...blackList.toJSON(),
          admin: blackList.admin ? {
            ...blackList.admin.toJSON(),
            currentProfilePicture: adminCurrentProfilePicture,
          } : null,
          updatedBy: blackList.updatedBy ? {
            ...blackList.updatedBy.toJSON(),
            currentProfilePicture: updatedByCurrentProfilePicture,
          } : null,
          user: {
            ...blackList.user.toJSON(),
            currentProfilePicture,
          },
        };
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      blackLists: returnedBlackLists,
      userId,
    },
  });
};

import {
  Request,
  Response,
} from 'express';

import {
  BlackList,
  User,
} from '@src/db/models';

import { INVALID_UUID } from '@src/helpers/errorMessages';
import {
  blackListExcluder,
  userExcluder,
} from '@src/helpers/excluders';
import fetchCurrentProfilePicture from '@src/helpers/fetchCurrentProfilePicture';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { blackListId } = req.params;
  let adminCurrentProfilePicture;
  let blackList: BlackList | null;
  let blackListExpire = false;
  let currentProfilePicture;
  let updatedByCurrentProfilePicture;

  // Check if request.params.blackListId
  // is a UUID v4.
  if (!uuidValidatev4(blackListId)) {
    return res.status(400).send({
      errors: INVALID_UUID('black list'),
    });
  }

  // Fetch black list.
  try {
    blackList = await BlackList.findByPk(blackListId, {
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
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if black list exist.
  if (!blackList) {
    return res.status(404).send({
      errors: 'black list not found',
    });
  }

  // Check if blackList.user exist.
  if (!blackList.user) {
    try {
      await blackList.destroy();
    } catch (err) {
      return res.status(500).send(err);
    }
    return res.status(404).send({
      errors: 'black list not found',
    });
  }

  // Check if black list is expired.
  if (blackList.time) {
    const time = new Date(
      blackList.createdAt.getTime() + blackList.time,
    );
    blackListExpire = time < new Date(Date.now());
  }
  if (blackListExpire) {
    try {
      await blackList.destroy();
    } catch (err) {
      return res.status(500).send(err);
    }
    return res.status(404).send({
      errors: 'black list not found',
    });
  }

  // Fetch user current profile picture
  try {
    currentProfilePicture = await fetchCurrentProfilePicture(blackList.user);
  } catch (err) {
    return res.status(500).send(err);
  }

  // Fetch admin current profile picture
  if (blackList.admin) {
    try {
      adminCurrentProfilePicture = await fetchCurrentProfilePicture(blackList.admin);
    } catch (err) {
      return res.status(500).send(err);
    }
  }

  if (blackList.updatedBy) {
    updatedByCurrentProfilePicture = await fetchCurrentProfilePicture(
      blackList.updatedBy,
    );
  }

  const returnedBlackList = {
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

  return res.status(200).send({
    action: 'GET',
    data: {
      blackList: returnedBlackList,
    },
  });
};

import {
  Request,
  Response,
} from 'express';

import {
  BetaKey,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import {
  userExcluder,
  betaKeyExcluder,
} from '@src/helpers/excluders';
import {
  fetchCurrentProfilePicture,
} from '@src/helpers/fetch';
import uuidValidateV4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    betaKeyId,
  } = req.params;
  const objectUserExcluder: {[key: string]: undefined} = {};
  let betaKey: BetaKey | null;
  let createdByCurrentProfilePicture;
  let userCurrentProfilePicture;

  if (!uuidValidateV4(betaKeyId)) {
    return res.status(400).send({
      errors: INVALID_UUID('beta key'),
    });
  }

  try {
    betaKey = await BetaKey.findByPk(betaKeyId, {
      attributes: {
        exclude: betaKeyExcluder,
      },
      include: [
        {
          as: 'createdBy',
          model: User,
        },
        {
          as: 'user',
          model: User,
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  if (!betaKey) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('beta key'),
    });
  }

  if (betaKey.createdBy) {
    try {
      createdByCurrentProfilePicture = await fetchCurrentProfilePicture(betaKey.createdBy);
    } catch (err) {
      return res.status(500).send(err);
    }
  }

  if (betaKey.user) {
    try {
      userCurrentProfilePicture = await fetchCurrentProfilePicture(betaKey.user);
    } catch (err) {
      return res.status(500).send(err);
    }
  }

  userExcluder.forEach((e) => {
    objectUserExcluder[e] = undefined;
  });

  const normalizeBetaKey = {
    ...betaKey.toJSON(),
    createdBy: !betaKey.createdBy ? null : {
      ...betaKey.createdBy.toJSON(),
      ...objectUserExcluder,
      currentProfilePicture: createdByCurrentProfilePicture,
    },
    user: !betaKey.user ? null : {
      ...betaKey.user.toJSON(),
      ...objectUserExcluder,
      currentProfilePicture: userCurrentProfilePicture,
    },
  };

  return res.status(200).send({
    action: 'GET',
    data: {
      betaKey: normalizeBetaKey,
    },
  });
};

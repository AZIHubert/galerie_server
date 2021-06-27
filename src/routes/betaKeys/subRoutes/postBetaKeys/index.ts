// POST /betaKeys/

import {
  Request,
  Response,
} from 'express';
import { customAlphabet } from 'nanoid';

import {
  BetaKey,
  User,
} from '@src/db/models';

import {
  DEFAULT_ERROR_MESSAGE,
} from '@src/helpers/errorMessages';
import {
  betaKeyExcluder,
  userExcluder,
} from '@src/helpers/excluders';
import {
  normalizeJoiErrors,
  validatePostBetaKeysBody,
} from '@src/helpers/schemas';

// Recursive function to check if code is unique
const checkIfCodeExis = async (limit: number) => {
  const code = `${customAlphabet('1234567890', 4)()}-${customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 10)()}`;
  const betaKeyWithCodeExist = await BetaKey.findOne({
    where: {
      code,
    },
  });
  if (betaKeyWithCodeExist) {
    if (limit < 15) {
      await checkIfCodeExis(limit + 1);
    } else {
      return false;
    }
  }
  return code;
};

export default async (req: Request, res: Response) => {
  const currentUser = req.user as User;
  const objectBetaKeyExcluder: {[key: string]: undefined} = {};
  const objectUserExcluder: {[key: string]: undefined} = {};
  let betaKey: BetaKey;
  let betaKeyWithEmail: BetaKey | null;
  let user: User | null;

  const {
    error,
    value,
  } = validatePostBetaKeysBody(req.body);

  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  if (value.email) {
    // the updated email
    // can\'t be already
    // registered on a beta key.
    try {
      betaKeyWithEmail = await BetaKey.findOne({
        where: {
          email: value.email,
        },
      });
    } catch (err) {
      return res.status(500).send(err);
    }
    if (betaKeyWithEmail) {
      return res.status(400).send({
        errors: 'this email is already used on a beta key',
      });
    }

    // the updated email
    // can't be used by a registered user.
    try {
      user = await User.findOne({
        where: {
          email: value.email,
        },
      });
    } catch (err) {
      return res.status(500).send(err);
    }
    if (user) {
      return res.status(400).send({
        errors: {
          email: 'this email is already used with this email',
        },
      });
    }
  }

  const code = await checkIfCodeExis(0);
  if (!code) {
    return res.status(500).send({
      errors: DEFAULT_ERROR_MESSAGE,
    });
  }

  // Create betaKey.
  try {
    betaKey = await BetaKey.create({
      code,
      createdById: currentUser.id,
      email: value.email ? value.email : null,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  betaKeyExcluder.forEach((e) => {
    objectBetaKeyExcluder[e] = undefined;
  });
  userExcluder.forEach((e) => {
    objectUserExcluder[e] = undefined;
  });

  const normalizeBetaKey = {
    ...betaKey.toJSON(),
    ...objectBetaKeyExcluder,
    createdBy: {
      ...currentUser.toJSON(),
      ...objectUserExcluder,
      currentProfilePicture: null,
      hasNewNotifications: undefined,
    },
  };

  return res.status(200).send({
    action: 'POST',
    data: {
      betaKey: normalizeBetaKey,
    },
  });
};

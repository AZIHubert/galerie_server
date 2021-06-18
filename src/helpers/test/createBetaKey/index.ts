import { customAlphabet } from 'nanoid';

import {
  BetaKey,
} from '@src/db/models';

export default async ({
  createdById,
  email,
  userId,
}: {
  createdById?: string;
  email?: string;
  userId?: string;
}) => {
  const betaKey = await BetaKey.create({
    code: `${customAlphabet('1234567890', 4)()}-${customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 10)()}`,
    createdById,
    email,
    usedAt: userId ? new Date(Date.now()) : null,
    userId,
  });

  return betaKey;
};

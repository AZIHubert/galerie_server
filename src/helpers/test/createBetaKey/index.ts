import { customAlphabet } from 'nanoid';

import {
  BetaKey,
} from '@src/db/models';

export default async ({
  createdById,
  userId,
}: {
  createdById?: string;
  userId?: string;
}) => {
  const betaKey = await BetaKey.create({
    code: `${customAlphabet('1234567890', 4)()}-${customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 10)()}`,
    createdById,
    usedAt: userId ? new Date(Date.now()) : null,
    userId,
  });

  return betaKey;
};

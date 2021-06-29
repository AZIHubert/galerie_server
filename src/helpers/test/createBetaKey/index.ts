import { customAlphabet } from 'nanoid';

import {
  BetaKey,
} from '#src/db/models';

export default async ({
  createdById,
  email,
  notificationHasBeenSend,
  userId,
}: {
  createdById?: string;
  email?: string;
  notificationHasBeenSend?: boolean;
  userId?: string;
}) => {
  const betaKey = await BetaKey.create({
    code: `${customAlphabet('1234567890', 4)()}-${customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 10)()}`,
    createdById,
    email,
    notificationHasBeenSend,
    userId,
  });

  return betaKey;
};

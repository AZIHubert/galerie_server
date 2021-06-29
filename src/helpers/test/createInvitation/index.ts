import { customAlphabet } from 'nanoid';

import {
  Invitation,
} from '#src/db/models';

export default async ({
  galerieId,
  numOfInvits,
  time,
  userId,
}: {
  galerieId: string;
  numOfInvits?: number;
  time?: number;
  userId: string;
}) => {
  const invitation = await Invitation.create({
    code: `${customAlphabet('1234567890', 4)()}-${customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 10)()}`,
    galerieId,
    numOfInvits,
    time: time ? new Date(Date.now() + time) : null,
    userId,
  });
  return invitation;
};

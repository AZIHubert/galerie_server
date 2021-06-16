import {
  Invitation,
} from '@src/db/models';

export default async ({
  code = '1234',
  galerieId,
  numOfInvits,
  time,
  userId,
}: {
  code?: string;
  galerieId: string;
  numOfInvits?: number;
  time?: number;
  userId: string;
}) => {
  const invitation = await Invitation.create({
    code,
    galerieId,
    numOfInvits,
    time: time ? new Date(Date.now() + time) : null,
    userId,
  });
  return invitation;
};

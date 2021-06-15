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
  time?: Date;
  userId: string;
}) => {
  const invitation = await Invitation.create({
    code,
    galerieId,
    numOfInvits,
    time,
    userId,
  });
  return invitation;
};

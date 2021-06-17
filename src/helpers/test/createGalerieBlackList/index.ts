import {
  GalerieBlackList,
} from '@src/db/models';

export default async ({
  adminId,
  galerieId,
  userId,
} : {
  adminId?: string;
  galerieId: string;
  userId: string;
}) => {
  const galerieBlackList = await GalerieBlackList.create({
    adminId,
    galerieId,
    userId,
  });

  return galerieBlackList;
};

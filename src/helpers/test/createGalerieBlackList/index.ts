import {
  GalerieBlackList,
} from '#src/db/models';

export default async ({
  createdById,
  galerieId,
  userId,
} : {
  createdById?: string;
  galerieId: string;
  userId: string;
}) => {
  const galerieBlackList = await GalerieBlackList.create({
    createdById,
    galerieId,
    userId,
  });

  return galerieBlackList;
};

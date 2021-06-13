import {
  BlackList,
  User,
} from '@src/db/models';

const blackListExpire = (blackList: BlackList) => {
  if (blackList.time) {
    return blackList.time < new Date(Date.now());
  }
  return false;
};

export default async (user: User) => {
  const blackList = await BlackList.findOne({
    where: {
      active: true,
      userId: user.id,
    },
  });
  if (blackList) {
    if (blackListExpire(blackList)) {
      await blackList.update({ active: false });
      return false;
    }
    return true;
  }
  return false;
};

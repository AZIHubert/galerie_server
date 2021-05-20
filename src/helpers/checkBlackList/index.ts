import {
  BlackList,
  User,
} from '@src/db/models';

const blackListExpire = (blackList: BlackList) => {
  if (blackList.time) {
    const time = new Date(
      blackList.createdAt.getTime() + blackList.time,
    );
    return time < new Date(Date.now());
  }
  return false;
};

export default async (user: User) => {
  const blackList = await BlackList.findOne({
    where: {
      userId: user.id,
    },
  });
  if (blackList) {
    if (blackListExpire(blackList)) {
      await blackList.destroy();
      return false;
    }
    return true;
  }
  return false;
};

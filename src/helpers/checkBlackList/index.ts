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
  if (user.isBlackListed) {
    const blackList = await BlackList.findOne({
      order: [['createdAt', 'DESC']],
      where: {
        userId: user.id,
      },
    });
    if (blackList && !blackListExpire(blackList)) {
      return true;
    }
    await user.update({
      blackListedAt: null,
      isBlackListed: false,
    });
    return false;
  }
  return false;
};

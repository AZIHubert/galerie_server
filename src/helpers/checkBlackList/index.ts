import BlackList from '@src/db/models/blackList';
import User from '@src/db/models/user';

const blackListExpire = (blackList: BlackList) => {
  if (blackList.time) {
    const time = new Date(
      blackList.createdAt.setMilliseconds(
        blackList.createdAt.getMilliseconds() + blackList.time,
      ),
    );
    return time > new Date(Date.now());
  }
  return false;
};

export default async (user: User) => {
  if (user.blackListId) {
    const blackList = await BlackList.findByPk(user.blackListId);
    if (blackList && blackListExpire(blackList)) {
      await blackList.destroy();
      await user.update({ blackListId: null });
      return false;
    }
    return true;
  }
  return false;
};

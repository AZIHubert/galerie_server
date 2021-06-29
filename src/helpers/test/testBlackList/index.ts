export default (
  blackList: any,
  refBlackList?: any,
) => {
  expect(blackList.createdById).toBeUndefined();
  expect(blackList.updatedById).toBeUndefined();
  expect(blackList.userId).toBeUndefined();
  if (refBlackList) {
    expect(blackList.autoIncrementId).toBe(refBlackList.autoIncrementId);
    expect(new Date(blackList.createdAt)).toEqual(new Date(refBlackList.createdAt));
    expect(blackList.id).toBe(refBlackList.id);
    expect(blackList.reason).toBe(refBlackList.reason);
    expect(new Date(blackList.updatedAt)).toEqual(new Date(refBlackList.updatedAt));
  } else {
    expect(blackList.autoIncrementId).not.toBeUndefined();
    expect(blackList.createdAt).not.toBeUndefined();
    expect(blackList.id).not.toBeUndefined();
    expect(blackList.reason).not.toBeUndefined();
    expect(blackList.updatedAt).not.toBeUndefined();
  }
};

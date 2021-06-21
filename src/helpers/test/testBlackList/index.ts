export default (
  blackList: any,
  refBlackList?: any,
) => {
  expect(blackList.createdById).toBeUndefined();
  expect(blackList.updatedById).toBeUndefined();
  expect(blackList.userId).toBeUndefined();
  if (refBlackList) {
    expect(new Date(blackList.createdBy)).toEqual(new Date(refBlackList.createdBy));
    expect(blackList.id).toBe(refBlackList.id);
    expect(blackList.reason).toBe(refBlackList.reason);
    expect(new Date(blackList.updatedBy)).toBe(new Date(refBlackList.updatedBy));
  } else {
    expect(blackList.createdBy).not.toBeUndefined();
    expect(blackList.id).not.toBeUndefined();
    expect(blackList.reason).not.toBeUndefined();
    expect(blackList.updatedBy).not.toBeUndefined();
  }
};

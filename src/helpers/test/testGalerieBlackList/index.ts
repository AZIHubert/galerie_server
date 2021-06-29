export default (
  galerieBlackList: any,
  refGalerieBlackList?: any,
) => {
  expect(galerieBlackList.createdById).toBeUndefined();
  expect(galerieBlackList.galerieId).toBeUndefined();
  expect(galerieBlackList.updatedAt).toBeUndefined();
  expect(galerieBlackList.userId).toBeUndefined();
  if (refGalerieBlackList) {
    expect(galerieBlackList.autoIncrementId).toBe(refGalerieBlackList.autoIncrementId);
    expect(galerieBlackList.id).toBe(refGalerieBlackList.id);
    expect(new Date(galerieBlackList.createdAt)).toEqual(new Date(refGalerieBlackList.createdAt));
  } else {
    expect(galerieBlackList.autoIncrementId).not.toBeUndefined();
    expect(galerieBlackList.id).not.toBeUndefined();
    expect(galerieBlackList.createdAt).not.toBeUndefined();
  }
};

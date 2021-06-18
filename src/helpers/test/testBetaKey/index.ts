export default (
  betaKey: any,
  refBetaKey?: any,
) => {
  expect(betaKey.updatedBy).toBeUndefined();
  expect(betaKey.createdById).toBeUndefined();
  expect(betaKey.userId).toBeUndefined();
  if (refBetaKey) {
    expect(betaKey.code).toBe(refBetaKey.code);
    expect(new Date(betaKey.createdAt)).toEqual(new Date(refBetaKey.createdAt));
    expect(betaKey.id).toBe(refBetaKey.id);
    expect(new Date(betaKey.usedAt)).toEqual(new Date(refBetaKey.usedAt));
  } else {
    expect(betaKey.code).not.toBeUndefined();
    expect(betaKey.createdAt).not.toBeUndefined();
    expect(betaKey.id).not.toBeUndefined();
    expect(betaKey.usedAt).not.toBeUndefined();
  }
};

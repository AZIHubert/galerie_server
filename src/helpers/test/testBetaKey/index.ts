export default (
  betaKey: any,
  refBetaKey?: any,
) => {
  expect(betaKey.createdById).toBeUndefined();
  expect(betaKey.userId).toBeUndefined();
  if (refBetaKey) {
    expect(betaKey.autoIncrementId).toBe(refBetaKey.autoIncrementId);
    expect(betaKey.code).toBe(refBetaKey.code);
    expect(new Date(betaKey.createdAt)).toEqual(new Date(refBetaKey.createdAt));
    expect(betaKey.email).toBe(refBetaKey.email);
    expect(betaKey.id).toBe(refBetaKey.id);
    expect(new Date(betaKey.updatedAt)).toEqual(new Date(refBetaKey.updatedAt));
  } else {
    expect(betaKey.autoIncrementId).not.toBeUndefined();
    expect(betaKey.code).not.toBeUndefined();
    expect(betaKey.createdAt).not.toBeUndefined();
    expect(betaKey.email).not.toBeUndefined();
    expect(betaKey.id).not.toBeUndefined();
    expect(betaKey.updatedAt).not.toBeUndefined();
  }
};

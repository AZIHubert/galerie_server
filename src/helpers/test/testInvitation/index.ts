export default (
  invitation: any,
  refInvitation?: any,
) => {
  expect(invitation.galerieId).toBeUndefined();
  expect(invitation.updatedAt).toBeUndefined();
  expect(invitation.userId).toBeUndefined();
  if (refInvitation) {
    expect(invitation.code).toBe(refInvitation.code);
    expect(new Date(invitation.createdAt)).toEqual(refInvitation.createdAt);
    expect(invitation.id).toBe(invitation.id);
    expect(invitation.numOfInvits).toBe(invitation.numOfInvits);
    expect(new Date(invitation.time)).toEqual(new Date(refInvitation.time));
  } else {
    expect(invitation.code).not.toBeUndefined();
    expect(invitation.createdAt).not.toBeUndefined();
    expect(invitation.id).not.toBeUndefined();
    expect(invitation.numOfInvits).not.toBeUndefined();
    expect(invitation.time).not.toBeUndefined();
  }
};

import {
  User,
} from '@src/db/models';

export default (
  user: User,
  refUser?: User,
) => {
  expect(user.authTokenVersion).toBeUndefined();
  expect(user.blackListedAt).toBeUndefined();
  expect(user.confirmed).toBeUndefined();
  expect(user.confirmTokenVersion).toBeUndefined();
  expect(user.emailTokenVersion).toBeUndefined();
  expect(user.email).toBeUndefined();
  expect(user.facebookId).toBeUndefined();
  expect(user.googleId).toBeUndefined();
  expect(user.hash).toBeUndefined();
  expect(user.isBlackListed).toBeUndefined();
  expect(user.resetPasswordTokenVersion).toBeUndefined();
  expect(user.salt).toBeUndefined();
  expect(user.updatedEmailTokenVersion).toBeUndefined();
  expect(user.updatedAt).toBeUndefined();
  if (refUser) {
    expect(new Date(user.createdAt)).toEqual(new Date(refUser.createdAt));
    expect(user.defaultProfilePicture).toBe(refUser.defaultProfilePicture);
    expect(user.id).toEqual(refUser.id);
    expect(user.pseudonym).toEqual(refUser.pseudonym);
    expect(user.role).toEqual(refUser.role);
    expect(user.userName).toEqual(refUser.userName);
    expect(user.socialMediaUserName).not.toBeUndefined();
  } else {
    expect(user.createdAt).not.toBeUndefined();
    expect(user.defaultProfilePicture).not.toBeUndefined();
    expect(user.id).not.toBeUndefined();
    expect(user.pseudonym).not.toBeUndefined();
    expect(user.role).not.toBeUndefined();
    expect(user.userName).not.toBeUndefined();
    expect(user.socialMediaUserName).not.toBeUndefined();
  }
};

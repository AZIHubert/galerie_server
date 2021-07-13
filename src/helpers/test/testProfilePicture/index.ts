export default (
  profilePicture: any,
  refProfilePicture?: any,
) => {
  expect(profilePicture.cropedImage.bucketName).toBeUndefined();
  expect(profilePicture.cropedImage.createdAt).toBeUndefined();
  expect(profilePicture.cropedImage.fileName).toBeUndefined();
  expect(profilePicture.cropedImage.format).not.toBeUndefined();
  expect(profilePicture.cropedImage.height).not.toBeUndefined();
  expect(profilePicture.cropedImage.id).toBeUndefined();
  expect(typeof profilePicture.cropedImage.signedUrl).toBe('string');
  expect(profilePicture.cropedImage.size).not.toBeUndefined();
  expect(profilePicture.cropedImage.updatedAt).toBeUndefined();
  expect(profilePicture.cropedImage.width).not.toBeUndefined();
  expect(profilePicture.cropedImagesId).toBeUndefined();
  expect(profilePicture.originalImage.bucketName).toBeUndefined();
  expect(profilePicture.originalImage.createdAt).toBeUndefined();
  expect(profilePicture.originalImage.fileName).toBeUndefined();
  expect(profilePicture.originalImage.format).not.toBeUndefined();
  expect(profilePicture.originalImage.height).not.toBeUndefined();
  expect(profilePicture.originalImage.id).toBeUndefined();
  expect(typeof profilePicture.originalImage.signedUrl).toBe('string');
  expect(profilePicture.originalImage.size).not.toBeUndefined();
  expect(profilePicture.originalImage.updatedAt).toBeUndefined();
  expect(profilePicture.originalImage.width).not.toBeUndefined();
  expect(profilePicture.originalImageId).toBeUndefined();
  expect(profilePicture.pendingImage.bucketName).toBeUndefined();
  expect(profilePicture.pendingImage.createdAt).toBeUndefined();
  expect(profilePicture.pendingImage.fileName).toBeUndefined();
  expect(profilePicture.pendingImage.format).not.toBeUndefined();
  expect(profilePicture.pendingImage.height).not.toBeUndefined();
  expect(profilePicture.pendingImage.id).toBeUndefined();
  expect(typeof profilePicture.pendingImage.signedUrl).toBe('string');
  expect(profilePicture.pendingImage.size).not.toBeUndefined();
  expect(profilePicture.pendingImage.updatedAt).toBeUndefined();
  expect(profilePicture.pendingImage.width).not.toBeUndefined();
  expect(profilePicture.pendingImageId).toBeUndefined();
  expect(profilePicture.usersReporting).toBeUndefined();
  expect(profilePicture.updatedAt).toBeUndefined();
  expect(profilePicture.userId).toBeUndefined();
  if (refProfilePicture) {
    expect(profilePicture.autoIncrementId).toBe(refProfilePicture.autoIncrementId);
    expect(new Date(profilePicture.createdAt)).toEqual(new Date(refProfilePicture.createdAt));
    expect(profilePicture.id).toBe(refProfilePicture.id);
    expect(profilePicture.current).toBe(refProfilePicture.current);
  } else {
    expect(profilePicture.autoIncrementId).not.toBeUndefined();
    expect(profilePicture.createdAt).not.toBeUndefined();
    expect(profilePicture.id).not.toBeUndefined();
    expect(profilePicture.current).not.toBeUndefined();
  }
};

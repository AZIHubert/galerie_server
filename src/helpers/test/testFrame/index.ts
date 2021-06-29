export default (
  frame: any,
  refFrame?: any,
) => {
  expect(frame.galerieId).toBeUndefined();
  expect(frame.galeriePictures[0].current).not.toBeUndefined();
  expect(frame.galeriePictures[0].createdAt).toBeUndefined();
  expect(frame.galeriePictures[0].cropedImage.createdAt).toBeUndefined();
  expect(frame.galeriePictures[0].cropedImage.format).not.toBeUndefined();
  expect(frame.galeriePictures[0].cropedImage.height).not.toBeUndefined();
  expect(frame.galeriePictures[0].cropedImage.id).toBeUndefined();
  expect(typeof frame.galeriePictures[0].cropedImage.signedUrl).toBe('string');
  expect(frame.galeriePictures[0].cropedImage.size).not.toBeUndefined();
  expect(frame.galeriePictures[0].cropedImage.updatedAt).toBeUndefined();
  expect(frame.galeriePictures[0].cropedImage.width).not.toBeUndefined();
  expect(frame.galeriePictures[0].cropedImageId).toBeUndefined();
  expect(frame.galeriePictures[0].index).not.toBeUndefined();
  expect(frame.galeriePictures[0].originalImage.createdAt).toBeUndefined();
  expect(frame.galeriePictures[0].originalImage.format).not.toBeUndefined();
  expect(frame.galeriePictures[0].originalImage.height).not.toBeUndefined();
  expect(frame.galeriePictures[0].originalImage.id).toBeUndefined();
  expect(typeof frame.galeriePictures[0].originalImage.signedUrl).toBe('string');
  expect(frame.galeriePictures[0].originalImage.size).not.toBeUndefined();
  expect(frame.galeriePictures[0].originalImage.updatedAt).toBeUndefined();
  expect(frame.galeriePictures[0].originalImage.width).not.toBeUndefined();
  expect(frame.galeriePictures[0].originalImageId).toBeUndefined();
  expect(frame.galeriePictures[0].pendingImage.createdAt).toBeUndefined();
  expect(frame.galeriePictures[0].pendingImage.format).not.toBeUndefined();
  expect(frame.galeriePictures[0].pendingImage.height).not.toBeUndefined();
  expect(frame.galeriePictures[0].pendingImage.id).toBeUndefined();
  expect(typeof frame.galeriePictures[0].pendingImage.signedUrl).toBe('string');
  expect(frame.galeriePictures[0].pendingImage.size).not.toBeUndefined();
  expect(frame.galeriePictures[0].pendingImage.updatedAt).toBeUndefined();
  expect(frame.galeriePictures[0].pendingImage.width).not.toBeUndefined();
  expect(frame.galeriePictures[0].pendingImageId).toBeUndefined();
  expect(frame.likes).toBeUndefined();
  expect(frame.liked).not.toBeUndefined();
  expect(frame.notificationHasBeenSend).toBeUndefined();
  expect(frame.updatedAt).toBeUndefined();
  expect(frame.userId).toBeUndefined();
  if (refFrame) {
    expect(frame.autoIncrementId).toBe(refFrame.autoIncrementId);
    expect(new Date(frame.createdAt)).toEqual(new Date(refFrame.createdAt));
    expect(frame.description).toBe(refFrame.description);
    expect(frame.id).toBe(refFrame.id);
    expect(frame.numOfLikes).toBe(refFrame.numOfLikes);
  } else {
    expect(frame.autoIncrementId).not.toBeUndefined();
    expect(frame.createdAt).not.toBeUndefined();
    expect(frame.description).not.toBeUndefined();
    expect(frame.galeriePictures[0].id).not.toBeUndefined();
    expect(frame.id).not.toBeUndefined();
    expect(frame.numOfLikes).not.toBeUndefined();
  }
};

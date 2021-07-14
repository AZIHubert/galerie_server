export default (
  galeriePicture: any,
  refGaleriePicture?: any,
) => {
  expect(galeriePicture.createdAt).toBeUndefined();
  expect(galeriePicture.cropedImageId).toBeUndefined();
  expect(galeriePicture.cropedImage.bucketName).toBeUndefined();
  expect(galeriePicture.cropedImage.createdAt).toBeUndefined();
  expect(galeriePicture.cropedImage.fileName).toBeUndefined();
  expect(galeriePicture.cropedImage.format).not.toBeUndefined();
  expect(galeriePicture.cropedImage.height).not.toBeUndefined();
  expect(galeriePicture.cropedImage.id).toBeUndefined();
  expect(galeriePicture.cropedImage.signedUrl).not.toBeUndefined();
  expect(galeriePicture.cropedImage.size).not.toBeUndefined();
  expect(galeriePicture.cropedImage.updatedAt).toBeUndefined();
  expect(galeriePicture.cropedImage.width).not.toBeUndefined();
  expect(galeriePicture.frameId).toBeUndefined();
  expect(galeriePicture.originalImageId).toBeUndefined();
  expect(galeriePicture.originalImage.bucketName).toBeUndefined();
  expect(galeriePicture.originalImage.createdAt).toBeUndefined();
  expect(galeriePicture.originalImage.fileName).toBeUndefined();
  expect(galeriePicture.originalImage.format).not.toBeUndefined();
  expect(galeriePicture.originalImage.height).not.toBeUndefined();
  expect(galeriePicture.originalImage.id).toBeUndefined();
  expect(galeriePicture.originalImage.signedUrl).not.toBeUndefined();
  expect(galeriePicture.originalImage.size).not.toBeUndefined();
  expect(galeriePicture.originalImage.updatedAt).toBeUndefined();
  expect(galeriePicture.originalImage.width).not.toBeUndefined();
  expect(galeriePicture.pendingHexes).not.toBeUndefined();
  expect(galeriePicture.updatedAt).toBeUndefined();

  if (refGaleriePicture) {
    expect(galeriePicture.current).toBe(refGaleriePicture.current);
    expect(galeriePicture.id).toBe(refGaleriePicture.id);
    expect(galeriePicture.index).toBe(refGaleriePicture.index);
  } else {
    expect(galeriePicture.current).not.toBeUndefined();
    expect(galeriePicture.id).not.toBeUndefined();
    expect(galeriePicture.index).not.toBeUndefined();
  }
};

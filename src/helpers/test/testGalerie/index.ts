export default (
  galerie: any,
  refGalerie?: any,
) => {
  expect(typeof galerie.allowNotification).toBe('boolean');
  expect(galerie.currentCoverPicture).not.toBeUndefined();
  expect(galerie.hasNewFrames).not.toBeUndefined();
  expect(galerie.role).not.toBeUndefined();
  expect(galerie.updatedAt).toBeUndefined();
  if (refGalerie) {
    expect(new Date(galerie.createdAt)).toEqual(new Date(refGalerie.createdAt));
    expect(galerie.defaultCoverPicture).toBe(refGalerie.defaultCoverPicture);
    expect(galerie.description).toBe(refGalerie.description);
    expect(galerie.frames.length).toBe(0);
    expect(galerie.hiddenName).toBe(refGalerie.hiddenName);
    expect(galerie.id).toBe(refGalerie.id);
    expect(galerie.name).toBe(refGalerie.name);
    expect(galerie.users.length).toBe(0);
  } else {
    expect(galerie.createdAt).not.toBeUndefined();
    expect(galerie.defaultCoverPicture).not.toBeUndefined();
    expect(galerie.description).not.toBeUndefined();
    expect(galerie.hiddenName).not.toBeUndefined();
    expect(galerie.id).not.toBeUndefined();
    expect(galerie.name).not.toBeUndefined();
  }
};

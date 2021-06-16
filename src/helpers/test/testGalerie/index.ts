export default (
  galerie: any,
  refGalerie?: any,
) => {
  expect(galerie.currentCoverPicture).not.toBeUndefined();
  expect(galerie.hasNewFrames).not.toBeUndefined();
  expect(galerie.role).not.toBeUndefined();
  expect(galerie.updatedAt).toBeUndefined();
  if (refGalerie) {
    expect(galerie.archived).toBe(refGalerie.archived);
    expect(new Date(galerie.createdAt)).toEqual(new Date(refGalerie.createdAt));
    expect(galerie.defaultCoverPicture).toBe(refGalerie.defaultCoverPicture);
    expect(galerie.description).toBe(refGalerie.description);
    expect(galerie.frames.length).toBe(0);
    expect(galerie.id).toBe(refGalerie.id);
    expect(galerie.name).toBe(refGalerie.name);
    expect(galerie.users.length).toBe(0);
  } else {
    expect(galerie.archived).not.toBeUndefined();
    expect(galerie.createdAt).not.toBeUndefined();
    expect(galerie.defaultCoverPicture).not.toBeUndefined();
    expect(galerie.description).not.toBeUndefined();
    expect(galerie.id).not.toBeUndefined();
    expect(galerie.name).not.toBeUndefined();
  }
};

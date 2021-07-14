import {
  Frame,
  GaleriePicture,
  Image,
} from '#src/db/models';

export default async ({
  current = false,
  description,
  galerieId,
  notificationHasBeenSend,
  numOfGaleriePictures = 1,
  userId,
}: {
  current?: boolean;
  description?: string;
  galerieId: string;
  notificationHasBeenSend?: boolean;
  numOfGaleriePictures?: number;
  userId: string;
}) => {
  const frame = await Frame.create({
    description,
    galerieId,
    notificationHasBeenSend,
    userId,
  });
  const iterator = Array(numOfGaleriePictures).fill(0);
  const galeriePictures = await Promise.all(
    iterator.map(async (_, index) => {
      const { id: imageId } = await Image.create({
        bucketName: 'bucketName',
        fileName: 'fileName',
        format: 'format',
        height: 10,
        size: 10,
        width: 10,
      });
      const galeriePicture = await GaleriePicture.create({
        cropedImageId: imageId,
        current: current && index === 0,
        frameId: frame.id,
        index,
        originalImageId: imageId,
      });
      return galeriePicture;
    }),
  );
  return {
    ...frame.toJSON(),
    galeriePictures: [
      ...galeriePictures.map((galeriePicture) => galeriePicture.toJSON()),
    ],
  } as {
    description?: string;
    galerieId: string;
    id: string;
    numOfLikes: number;
    userId: string;
    createdAt: Date;
    galeriePictures: Array<{
      cropedImageId: string;
      current: boolean;
      frameId: string;
      id: string;
      index: number;
      originalImageId: string;
    }>;
  };
};

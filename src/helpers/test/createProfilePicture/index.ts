import {
  Image,
  ProfilePicture,
} from '@src/db/models';

export default async ({
  current = false,
  userId,
}: {
  current?: boolean;
  userId: string;
}) => {
  const {
    id: imageId,
  } = await Image.create({
    bucketName: 'bucketName',
    fileName: 'fileName',
    format: 'format',
    height: 10,
    size: 10,
    width: 10,
  });
  await ProfilePicture.create({
    cropedImageId: imageId,
    current,
    originalImageId: imageId,
    pendingImageId: imageId,
    userId,
  });
};
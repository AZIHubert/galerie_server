import accEnv from '#src/helpers/accEnv';
import gc from '#src/helpers/gc';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');

export default async () => {
  const [cropedImages] = await gc
    .bucket(GALERIES_BUCKET_PP_CROP)
    .getFiles();
  const [originalImages] = await gc
    .bucket(GALERIES_BUCKET_PP)
    .getFiles();

  await Promise.all(cropedImages
    .map(async (image) => {
      await image.delete();
    }));
  await Promise.all(originalImages
    .map(async (image) => {
      await image.delete();
    }));
};

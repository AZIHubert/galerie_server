import gc from '../gc';

export default async (bucketName: string, fileName: string): Promise<{
  OK: false;
} | {
  OK: true,
  signedUrl: string;
}> => {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const galeriesBucket = gc.bucket(bucketName);
  const blob = galeriesBucket.file(fileName);
  const [fileExist] = await blob.exists();
  if (!fileExist) {
    return {
      OK: false,
    };
  }
  const [signedUrl] = await blob.getSignedUrl({
    action: 'read',
    expires,
  });
  return {
    OK: true,
    signedUrl,
  };
};

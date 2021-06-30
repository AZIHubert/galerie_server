import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  frameId: string,
  galeriePictureId: string,
) => {
  const response = await request(app)
    .put(`/frames/${frameId}/galeriePictures/${galeriePictureId}`)
    .set('authorization', token);
  return response;
};

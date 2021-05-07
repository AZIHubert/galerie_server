import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  galerieId: string,
  frameId: string,
  galeriePictureId: string,
) => {
  const response = await request(app)
    .put(`/galeries/${galerieId}/frames/${frameId}/galeriePictures/${galeriePictureId}`)
    .set('authorization', token);
  return response;
};

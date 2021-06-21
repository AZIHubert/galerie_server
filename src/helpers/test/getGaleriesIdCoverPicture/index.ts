import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  galerieId: string,
) => {
  const response = await request(app)
    .get(`/galeries/${galerieId}/coverPicture/`)
    .set('authorization', token);
  return response;
};

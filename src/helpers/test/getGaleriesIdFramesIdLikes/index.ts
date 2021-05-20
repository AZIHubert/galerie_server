import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  galerieId: string,
  frameId: string,
  page = 1,
) => {
  const response = await request(app)
    .get(`/galeries/${galerieId}/frames/${frameId}/likes/?page=${page}`)
    .set('authorization', token);
  return response;
};

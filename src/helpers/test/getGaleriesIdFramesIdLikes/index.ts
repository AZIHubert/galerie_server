import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  galerieId: string,
  frameId: string,
  option: {
    page: number;
  } = {
    page: 1,
  },
) => {
  const response = await request(app)
    .get(`/galeries/${galerieId}/frames/${frameId}/likes/?page=${option.page}`)
    .set('authorization', token);
  return response;
};

import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  galerieId: string,
  blackListId: string,
) => {
  const response = await request(app)
    .get(`/galeries/${galerieId}/blackLists/${blackListId}/`)
    .set('authorization', token);
  return response;
};

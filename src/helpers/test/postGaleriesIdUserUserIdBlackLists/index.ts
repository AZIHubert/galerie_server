import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  galerieId: string,
  userId: string,
) => {
  const response = await request(app)
    .post(`/galeries/${galerieId}/users/${userId}/blackLists`)
    .set('authorization', token);
  return response;
};

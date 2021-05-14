import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  galerieId: string,
  userId: string,
) => {
  const response = await request(app)
    .put(`/galeries/${galerieId}/users/${userId}`)
    .set('authorization', token);
  return response;
};

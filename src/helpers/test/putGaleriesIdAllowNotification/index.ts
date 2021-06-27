import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  galerieId: string,
) => {
  const response = await request(app)
    .put(`/galeries/${galerieId}/allowNotification`)
    .set('authorization', token);
  return response;
};

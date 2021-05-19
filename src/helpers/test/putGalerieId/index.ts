import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  galerieId: string,
  body: {
    description?: any;
    name?: any;
  },
) => {
  const response = await request(app)
    .put(`/galeries/${galerieId}`)
    .set('authorization', token)
    .send(body);
  return response;
};

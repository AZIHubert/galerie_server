import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  galerieId: string,
  body: {
    name?: any;
    password?: any;
  },
) => {
  const response = await request(app)
    .delete(`/galeries/${galerieId}`)
    .set('authorization', token)
    .send(body);
  return response;
};

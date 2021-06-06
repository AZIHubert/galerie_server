import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  galerieId: string,
  option: {
    body: {
      description?: any;
      name?: any;
    },
  } = {
    body: {},
  },
) => {
  const response = await request(app)
    .put(`/galeries/${galerieId}`)
    .set('authorization', token)
    .send(option.body);
  return response;
};

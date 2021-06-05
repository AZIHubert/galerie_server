import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  galerieId: string,
  option: {
    body: {
      name?: any;
      password?: any;
    },
  } = {
    body: {},
  },
) => {
  const response = await request(app)
    .delete(`/galeries/${galerieId}`)
    .set('authorization', token)
    .send(option.body);
  return response;
};

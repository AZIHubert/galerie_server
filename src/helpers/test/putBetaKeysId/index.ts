import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  betaKeyId: string,
  option: {
    body: {
      email?: any,
    },
  } = {
    body: {},
  },
) => {
  const response = await request(app)
    .put(`/betaKeys/${betaKeyId}`)
    .set('authorization', token)
    .send(option.body);
  return response;
};

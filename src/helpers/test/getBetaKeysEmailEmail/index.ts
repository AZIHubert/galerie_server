import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  email: string,
  option: {
    page?: number;
  } = {
    page: 1,
  },
) => {
  const response = await request(app)
    .get(`/betaKeys/email/${email}?page=${option.page}`)
    .set('authorization', token);
  return response;
};

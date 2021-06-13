import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  id: string,
  option: {
    page: number;
  } = {
    page: 1,
  },
) => {
  const response = await request(app)
    .get(`/users/id/${id}/blackLists?page=${option.page}`)
    .set('authorization', token);
  return response;
};

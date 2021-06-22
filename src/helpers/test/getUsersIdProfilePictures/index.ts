import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  userId: string,
  option: {
    page: number;
  } = {
    page: 1,
  },
) => {
  const response = await request(app)
    .get(`/users/${userId}/profilePictures?page=${option.page}`)
    .set('authorization', token);
  return response;
};

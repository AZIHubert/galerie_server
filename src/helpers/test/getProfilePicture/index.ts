import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  id: string,
) => {
  const response = await request(app)
    .get(`/users/me/profilePictures/${id}`)
    .set('authorization', token);
  return response;
};

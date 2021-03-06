import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  userId: string,
) => {
  const response = await request(app)
    .get(`/users/${userId}/currentProfilePicture/`)
    .set('authorization', token);
  return response;
};

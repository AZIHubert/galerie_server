import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  option: {
    previousProfilePicture?: string;
  } = {},
) => {
  let response: request.Response;
  if (option.previousProfilePicture) {
    response = await request(app)
      .get(`/profilePictures?previousProfilePicture=${option.previousProfilePicture}`)
      .set('authorization', token);
  } else {
    response = await request(app)
      .get('/profilePictures/')
      .set('authorization', token);
  }
  return response;
};

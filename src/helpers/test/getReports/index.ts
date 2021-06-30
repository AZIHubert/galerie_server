import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  option: {
    classed?: string;
    previousReport?: string
  } = {},
) => {
  const {
    classed,
    previousReport,
  } = option;
  let query = '';
  if (classed) {
    query = `${query}${query === '' ? '' : '&'}classed=${classed}`;
  }
  if (previousReport) {
    query = `${query}${query === '' ? '' : '&'}previousReport=${previousReport}`;
  }
  const response = await request(app)
    .get(`/reports/${query === '' ? '' : `?${query}`}`)
    .set('authorization', token);
  return response;
};

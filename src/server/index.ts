import bodyParser from 'body-parser';
import express from 'express';

export default () => {
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true, limit: '5m' }));
  return app;
};

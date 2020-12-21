import express from 'express';

const app = express();
const PORT = process.env.PORT || 8000;

app.get('/', (_, res) => res.send('INDEX'));

const appListen = () => {
  app.listen(PORT, async () => {
    console.log(`Server is running on PORT ${PORT}`);
  });
};

export default appListen;

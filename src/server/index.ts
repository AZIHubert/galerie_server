import express from 'express';

const app = express();
const PORT = process.env.PORT || 8000;

const startApp = () => {
  app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
  });
};

export default startApp;

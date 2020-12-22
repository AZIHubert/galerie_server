import { Router } from 'express';

const router = Router();

router.post('/create', (_, res) => {
  res.status(200).end();
});

export default router;

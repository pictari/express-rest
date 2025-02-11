import express, {Router} from 'express';
import { postVerification } from '../controllers/verification';

const router: Router = express.Router();

router.post('/:address', postVerification);

export default router;
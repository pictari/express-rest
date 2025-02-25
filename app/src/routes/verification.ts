import express, {Router} from 'express';
import { getVerification } from '../controllers/verification';

const router: Router = express.Router();

router.get('/:address', getVerification);

export default router;
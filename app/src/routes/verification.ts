import express, {Router} from 'express';
import { getVerification } from '../controllers/verification';

const router: Router = express.Router();

// this is the link that a player must click in the email they receive
router.get('/:address', getVerification);

export default router;
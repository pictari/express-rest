import express, {Router} from 'express';
import { getVerification } from '../controllers/verification';

const router: Router = express.Router();

// this is the link that a player must click in the email they receive
// therefore, it must be GET even though the person doesn't receive anything back and it creates backend changes - this is due to browser limitations
router.get('/:address', getVerification);

export default router;
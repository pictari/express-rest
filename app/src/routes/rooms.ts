import express, {Router} from 'express';
import { getPrivateRoomDetails, getRoomDetails, getRoomsList } from '../controllers/rooms';
import { verifyJWT, verifyVerification } from '../auth/auth';

const router: Router = express.Router();

router.get('/', getRoomsList);

// only logged-in and verified players can join for now, so this prevents stress on the database
router.get('/:id', verifyJWT, verifyVerification, getRoomDetails);
router.get('/private/:key', verifyJWT, verifyVerification, getPrivateRoomDetails);

export default router;
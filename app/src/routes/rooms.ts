import express, {Router} from 'express';
import { getPrivateRoomDetails, getRoomDetails, getRoomsList } from '../controllers/rooms';
import { verifyJWT, verifyVerification } from '../auth/auth';

const router: Router = express.Router();

// server list
router.get('/', getRoomsList);

// individual room
router.get('/:id', getRoomDetails);

// only logged-in and verified players can join for now, so this prevents stress on the database
router.get('/private/:key', verifyJWT, verifyVerification, getPrivateRoomDetails);

export default router;
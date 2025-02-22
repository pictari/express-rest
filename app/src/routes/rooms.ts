import express, {Router} from 'express';
import { getPrivateRoomDetails, getRoomDetails, getRoomsList } from '../controllers/rooms';

const router: Router = express.Router();

router.get('/', getRoomsList);
router.get('/:id', getRoomDetails);
router.get('/private/:key', getPrivateRoomDetails);

export default router;
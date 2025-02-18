import express, {Router} from 'express';
import { getRoomDetails, getRoomsList } from '../controllers/rooms';

const router: Router = express.Router();

router.get('/', getRoomsList);
router.get('/:id', getRoomDetails);

export default router;
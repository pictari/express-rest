import express, {Router} from 'express';
import { getRoomsList } from '../controllers/rooms';

const router: Router = express.Router();

router.get('/', getRoomsList);

export default router;
import express, {Router} from 'express';
import { postLogin } from '../controllers/login';

const router: Router = express.Router();

router.post('/', postLogin);

export default router;
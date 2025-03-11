import express, {Router} from 'express';
import { postLogin } from '../controllers/login';

const router: Router = express.Router();

// submit valid credentials in request body to get a JWT back
router.post('/', postLogin);

export default router;
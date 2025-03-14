import express, {Router} from 'express';
import { getMostRecentGame, getRecentGames } from '../controllers/game';

const router: Router = express.Router();

router.get('/', getMostRecentGame);
router.get('/page/:page', getRecentGames);

//router.get('/drawing/:id', getOnlyFirstDrawing);
//router.get('/:id', getGameDetails);

//router.get('/account/recent/:uuid', getRecentAccountEntries);
//router.get('/account/ratings/:uuid/:id', getPersonalRatingsForGame);

//router.post('/:id/:stream/:index', postNewRating);

export default router;
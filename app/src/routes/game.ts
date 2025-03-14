import express, {Router} from 'express';
import { deleteRating, getGameDetails, getMostRecentGame, getOnlyFirstDrawing, getPersonalRatingsForGame, getRecentAccountEntries, getRecentGames, postNewRating, putRating } from '../controllers/game';
import { verifyJWT, verifyOwner } from '../auth/auth';

const router: Router = express.Router();

router.get('/', getMostRecentGame);
router.get('/page/:page', getRecentGames);

router.get('/drawing/:id', getOnlyFirstDrawing);
router.get('/:id', getGameDetails);

router.get('/account/recent/:uuid', getRecentAccountEntries);

// presumed that the player would want this private
router.get('/account/ratings/:uuid/:id', verifyJWT, verifyOwner, getPersonalRatingsForGame);

router.post('/rate/:id/:stream/:index', verifyJWT, postNewRating);
router.put('/rate/:id/:stream/:index', putRating);
router.delete('/rate/:id/:stream/:index', deleteRating);

export default router;
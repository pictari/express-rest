import express, {Router} from 'express';
import { deleteRating, getGameDetails, getOnlyFirstDrawing, getPersonalRatingsForGame, getRecentAccountEntries, getRecentGames, postNewRating, putRating } from '../controllers/game';
import { verifyJWT, verifyOwner } from '../auth/auth';

const router: Router = express.Router();

// used in main menu displays
router.get('/page/:page', getRecentGames);

// used in profile page history displays
router.get('/drawing/:id', getOnlyFirstDrawing);
router.get('/account/recent/:uuid', getRecentAccountEntries);

// for checking out an individual game
router.get('/:id', getGameDetails);

// presumed that the player would want this private
// intended to be used when viewing game details
router.get('/account/ratings/:uuid/:id', verifyJWT, verifyOwner, getPersonalRatingsForGame);

// for editing ratings made by an account on a single entry
router.post('/rate/:id/:stream/:index', verifyJWT, postNewRating);
router.put('/rate/:id/:stream/:index', verifyJWT, putRating);
router.delete('/rate/:id/:stream/:index', verifyJWT, deleteRating);

export default router;
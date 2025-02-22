import express, {Router} from 'express';
import { deleteBlock, deleteFriend, deleteRequest, getAccountBlockedList, getAccountFriends, getAccountPendingFriendships, getAccountSearchByName, getPersonalAccountInfo, getPublicAccountShortened, getPublicAccountStatistics, postAcceptRequest, postNewAccount, postNewBlock, postNewFriendRequest, putNewAccountSettings } from '../controllers/account';


const router: Router = express.Router();

router.get('/:uuid', getPublicAccountShortened);
router.get('/:uuid/profile', getPublicAccountStatistics);
router.get('/:uuid/profile/settings', getPersonalAccountInfo);
router.get('/:uuid/friends', getAccountFriends);
router.get('/:uuid/friends/pending', getAccountPendingFriendships);
router.get('/:uuid/blocks', getAccountBlockedList);

router.get('/search/:name', getAccountSearchByName);

// change to auth route later
router.post('/', postNewAccount);

router.post('/:uuid/friends/:uuid2', postNewFriendRequest);
router.post('/:uuid/blocks/:uuid2', postNewBlock);
router.post('/:uuid/friends/:uuid2/pending', postAcceptRequest);

router.put('/:uuid/profile/settings', putNewAccountSettings);

router.delete('/:uuid/friends/:uuid2', deleteFriend);
router.delete('/:uuid/blocks/:uuid2', deleteBlock);
router.delete('/:uuid/friends/:uuid2/pending', deleteRequest);
export default router;
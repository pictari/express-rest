import express, {Router} from 'express';
import { deleteBlock, deleteFriend, deleteRequest, getAccountBlockedList, getAccountFriends, getAccountPendingFriendships, getPersonalAccountInfo, getPublicAccountShortened, getPublicAccountStatistics, postAcceptRequest, postNewBlock, postNewFriendRequest } from '../controllers/account';

const router: Router = express.Router();

router.get('/:uuid', getPublicAccountShortened);
router.get('/:uuid/profile', getPublicAccountStatistics);
router.get('/:uuid/profile/settings', getPersonalAccountInfo);
router.get('/:uuid/friends', getAccountFriends);
router.get('/:uuid/friends/pending', getAccountPendingFriendships);
router.get('/:uuid/blocks', getAccountBlockedList);

// change to auth route later
//router.post('/', endpointForNewAccount);

router.post('/:uuid/friends/:uuid2', postNewFriendRequest);
router.post('/:uuid/blocks/:uuid2', postNewBlock);
router.post('/:uuid/friends/:uuid2/pending', postAcceptRequest);

//router.put('/:uuid/profile/settings', endpointForChangingSettings);

router.delete('/:uuid/friends/:uuid2', deleteFriend);
router.delete('/:uuid/blocks/:uuid2', deleteBlock);
router.delete('/:uuid/friends/:uuid2/pending', deleteRequest);
export default router;
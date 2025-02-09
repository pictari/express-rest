import express, {Router} from 'express';
import { getAccountBlockedList, getAccountFriends, getAccountPendingFriendships, getPersonalAccountInfo, getPublicAccountShortened, getPublicAccountStatistics, postNewBlock, postNewFriendRequest } from '../controllers/account';

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
//router.post('/:uuid/friends/:uuid2/pending', endpointForAcceptingRequests);

//router.put('/:uuid/profile/settings', endpointForChangingSettings);

//router.delete('/:uuid/friends/:uuid2', endpointForDeletingFriendship);
//router.delete('/:uuid/blocks/:uuid2', endpointForDeletingBlocks);
//router.delete('/:uuid/friends/:uuid2/pending', endpointForRejectingRequests);
export default router;
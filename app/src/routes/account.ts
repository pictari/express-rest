import express, {Router} from 'express';
import { deleteBlock, deleteFriend, deleteRequest, getAccountBlockedList, getAccountFriends, getAccountPendingFriendships, getAccountSearchByName, getPersonalAccountInfo, getPublicAccountShortened, getPublicAccountStatistics, postAcceptRequest, postNewAccount, postNewBlock, postNewFriendRequest, putNewAccountSettings } from '../controllers/account';
import { verifyJWT, verifyOwner, verifyVerification } from '../auth/auth';


const router: Router = express.Router();

router.get('/:uuid', getPublicAccountShortened);
router.get('/:uuid/profile', getPublicAccountStatistics);
router.get('/:uuid/profile/settings', verifyJWT, verifyOwner, getPersonalAccountInfo);
router.get('/:uuid/friends', getAccountFriends);

// it may not be desirable to make these public
router.get('/:uuid/friends/pending', verifyJWT, verifyOwner, getAccountPendingFriendships);
router.get('/:uuid/blocks', verifyJWT, verifyOwner, getAccountBlockedList);

// you will only ever need to use this function when you're logged in, so JWT verification prevents stress on the database
router.get('/search/:name', verifyJWT, getAccountSearchByName);

router.post('/', postNewAccount);

router.post('/:uuid/friends/:uuid2', verifyJWT, verifyVerification, verifyOwner, postNewFriendRequest);
router.post('/:uuid/blocks/:uuid2', verifyJWT, verifyVerification, verifyOwner, postNewBlock);
router.post('/:uuid/friends/:uuid2/pending', verifyJWT, verifyVerification, verifyOwner, postAcceptRequest);

router.put('/:uuid/profile/settings', verifyJWT, verifyOwner, putNewAccountSettings);

// if non-verified users can't create friends/blocks/etc, reduce stress on database checking account relationships
router.delete('/:uuid/friends/:uuid2', verifyJWT, verifyVerification,  verifyOwner, deleteFriend);
router.delete('/:uuid/blocks/:uuid2', verifyJWT, verifyVerification,  verifyOwner, deleteBlock);
router.delete('/:uuid/friends/:uuid2/pending', verifyJWT, verifyVerification,  verifyOwner, deleteRequest);
export default router;
import express, {Router} from 'express';
import { deleteBlock, deleteFriend, deleteRequest, getAccountBlockedList, getAccountFriends, getAccountPendingFriendships, getAccountSearchByName, getPersonalAccountInfo, getPublicAccountShortened, getPublicAccountStatistics, postAcceptRequest, postNewAccount, postNewBlock, postNewFriendRequest, putNewAccountSettings } from '../controllers/account';
import { verifyJWT, verifyOwner, verifyVerification } from '../auth/auth';


const router: Router = express.Router();

// intended for display in the room player list
router.get('/:uuid', getPublicAccountShortened);
// full profile page
router.get('/:uuid/profile', getPublicAccountStatistics);
// private settings e.g. email
router.get('/:uuid/profile/settings', verifyJWT, verifyOwner, getPersonalAccountInfo);
// account friends list
router.get('/:uuid/friends', getAccountFriends);

// it may not be desirable to make the following two public

// get all pending friendships whether as a sender or a receiver, as an account owner
// may want to see both
router.get('/:uuid/friends/pending', verifyJWT, verifyOwner, getAccountPendingFriendships);
// the list of blocked people
router.get('/:uuid/blocks', verifyJWT, verifyOwner, getAccountBlockedList);

// you will only ever need to use this function when you're logged in, so JWT verification prevents stress on the database
// used in searching people to friend/block
router.get('/search/:name', verifyJWT, getAccountSearchByName);

// for creating new accounts
router.post('/', postNewAccount);

// for adding friends/blocks
router.post('/:uuid/friends/:uuid2', verifyJWT, verifyVerification, verifyOwner, postNewFriendRequest);
router.post('/:uuid/blocks/:uuid2', verifyJWT, verifyVerification, verifyOwner, postNewBlock);

// for accepting friend requests (there's no better HTTP method for it)
router.post('/:uuid/friends/:uuid2/pending', verifyJWT, verifyVerification, verifyOwner, postAcceptRequest);

// for changing settings
router.put('/:uuid/profile/settings', verifyJWT, verifyOwner, putNewAccountSettings);

// if non-verified users can't create friends/blocks/etc, reduce stress on database checking account relationships
router.delete('/:uuid/friends/:uuid2', verifyJWT, verifyVerification,  verifyOwner, deleteFriend);
router.delete('/:uuid/blocks/:uuid2', verifyJWT, verifyVerification,  verifyOwner, deleteBlock);
router.delete('/:uuid/friends/:uuid2/pending', verifyJWT, verifyVerification,  verifyOwner, deleteRequest);
export default router;
import { Request, Response } from "express";
import { AccountDataSource } from "../rdbms";
import { Account } from "../models/orm/account";
import { Verification } from "../models/orm/verification";

const accountRepo = AccountDataSource.getRepository(Account);
const verificationRepo = AccountDataSource.getRepository(Verification);

// similar to accepting friendships, there's just no better HTTP method for this
// purpose
export const postVerification = async (req: Request, res: Response) => {
    try {
        let givenAddress = req.params.address;
        let matchingVerification = await verificationRepo.findOneBy({ address: givenAddress});
    
        if(matchingVerification == null) {
            res.status(404).send('This verification address is not (or no longer) in use.');
            return;
        }
    
        AccountDataSource.manager.remove(matchingVerification);
    
        let matchingAccount = await accountRepo.findOneBy({uuid:matchingVerification?.accountUuid?.toString()});
    
        if(matchingAccount == null) {
            res.status(404).send('The account that this address belonged to no longer exists.');
            return;
        }
    
        matchingAccount.verified = true;
        accountRepo.save(matchingAccount);
        res.status(204).send('Account successfully verified.');
    } catch(error) {
        if (error instanceof Error) {
            console.log(`Issue with verification: ${error.message}`);
        }
        else {
            console.log(`Error: ${error}`);
        }
        res.status(400).send(`Couldn't successfully verify this email.`);
    }
}
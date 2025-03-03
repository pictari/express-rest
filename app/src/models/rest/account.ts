import Joi from "joi";

/**
 * Data interface used to hold account-related properties from POST/PUT requests.
 */
export interface Account {
    email?:string,
    name?:string,
    about?:string,
    password?:string,
    userType?:number
}

/**
 * Strictly validates accounts to be REGISTERED, and is therefore limited in information
 * it accepts. Use ValidateAccountPut for changing account settings.
 * 
 * @param account The rest/Account object (not the TypeORM data class) with values filled only in email, name and password fields.
 * @returns ValidationResult that contains an error message only if validation fails.
 */
export const ValidateAccountPost = (account: Account) => {
    const validator = Joi.object<Account>({
        email: Joi.string().email().required(),
        name: Joi.string().min(3).max(16).required(),
        password: Joi.string().required()
    });
    return validator.validate(account);
}

export const ValidateAccountPut = (account: Account) => {
    const validator = Joi.object<Account>({
        email: Joi.string().email().optional(),
        name: Joi.string().min(3).max(16).optional(),
        about: Joi.string().max(255).optional(),
        password: Joi.string().optional()
    });
    return validator.validate(account);
}
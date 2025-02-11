import Joi from "joi";

export interface Account {
    email?:string,
    name?:string,
    about?:string,
    password?:string,
    userType?:number
}

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
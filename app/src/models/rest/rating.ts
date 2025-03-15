import Joi from "joi"

/**
 * Data interface used to validate incoming Rating requests.
 */
export interface Rating {
    rating: number
}

/**
 * Validates incoming Rating requests. Works for both POST and PUT.
 * @param rating Rating to validate. Must contain a number between 1-5.
 * @returns ValidationResult that contains an error message only if validation fails.
 */
export const ValidateRatingPostOrPut = (rating: Rating) => {
    const validator = Joi.object<Rating>({
        rating: Joi.number().min(1).max(5).required()
    });

    return validator.validate(rating);
}
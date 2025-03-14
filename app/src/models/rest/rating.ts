import Joi from "joi"

export interface Rating {
    rating: number
}

export const ValidateRatingPostOrPut = (rating: Rating) => {
    const validator = Joi.object<Rating>({
        rating: Joi.number().min(1).max(5).required()
    });

    return validator.validate(rating);
}
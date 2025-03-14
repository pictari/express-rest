/**
 * Enum that holds the current privilege levels we recognize, from admin (highest) to none (lowest).
 */
export enum UserType {
    admin,
    moderator,
    none
}

export enum ContentType {
    prompt,
    image
}
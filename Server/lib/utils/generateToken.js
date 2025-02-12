import jwt from "jsonwebtoken";

export const generateTokenandSetCookie = (userId, res) => {
    // Implement your token generation and cookie setting logic here
    const token = jwt.sign({userId}, process.env.SECRET_KEY, {expiresIn: '15d'});

    res.cookie("jwt", token, {
        maxAge: 15*24*60*60*1000,
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
    })

}
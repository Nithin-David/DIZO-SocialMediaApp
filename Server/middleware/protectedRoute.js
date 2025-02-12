import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const protectedRoute = async (req, res, next) => {
    // Implement your authentication logic here
    try {
        const token = req.cookies.jwt;
        if(!token){
            return res.status(401).json({message: "Invalid token"})
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if(!decoded){
            return res.status(403).json({message: 'Token expired'})
        }

        const user = await User.findById(decoded.userId).select("-password");
        if(!user){
            return res.status(404).json({message: 'User not found'})
        }

        req.user = user;
        next();

    } catch (error) {
        console.log(`error in auth middilware: ${error.message}`);
        res.status(401).json({ message: 'Authentication failed' });
    }
}
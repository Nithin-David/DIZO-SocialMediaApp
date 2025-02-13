import { generateTokenandSetCookie } from "../lib/utils/generateToken.js";
import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
    try {
      // Implement your signup logic here

      const { fullName, username, password, email } = req.body;

      const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }


      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }

      if(password.length < 6){
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await User.create({
        fullName,
        username,
        email,
        password: hashedPassword,
      });

      if (newUser) {
        generateTokenandSetCookie(newUser._id, res);

        res.status(200).json({
          _id: newUser._id,
          username: newUser.username,
          fullName: newUser.fullName,
          email: newUser.email,
          followers: newUser.followers,
          following: newUser.following,
          profileImg: newUser.profileImg,
          coverImg: newUser.coverImg,
          bio: newUser.bio,
        });

      } else {
        res.status(500).json({ error: "Failed to create user" });
      }

    } catch (error) {
        console.log(`error in signup: ${error.message}`);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const login = async (req, res) => {
    // Implement your signup logic here
    try {
        const {username, password} = req.body;

        if(!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = await User.findOne( {username} );

        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");
        if(!user || !isPasswordCorrect) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        generateTokenandSetCookie(user._id, res);

        res.status(200).json({
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            followers: user.followers,
            following: user.following,
            profileImg: user.profileImg,
            coverImg: user.coverImg,
            bio: user.bio,
        });

    } catch (error) {
        console.log(`error in login: ${error.message}`);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const logout = (req, res) => {
    // Implement your signup logic here
    try {
        res.cookie("jwt", "", {maxAge: 0});
        res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        console.log(`error in logout: ${error.message}`);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMe = async ( req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        res.status(200).json(user);
    } catch (error) {
        console.log(`error at getme: ${error.message}`);
        res.status(500).json({ error: "Internal server error" });
    }

}

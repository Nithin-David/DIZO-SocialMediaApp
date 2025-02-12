import { User } from "../models/user.model.js";
import {Notification} from "../models/notification.model.js";
import bcrypt from "bcryptjs";
import {v2 as cloudinary} from "cloudinary";

export const getUserProfile = async (req, res) => {
    try {
        const {username} = req.params;

        const user = await User.findOne({username}).select("-password");
        if(!user){
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
        
    } catch (error) {
        console.log(`error while getting user profile ${error.message}`);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const followUnfollowUser = async (req, res) => {
    try {
        const {id} = req.params;
        const userToModify = await User.findById(id).select("-password");
        const currentUser = await User.findById(req.user._id).select("-password");

        if(!userToModify || !currentUser){
            return res.status(404).json({ message: "User not found" });
        }

        if(id === currentUser._id.toString()){
            return res.status(400).json({ message: "Cannot follow or unfollow yourself" });
        }

        const isfollowing = currentUser.following.includes(userToModify._id);

        if(isfollowing){
            //logic for unfollow
            await User.findByIdAndUpdate(userToModify._id, {$pull: {followers: currentUser._id}});
            await User.findByIdAndUpdate(currentUser._id, {$pull: {following: userToModify._id}});

            const newNotification = await Notification.create({
                from: currentUser._id,
                to: userToModify._id,
                type: "follow"
            });

            res.status(200).json({messasge: "unfollowed successfully"});
        }else{
            //logic for follow
            await User.findByIdAndUpdate(userToModify._id, {$push: {followers: currentUser._id}});
            await User.findByIdAndUpdate(currentUser._id, {$push: {following: userToModify._id}});

            const newNotification = await Notification.create({
              from: currentUser._id,
              to: userToModify._id,
              type: "follow",
            });

            res.status(200).json({messasge: "followed successfully"});
        }

    } catch (error) {
        console.log(`error while getting user profile ${error.message}`);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getSuggestedUsers = async (req, res) => {
    try {
      const currentUser = await User.findById(req.user._id);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const suggestedUsers = await User.find({
        _id: { $nin: [...currentUser.following, currentUser._id] },
      })
        .limit(10)
        .select("-password"); 

        res.status(200).json(suggestedUsers);
    } catch (error) {
        console.log(`error in suggested users: ${error.message}`);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const {username, fullName, currentPassword, newPassword, email, link, bio} = req.body;
        const {profileImg, coverImg} = req.body;

        const userId = req.user._id;

        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if((!currentPassword && newPassword) || (!newPassword && currentPassword)){
            return res.status(400).json({ message: "Password fields are required" });
        }

        if(currentPassword && newPassword){
            const isMatch = await bcrypt.compare(currentPassword, user?.password || "");
            if(!isMatch){
                return res.status(400).json({ message: "Incorrect current password" });
            }
            if(newPassword.length < 6){
                return res.status(400).json({ message: "Password must be at least 6 characters long" });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);

        };

        const uploadImage = async (img, oldImg) => {
          if (!img) return oldImg;
          if (oldImg)
            await cloudinary.uploader.destroy(
              oldImg.split("/").pop().split(".")[0]
            );
          const { secure_url } = await cloudinary.uploader.upload(img);
          return secure_url;
        };

        user.profileImg = await uploadImage(profileImg, user.profileImg);
        user.coverImg = await uploadImage(coverImg, user.coverImg);

        user.username = username || user.username;
        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.link = link || user.link;
        user.bio = bio || user.bio;
        user.profileImg = profileImg || user.profileImg;
        user.coverImg = coverImg || user.coverImg;

        user = await user.save();

        user.password = null;

        res.status(200).json(user);

    } catch (error) {
        console.log(`error in update user profile: ${error}`);
        res.status(500).json({ error: "Internal server error" });
    }
}
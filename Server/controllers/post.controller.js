import { User } from "../models/user.model.js";
import {Post} from "../models/posts.model.js";
import {v2 as cloudinary} from "cloudinary";

export const createPost = async (req, res) => {
    try {
        const {text} = req.body;
        let {img} = req.body;

        const userId = req.user._id.toString();

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        };

        if(!text && !img){
            return res.status(400).json({ message: "Text or image is required" });
        };

        if(img){
            const cloudinaryResponse = await cloudinary.uploader.upload(img);
            img = cloudinaryResponse.secure_url;
        }

        const newPost = await Post.create({
            text,
            img,
            user: userId
        });

        res.status(200).json(newPost);

    } catch (error) {
        console.log(`error in createPost ${error.message}`);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deletePost = async (req, res) => {
    try {
        const {id} = req.params;
        const userId = req.user._id.toString();

        const post = await Post.findById(id);
        if(post.user.toString() !== userId){
            return res.status(403).json({ message: "Unauthorized to delete this post" });
        };

        if(post.img){
            const imgId = post.img?.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        };

        await Post.findByIdAndDelete(id);

        res.status(200).json({ message: "Post deleted successfully" });
        
    } catch (error) {
        console.log(`error in deletePost ${error.message}`);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const commentOnPost = async (req, res) => {
    try {
        const {text} = req.body;
        const postId = req.params.id;
        const userId = req.user._id;

        if(!text){
            return res.status(400).json({ message: "Comment text is required" });
        }

        const post = await Post.findById(postId);
        if(!post){
            return res.status(404).json({ message: "Post not found" });
        };

        post.comments.push({
            text,
            user: userId,
        });

        await post.save();

        res.status(200).json(post);

    } catch (error) {
        console.log(`error in comment ${error.message}`);
        res.status(500).json({ error: "Internal server error" });
    }
};
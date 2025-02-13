import { User } from "../models/user.model.js";
import { Post } from "../models/posts.model.js";
import { v2 as cloudinary } from "cloudinary";
import { Notification } from "../models/notification.model.js";

export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let { img } = req.body;

    const userId = req.user._id.toString();

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!text && !img) {
      return res.status(400).json({ message: "Text or image is required" });
    }

    if (img) {
      const cloudinaryResponse = await cloudinary.uploader.upload(img);
      img = cloudinaryResponse.secure_url;
    }

    const newPost = await Post.create({
      text,
      img,
      user: userId,
    });

    res.status(200).json(newPost);
  } catch (error) {
    console.log(`error in createPost ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const post = await Post.findById(id);
    if (post.user.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this post" });
    }

    if (post.img) {
      const imgId = post.img?.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }

    await Post.findByIdAndDelete(id);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log(`error in deletePost ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

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

export const likeUnlikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.includes(userId);
    if (isLiked) {
      await Post.findByIdAndUpdate(
        { _id: postId },
        { $pull: { likes: userId } }
      );

      await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

      res.status(200).json({ message: "Unliked successfully" });
    } else {
      await Post.findByIdAndUpdate(
        { _id: postId },
        { $push: { likes: userId } }
      );

      await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });

      await Notification.create({
        from: userId,
        to: post.user,
        type: "like",
      });

      res.status(200).json({ message: "Liked successfully" });
    }
  } catch (error) {
    console.log(`error in likeunlike post ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const allPosts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    if (allPosts.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(allPosts);
  } catch (error) {
    console.log(`error in getAllPosts ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLikedPosts = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if(!user){
      return res.status(404).json({ message: "User not found" });
    };

    const likedPosts = await Post.find({_id: {$in: user.likedPosts}}).sort({createdAt: -1}).populate({
      path: "user",
      select: "-password",
    }).populate({
      path: 'comments.user',
      select: "-password",
    });

    res.status(200).json(likedPosts);

  } catch (error) {
    console.log(`error in getLikedPosts ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFollowingPost = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const followingPosts = await Post.find({ user: { $in: user.following } })
     .sort({ createdAt: -1 })
     .populate({
        path: "user",
        select: "-password",
      })
     .populate({
        path: "comments.user",
        select: "-password",
      });

      res.status(200).json(followingPosts);

  } catch (error) {
    console.log(`error in getFollowingPost ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserPosts = async(req, res) => {
  try {
    const {username} = req.params;
    const user = await User.findOne({ username });

    if(!user){
      return res.status(404).json({ message: "User not found" });
    };

    const userPosts = await Post.find({ user: user._id }).sort({ createdAt: -1 }).populate({
      path: "user",
      select: "-password",
    }).populate({
      path: "comments.user",
      select: "-password",
    });

    res.status(200).json(userPosts);
  } catch (error) {
    console.log(`error in getUserPosts ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
}
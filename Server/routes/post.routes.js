import express from 'express';
import { protectedRoute } from '../middleware/protectedRoute.js';
import { commentOnPost, createPost, deletePost, getAllPosts, getFollowingPost, getLikedPosts, getUserPosts, likeUnlikePost } from '../controllers/post.controller.js';

const router = express.Router();

router.get('/allPosts',protectedRoute,getAllPosts);
router.get('/followingpost', protectedRoute, getFollowingPost);
router.get("/user/:username", protectedRoute, getUserPosts);
router.post('/liked/:id', protectedRoute, getLikedPosts);
router.post('/create', protectedRoute, createPost);
router.post('/like/:id', protectedRoute, likeUnlikePost);
router.post('/comment/:id', protectedRoute, commentOnPost);
router.delete('/:id', protectedRoute, deletePost);

export default router;
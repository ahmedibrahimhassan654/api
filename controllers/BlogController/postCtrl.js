const Post = require("../../models/BlogModels/Post/Post");
const User = require("../../models/User");
const ErrorResponse = require("../../utils/errorResponse");
//create
const createpostCtrl = async (req, res, next) => {
  const { title, description, category } = req.body;
  try {
    //Find the user
    const author = await User.findById(req.user.id);
    //check if the user is blocked
    if (author.isBlocked) {
      return next(new ErrorResponse("Access denied, account blocked", 403));
    }
    //Create the post
    const postCreated = await Post.create({
      title,
      description,
      user: author._id,
      category,
      photo: req?.file?.path,
    });
    //Associate user to a post -Push the post into the user posts field
    author.posts.push(postCreated);
    //save
    await author.save();
    res.json({
      status: "success",
      data: postCreated,
    });
  } catch (error) {
    next(new ErrorResponse(error.message));
  }
};

//all
const fetchPostsCtrl = async (req, res, next) => {
  try {
    //Find all posts
    const posts = await Post.find({})
      .populate("user")
      .populate("category", "title");

    //Check if the user is blocked by the post owner
    const filteredPosts = posts.filter((post) => {
      //get all blocked users
      const blockedUsers = post.user.blocked;
      const isBlocked = blockedUsers.includes(req.user.id);

      // return isBlocked ? null : post;
      return !isBlocked;
    });

    res.json({
      status: "success",
      data: filteredPosts,
    });
  } catch (error) {
    next(new ErrorResponse(error.message));
  }
};

//togg DisLike
const toggleDisLikesPostCtrl = async (req, res, next) => {
  try {
    //1. Get the post
    const post = await Post.findById(req.params.id);
    //2. Check if the user has already unliked the post
    const isUnliked = post.disLikes.includes(req.user.id);
    //3. If the user has already liked the post, unlike the post
    if (isUnliked) {
      post.disLikes = post.disLikes.filter(
        (dislike) => dislike.toString() !== req.user.id.toString()
      );
      await post.save();
    } else {
      //4. If the user has not liked the post, like the post
      post.disLikes.push(req.userAuth);
      await post.save();
    }
    res.json({
      status: "success",
      data: post,
    });
  } catch (error) {
    next(new ErrorResponse(error.message));
  }
};

//toggleLike
const toggleLikesPostCtrl = async (req, res, next) => {
  try {
    //1. Get the post
    const post = await Post.findById(req.params.id);
    //2. Check if the user has already liked the post
    const isLiked = post.likes.includes(req.user.id);
    //3. If the user has already liked the post, unlike the post
    if (isLiked) {
      post.likes = post.likes.filter(
        (like) => like.toString() !== req.user.id.toString()
      );
      await post.save();
    } else {
      //4. If the user has not liked the post, like the post
      post.likes.push(req.user.id);
      await post.save();
    }
    res.json({
      status: "success",
      data: post,
    });
  } catch (error) {
    next(new ErrorResponse(error.message));
  }
};

//single
const postDetailsCtrl = async (req, res, next) => {
  try {
    //find the post
    const post = await Post.findById(req.params.id);
    //Number of view
    //check if user viewed this post
    const isViewed = post.numViews.includes(req.user.id);
    if (isViewed) {
      res.json({
        status: "success",
        data: post,
      });
    } else {
      //pust the user into numOfViews

      post.numViews.push(req.user.id);
      //save
      await post.save();
      res.json({
        status: "success",
        data: post,
      });
    }
  } catch (error) {
    next(new ErrorResponse(error.message));
  }
};

//Delete
const deletepostCtrl = async (req, res, next) => {
  try {
    //check if the post belongs to the user

    //find the post
    const post = await Post.findById(req.params.id);
    if (post.user.toString() !== req.user.dislike.toString()) {
      return next(
        new ErrorResponse("You are not allowed to delete this post", 403)
      );
    }
    await Post.findByIdAndDelete(req.params.id);
    res.json({
      status: "success",
      data: "Post deleted successfully",
    });
  } catch (error) {
    next(new ErrorResponse(error.message));
  }
};

//update
const updatepostCtrl = async (req, res, next) => {
  const { title, description, category } = req.body;
  try {
    //find the post
    const post = await Post.findById(req.params.id);
    //check if the post belongs to the user

    if (post.user.toString() !== req.user.id.toString()) {
      return next(appErr("You are not allowed to delete this post", 403));
    }
    await Post.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        category,
        photo: req?.file?.path,
      },
      {
        new: true,
      }
    );
    res.json({
      status: "success",
      data: post,
    });
  } catch (error) {
    next(appErr(error.message));
  }
};

module.exports = {
  postDetailsCtrl,
  createpostCtrl,
  deletepostCtrl,
  updatepostCtrl,
  fetchPostsCtrl,
  toggleLikesPostCtrl,
  toggleDisLikesPostCtrl,
};

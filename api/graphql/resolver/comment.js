const Comment = require("../../model/comment");
const User = require("../../model/user");
const Photo = require("../../model/photo");

const { transformComment, transformPhoto } = require("./merge");

module.exports = {
  comments: async (args) => {
    try {
      const photo = await Photo.findById(args.photoId);
      if (!photo) {
        throw new Error(`Photo not found!`);
      }
      const post = transformPhoto(photo);
      const total = await Comment.countDocuments({ photo: args.photoId });
      const comments = await Comment.find({ photo: args.photoId })
        .skip(args.skip || 0)
        .limit(args.limit || 5);
      const result = comments.map((comment) => {
        return transformComment(comment);
      });

      return {
        data: [...result],
        photo: post,
        total,
      };
    } catch (error) {
      throw error;
    }
  },
  postComment: async (args, req) => {
    if (!req.user) {
      throw new Error("Unauthorize user!");
    }
    try {
      const findUser = await User.findById(req.user.id);
      if (!findUser) {
        throw new Error("User not found!");
      }
      const findPhoto = await Photo.findById(args.commentInput.threadId);
      if (!findPhoto) {
        throw new Error("Photo not found!");
      }
      const comment = new Comment({
        message: args.commentInput.message,
        photo: findPhoto._doc._id,
        user: findUser._doc._id,
      });
      const result = await comment.save().then(async (response) => {
        await Photo.findOneAndUpdate(
          { _id: findPhoto._doc._id },
          {
            $push: {
              comments: response._doc._id,
            },
          },
          { upsert: true }
        );
        return response;
      });
      return transformComment(result);
      // return {
      //   ...result._doc
      // }
    } catch (error) {
      throw error;
    }
  },
  postReply: async (args, req) => {
    if (!req.user) {
      throw new Error("Unauthorize user!");
    }
    try {
      const findUser = await User.findById(req.user.id);
      if (!findUser) {
        throw new Error("User not found!");
      }
      const findComment = await Comment.findById(args.commentInput.threadId);
      if (!findComment) {
        throw new Error("Thread not found!");
      }
      const reply = new Comment({
        message: args.commentInput.message,
        // photo: findComment._doc.photo,
        user: findUser._doc._id,
        thread: findComment._doc._id,
      });
      const result = await reply.save().then(async (response) => {
        await Comment.findOneAndUpdate(
          { _id: findComment._doc._id },
          {
            $push: {
              reply: response._doc._id,
            },
          },
          { upsert: true }
        );
        return response;
      });
      return transformComment(result);
      // return {
      //   ...result._doc
      // }
    } catch (error) {
      throw error;
    }
  },
};

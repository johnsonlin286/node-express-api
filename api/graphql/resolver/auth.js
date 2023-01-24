require('dotenv').config();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require('../../model/user');

module.exports = {
  signup: async args => {
    try {
      const findUser = await User.findOne({email: args.userInput.email});
      if (findUser) {
        throw new Error('Email already in used!');
      }
      const hashPassword = await bcrypt.hash(args.userInput.password, 12);
      if (!hashPassword) {
        throw new Error('Something went wrong, try again!');
      }
      const newUser = new User({
        name: args.userInput.name,
        email: args.userInput.email,
        password: hashPassword
      });
      const result = await newUser.save();
      if (!result) {
        throw new Error('Something went wrong, try again!');
      }
      return {
        ...result._doc,
        password: null
      }
    } catch (error) {
      throw error;
    }
  },
  signin: async args => {
    try {
      const findUser = await User.findOne({email: args.email});
      if (!findUser) {
        throw new Error('User not found!');
      }
      const checkPassword = await bcrypt.compare(args.password, findUser._doc.password);
      if (!checkPassword) {
        throw new Error('Invalid password!');
      }
      const token = jwt.sign({id: findUser._doc._id, name: findUser._doc.name, email: findUser._doc.email}, process.env.SECRET_TOKEN, {expiresIn: '1h'});
      return {
        ...findUser._doc,
        token: token
      }
    } catch (error) {
      throw error
    }
  }
}
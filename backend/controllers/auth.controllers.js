import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import genToken from "../config/token.js";

export const signUp = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const checkByUsername = await User.findOne({ username });

    if (checkByUsername) {
      return res.status(400).json({ message: "username already exist" });
    }

    const checkByEmail = await User.findOne({ email });

    if (checkByEmail) {
      return res.status(400).json({ message: "email already exist" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "password must be atleast 6 char " });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    console.log(user);

    const token = await genToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "Strict",
      secure: false,
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImg: user.profileImg,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: `signup error ${error}` });
  }
};

export const  logIn = async(req, res)=>{ 

  try {
    const { email, password } = req.body;

  
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "user does not exist " });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "password must be atleast 6 char " });
    }

    const isMatch = await bcrypt.compare(password , user.password)
  
 
    console.log("User found:", !!user);
console.log("Entered password exists:", !!password);
console.log("Stored hash:", user?.password);

    if(!isMatch){ 
      return res.status(400).json({message:"icorrect password"})
    }

    console.log("Password matched:", isMatch);
console.log("After bcrypt compare");

    console.log(user);

    const token = await genToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "Strict",
      secure: false,
    });

    res.status(200).json({
      message: "User logined successfully",
      user: {
        _id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        profileImg: user.profileImg,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: `login  ${error}` });
  }


} 



export const logOut = async(req, res)=>{ 
  try {

    res.clearCookie("token")
    res.status(200).json({
      message: "logOut successfully",
    
    });
    
  } catch (error) {
         return res
        .status(500)
        .json({ message:  `logout error ${error}` });
    
  }
}
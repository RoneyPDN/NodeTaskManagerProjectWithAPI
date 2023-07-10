const User = require("../models/users")
const catchAsyncErrors = require("../middlewares/catchAsyncErrors")
const ErrorHandler = require('../utils/errorHandler')
const sendToken = require('../utils/jwtToken')


// Register a new user => /api/v1/register
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
    const {name,email,password,role} = req.body;

    const user = await User.create({
        name,
        email,
        password,
        role
    })

    sendToken(user,200,res)
})

// Login User
exports.loginUser = catchAsyncErrors(async (req,res,next)=> {
    const { email,password } = req.body

    // Verify email and password
    if(!email|| !password){
        return next(new ErrorHandler("Please enter your email and password", 400))
    }
    
    // Finding user in database
    const user = await User.findOne({email}).select("+password");
    
    if(!user){
        return next(new ErrorHandler("Invalid Email or Password",401))
    }

    // Check if password is correct
    const isPasswordMatched = await user.comparePassword(password)
    if(!isPasswordMatched){
        return next(new ErrorHandler('Invalid Email or Password',401))
    }
    sendToken(user,200,res)
}); 

// Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req,res,next) => {
    const user = await User.findOne({email : req.body.email})

    // Check user email is database
    if(!user){
        return next(new ErrorHandler("No user found with this email", 404));
    }    

    const resetToken = user.getResetPasswordToken();

    await user.save({validateBeforeSave : false})
})

// logout User
exports.logout = catchAsyncErrors(async (req,res,next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now()),
        httpOnly : true
    })

    res.status(200).json({
        success: true,
        message: 'Logged out successfully.'
    })
})
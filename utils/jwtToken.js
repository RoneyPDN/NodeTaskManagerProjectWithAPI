const sendToken = (user,statusCode,res,req) =>{
    // Create JWT Token
    const Options = {
        expires : new Date(Date.now() + process.env.COOKIE_EXPIRES_TIME * 24*60*60*1000),
        httpOnly : true
    }
    const token = user.getJwtToken()
    res.status(statusCode).cookie('token',token.options).json({
        success: true,
        token
    })
}

module.exports = sendToken
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOption = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 1000),
        httpOnly: true
    }

    if(process.env.NODE_ENV == 'production') cookieOption.secure = true;

    res.cookie('jwt', token, cookieOption)
    
    // Remove Password
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data:{
            user
        }
    })
}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create(req.body);

    createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async(req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400))
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password')

    if (!user || !await user.correctPassword(password, user.password)) {
        return next(new AppError('Incorrect email or password', 401))
    }

    // 3) If everything is ok, send token to client
    createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req,res, next) => {
    let token;
    // 1) Getting Token and check
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(" ")[1];
    }
    console.log(token);

    if(!token){
        return  next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2) Verification token
    const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const user = await User.findById(decode.id);

    if(!user) {
        return next(new AppError('The user belonged to this token no longer exists', 401))
    }

    // 4) Check if user changed password
    if(user.changePasswordAfter(decode.iat)){
        return next(new AppError('User has recently changed password! Please log in again', 401))
    }

    req.user = user;
    next();
})

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'lead-guid']
        if(!roles.includes(req.user.role)){
            return next(new AppError('You do not have permission to perform this action', 403));
        }

        next();
    }
}

exports.forgotPassword = async (req, res, next) => {
    // 1) Get user email
        const user = await User.findOne({ email: req.body.email });

        if(!user){
            return next(new AppError('There is no user with this email address', 404));
        }
    // 2) Generate random reset token
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });
    // 3) Send it to user's Email
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

        const message = `Forgot your password? Please, go to - ${resetURL} \n If you did not forget your password, please ignore this email.`

        try {           
            await sendEmail({
                email: user.email,
                subject: 'Your password reset token (valid for 10 mins)',
                message
            })
        } catch (error){
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({validateBeforeSave: false});

            return next(new AppError('Error sending an email. Try again later', 500));
        }

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email'
        });
}

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user token
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });
    // 2) If token is expired
        if(!user){
            return next(new AppError('Token is invalid or has expired', 400));
        }
    // 3) Update password
        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
    //4) Send new JWT
        createSendToken(user, 200, res);
})

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('password');

    // 2) Check if POSTed current password is correct
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
        return next(new AppError('Your current password is wrong', 401));
    }

    // 3) Password update
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // 4) Login user, send JWT
    createSendToken(user, 200, res);
})
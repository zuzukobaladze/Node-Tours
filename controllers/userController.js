const AppError = require('../utils/appError');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');

const filterObj = (obj, ...allowFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowFields.includes(el)) newObj[el] = obj[el]
    });

    return newObj;
}

exports.getAllUsers = catchAsync(async(req, res, next) => {
    const users = await User.find();

    //SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users
        }
    });
});

exports.getUser = (req,res) => {
    res.status(500).json({
        status: 'error',
        message: 'this route is not defined'
    });
}

exports.createUser = (req,res) => {
    res.status(500).json({
        status: 'error',
        message: 'this route is not defined'
    });
}

exports.updateMe = catchAsync(async(req, res, next) => {
    // 1) Create error if user POSTs password data
    if(req.body.password || req.body.confirmPassword){
        return next(new AppError('This route is not for password updates. Please use /updateMyPassword.', 400));
    }

    const filterBody = filterObj(req.body, 'name', 'email');
    // 2) Update user document
    const updateUser = await User.findByIdAndUpdate(req.user.id, filterBody, {new: true, runValidators: true});


    res.status(200).json({
        status: 'success',
        data: {
            user: updateUser
        }
    })
})

exports.updateUser = (req,res) => {
    res.status(500).json({
        status: 'error',
        message: 'this route is not defined'
    });
}

exports.deleteUser = (req,res) => {
    res.status(500).json({
        status: 'error',
        message: 'this route is not defined'
    });
}
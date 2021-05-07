const AppError = require("../utils/appError")

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`

    return new AppError(message, 400);
}

const handleDuplicateFieldsDB = err => {
    const value = err.message.match(/(["'])(?:\\.|[^\\])*?\1/)[0];
    console.log(value)
    const message = `Duplicate field value: ${value} Please use another value`;

    return new AppError(message, 400);
}

const handleJsonWebTokenError = () => new AppError('Invalid Token. Please log in again!', 401);

const handleTokenExpiredError = () => new AppError('Your token has expired! Please log in again', 401);

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.statusCode,
        error: err,
        message: err.message,
        stack: err.stack
    }) 
}

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);

    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
}

const sendErrorProd = (err, res) => {
    //Operational, trusted error
    if (err.isOperational){
        res.status(err.statusCode).json({
            status: err.statusCode,
            message: err.message
        })
    }
    //Programming or other error
    else {
        //1) log error
        console.error('Error:', err);

        //2) Send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!'
        })
    }
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
 
    if(process.env.NODE_ENV === 'development'){
        sendErrorDev(err, res)
    }
    else if(process.env.NODE_ENV === 'production'){
        let error = {...err};

        if(err.name === 'CastError') error = handleCastErrorDB(error);
        if(error.code === 11000) error = handleDuplicateFieldsDB(err);
        if(err.name === "ValidationError") error = handleValidationErrorDB(err);
        if(err.name === "JsonWebTokenError") error = handleJsonWebTokenError();
        if(err.name === "TokenExpiredError") error = handleTokenExpiredError();

        sendErrorProd(error, res)
    }
}
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean');

const tourRouter = require('./routers/tourRouters');
const userRouter = require('./routers/userRouters');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

app.use(morgan('dev'));

app.use(helmet());

const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hr
    max: 100, // limit each IP to 100 requests
    message: 'Too many requests from this IP, please try again in an hour!'
})


app.use('/api', limiter);

app.use(express.json({limit: '10kb'}));

//Data sanitization against noSQL query injection
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());

app.use((req,res,next) => {
    req.requestTime = new Date().toISOString();
    next();
})

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req,res,next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
const express = require('express');
const app = express();
const dotenv = require('dotenv');
const ErrorHandler = require('./utils/errorHandler');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const hpp = require('hpp')


const errorMiddleware = require('./middlewares/errors')

const connectDataBase = require("./config/database")

//Setting up config.env files variables
dotenv.config({path : './config/config.env'})

// Handling Uncaught Exception
process.on('uncaughtException', err =>{
    console.log(`Error ${err.message}`)
    console.log('Shutting down due to uncaught Exception.')
    process.exit(1);
})

// Connecting to the database
connectDataBase();

// Setup body parser 
app.use(express.json());

// Handling file upload
app.use(fileUpload())

// Set Cookie Parser
app.use(cookieParser())

// Rate Limiting
const limiter = rateLimit({
    windowMs : 10*60*1000, // 10 minutes
    max: 100
})

app.use(limiter)

// Setup security headers
app.use(helmet())

// Sanitize Data
app.use(mongoSanitize())

//Prevent parameters polution
app.use(hpp())

// importing all routes
const jobs = require('./routes/jobs');
const auth = require('./routes/auth');
const user = require('./routes/user')

const { Server } = require('mongodb');

app.use(jobs);
app.use(auth);
app.use(user)

app.all('*', (req,res,next) => {
    next(new ErrorHandler(`${req.originalUrl} route not found,404`))
});

// MiddleWare to handle errors
app.use(errorMiddleware);

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server started on port ${process.env.PORT} in ${process.env.NODE_ENV} mode.`)
});


// Handling  Unhandled Promise Rejection
process.on('unhandledRejection', err => {
    console.log(`Error ${err.message}`);
    console.log('Shutting down the server due tue unhandled promise rejection.')
    server.close(() => {
        process.exit(1)
    })
})
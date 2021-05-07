const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel')

dotenv.config({path: './config.env'})

let DB = process.env.DB_LINK.replace('<password>', process.env.DB_PASSWORD);
DB = DB.replace('<username>', process.env.DB_USERNAME);

mongoose.connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
}).then(con => console.log('connection successful'))

//Read JSON file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'));

//Import data into DB
const importData = async () => {
    try {
        await Tour.create(tours);
        console.log('Data loaded successfully')
        process.exit();
    } catch (error) {
        console.log(error);
    }
}

//Delete all data from Collection
const deleteData = async () => {
    try {
        await Tour.deleteMany()
        console.log('Data deleted successfully')
        process.exit();
    } catch (error) {
        console.log(error)
    }
}

if (process.argv[2] === "--import"){
    importData();
}
else if(process.argv[2] === "--delete"){
    deleteData();
}

console.log(process.argv);
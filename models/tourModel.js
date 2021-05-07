const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "A tour must have a name"],
        unique: true,
        trim: true,
        maxlength: [30, 'A tour name must have less than or equal to 30 characters'],
        minlength: [10, 'A tour name must have more than or equal to 10 characters'],
        // validate: [validator.isAlpha, 'Tour name must include only characters!']

    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        default: 4.5
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium','difficult'],
            message: 'Difficulty is either easy, medium or difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be equal to or above 1.0'],
        max: [5, 'Rating must be equal to or below 5.0']
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']   
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val){
                return val < this.price
            },
            message: 'Discount price ({VALUE}) must be be below regular price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a description']
    },
    description: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a description']
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    }
},{
    toJSON: {virtuals: true},
    toObject: {virtuals:true}
});

tourSchema.virtual('durationsWeeks').get(function(){
    return this.duration / 7
});

tourSchema.pre('save', function(next){
    this.slug = slugify(this.name, { lower: true })
    next();
});

tourSchema.pre(/^find/, function(next){
    this.find( {secretTour: { $ne: true }});
    this.start = Date.now()
    next()
})

tourSchema.post(/^find/, function(docs, next){
    console.log(`Query took ${Date.now() - this.start} milliseconds`)
    next()
})

//Aggregation Middleware
tourSchema.pre('aggregate', function(next){
    this.pipeline().unshift({ $match: { secretTour: { $ne: true }}});
    next()
})

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
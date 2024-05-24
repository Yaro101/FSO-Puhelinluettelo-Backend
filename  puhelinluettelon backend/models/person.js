const mongoose = require('mongoose')

mongoose.set('strictQuery', false)

const url = process.env.MONGODB_URL

console.log('connecting to', url)
mongoose.connect(url)
    .then(() => {
        console.log('connected to MongoDB')
    })
    .catch((error) => {
        console.log('error connecting to MongoDB:', error.message)
    })

// Custom validator function for phone format (pattern = a regular expression)
const phoneNumberValidator = (value) => {
    const pattern = /\d{2,3}-\d{5,}/
    // const pattern = /^(0[2-9]|1\d{2})-\d{7,}$/
    return pattern.test(value)
}

const personSchema = new mongoose.Schema({
    name: {
        type: String,
        minlength: 3,
        required: true,
    },
    number: {
        type: String,
        required: true,
        validate: {
            validator: phoneNumberValidator,
            message: (props) => `${props.value} is not a valid phone number! Please use the format XX(X)-XXXXXXX`
        },
    },
});

personSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

module.exports = mongoose.model('Person', personSchema)
const mongoose = require('mongoose');

// Define the schema
const postSchema =  mongoose.Schema({
    user: {  //id speacifiy
        type: mongoose.Schema.Types.ObjectId, // Corrected type
        ref: 'user', // Ensure 'User' matches the model name exactly
        required: true // Optional: add required if this field is mandatory
    },
    date: {
        type: Date,
        default: Date.now
    },
    content: {
        type: String, // Define content as a String
        required: true // Optional: add required if this field is mandatory
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId, // Corrected type
        ref: 'user' // Ensure 'User' matches the model name exactly
    }]
});

// Create and export the model
module.exports = mongoose.model("post", postSchema); // Corrected model name to "Post"

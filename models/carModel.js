const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const carSchema = new Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  make: { type: String, required: true }, // New property for make
  model: { type: String, required: true }, // New property for model
  image: [{
    url: String,
    filename: String
  }],
  price: Number,
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
});

module.exports = mongoose.model('Car', carSchema);

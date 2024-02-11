// models/carFinanceModel.js
const mongoose = require('mongoose');

const carFinanceSchema = new mongoose.Schema({
  yearModel: { type: String, required: true },
  make: { type: String, required: true },
  modelDescription: { type: String, required: true },
  price: { type: Number, required: true },
  currentMileage: { type: Number, required: true },
  color: { type: String, required: true },
  payInAdvance: { type: Boolean, default: false },
  repaymentPeriod: { type: Number, required: true },
  rateIndicator: { type: String, required: true },
  depositType: { type: String, required: true },
  depositAmount: { type: Number },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  idNumber: { type: String, required: true },
});

const CarFinance = mongoose.model('CarFinance', carFinanceSchema);

module.exports = CarFinance;

const mongoose = require("mongoose");

const { Schema } = mongoose;

const schema = new Schema({
    id: { type: String, required: true, unique: true, trim: true },
    uid: { type: String, required: true },

    products: [{
        productId: { type: String, required: true },
        name: { type: String, required: true, trim: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true }
    }],

    totalPrice: { type: Number, required: true },

    shippingAddress: { type: String, required: true, trim: true },

    status: { type: String, enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"], default: "Pending" },
    paymentStatus: { type: String, enum: ["Pending", "Paid", "Faild"], default: "Pending" }

}, { timestamps: true });

const Orders = mongoose.model("orders", schema);

module.exports = Orders;
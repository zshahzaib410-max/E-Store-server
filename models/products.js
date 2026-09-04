const mongoose = require("mongoose");

const { Schema } = mongoose;

const schema = new Schema({
    id: { type: String, required: true, unique: true, trim: true },
    uid: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    category: { type: String, required: true },
    imageUrl: { type: String, required: true },
    imagePublicId: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["inactive", "active"], default: "active" },

},
    { timestamps: true }
);

const Products = mongoose.model("products", schema);

module.exports = Products;
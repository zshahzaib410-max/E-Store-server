const mongoose = require("mongoose")

const { Schema } = mongoose

const schema = new Schema({
    uid: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    fullName: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["customer", "superAdmin"], default: "customer" },
    status: { type: String, enum: ["inactive", "active"], default: "active" },
}, { timestamps: true })

const Users = mongoose.model("users", schema)
module.exports = Users
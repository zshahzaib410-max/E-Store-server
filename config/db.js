const mongoose = require("mongoose");
const { MONGODB_USERNAME, MONGODB_PASSWORD } = process.env;
const dns = require("dns");

dns.setServers(["1.1.1.1", "8.8.8.8"])

const connectDB = async () => {
    try {
        await mongoose.connect(`mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@cluster0.otxkod9.mongodb.net/?appName=Cluster0`);

        console.log("Connected to MongoDB Sucessfully");
    } catch (error) {
        console.log('MongoDB not Connect ');
        console.error(error);
    }
};

module.exports = { connectDB };
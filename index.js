require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const auth = require("./routes/auth");
const products = require("./routes/products");
const order = require("./routes/order");
// const dashboardRoutes = require("./routes/dashboard");


const app = express();

app.use(express.json());
app.use(cors());
connectDB();
app.use("/auth", auth);
app.use("/products", products);
app.use("/order", order);
// app.use("/dashboard", dashboardRoutes);
const { PORT = 8000 } = process.env;



app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
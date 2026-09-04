const express = require("express");
const router = express.Router();
// const multer = require("multer");
// const cloudinary = require("../config/cloudinary");

const { verifyToken } = require("../middleware/auth")
const Orders = require("../models/order");
const Products = require("../models/products");
const { getRandomId } = require("../config/global");

router.post("/create", verifyToken, async (req, res) => {

    try {

        const { role, uid } = req
        const { totalPrice, products, shippingAddress } = req.body

        if (role !== "customer") { return res.status(401).json({ message: "You are not authorized to creat order" }) }

        const id = getRandomId()

        const orderData = { id, totalPrice, products, shippingAddress, uid }

        const order = await Orders.create(orderData)

        products.map(async ({ productId, quantity }) => {
            await Products.findOneAndUpdate({ id: productId }, { $inc: { stock: -quantity } })
        })

        res.status(200).json({ message: " order created successfully ", order })


    }
    catch (error) {
        console.error(error);

        res.status(500).json({ message: "Internal Server Error", isError: true, });
    }
})



// GET CODE HERE ORDER

router.get("/all", verifyToken, async (req, res) => {
    try {

        if (req.role !== "superAdmin") {
            return res.status(401).json({ message: "Unauthorized" })
        }

        const orders = await Orders.find().sort({ createdAt: -1 })

        res.status(200).json({
            message: "Orders fetched successfully",
            orders
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: "Internal server error",
            isError: true
        })
    }
})


// COUSTMER GET CODE 

router.get("/my-orders", verifyToken, async (req, res) => {
    try {

        const { uid } = req

        const orders = await Orders.find({ uid }).sort({ createdAt: -1 })

        res.status(200).json({
            message: "My orders",
            orders
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: "Internal server error"
        })
    }
})

// UPDATE CODER  HERE ORDER

router.patch("/update/:id", verifyToken, async (req, res) => {
    try {

        if (req.role !== "superAdmin") {
            return res.status(401).json({ message: "Unauthorized" })
        }

        const { id } = req.params
        const { status, paymentStatus, shippingAddress } = req.body

        if (!status || !paymentStatus || !shippingAddress) {
            return res.status(400).json({
                message: "All fields are required"
            })
        }

        const order = await Orders.findOneAndUpdate(
            { id },
            { status, paymentStatus, shippingAddress },
            { new: true }
        )

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            })
        }

        res.status(200).json({
            message: "Order updated successfully",
            order
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: "Internal server error",
            isError: true
        })
    }
})

//DELETE CODE ORDER

router.delete("/delete/:id", verifyToken, async (req, res) => {
    try {

        if (req.role !== "superAdmin") {
            return res.status(401).json({
                message: "Unauthorized"
            })
        }

        const { id } = req.params

        const order = await Orders.findOneAndDelete({ id })

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            })
        }

        res.status(200).json({
            message: "Order deleted successfully"
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: "Internal server error",
            isError: true
        })
    }
})




module.exports = router
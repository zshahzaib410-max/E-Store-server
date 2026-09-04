
const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewear/auth");
const Orders = require("../models/order");
const Products = require("../models/products");
const User = require("../models/user");


// ==========================================
// CUSTOMER DASHBOARD
// ==========================================

router.get("/customer", verifyToken, async (req, res) => {

    try {

        const { uid, role } = req;

        // Customer only
        if (role !== "customer") {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }


        // Get customer's orders
        const orders = await Orders
            .find({ uid })
            .sort({ createdAt: -1 });


        // Order counts
        const totalOrders = orders.length;

        const pendingOrders = orders.filter(
            order => order.status === "Pending"
        ).length;

        const processingOrders = orders.filter(
            order => order.status === "Processing"
        ).length;

        const shippedOrders = orders.filter(
            order => order.status === "Shipped"
        ).length;

        const deliveredOrders = orders.filter(
            order => order.status === "Delivered"
        ).length;

        const cancelledOrders = orders.filter(
            order => order.status === "Cancelled"
        ).length;


        // Total spent
        const totalSpent = orders
            .filter(order => order.status !== "Cancelled")
            .reduce(
                (total, order) =>
                    total + Number(order.totalPrice || 0),
                0
            );


        // Recent 5 orders
        const recentOrders = orders.slice(0, 5);


        res.status(200).json({

            message: "Customer dashboard data",

            stats: {
                totalOrders,
                pendingOrders,
                processingOrders,
                shippedOrders,
                deliveredOrders,
                cancelledOrders,
                totalSpent: Number(
                    totalSpent.toFixed(2)
                )
            },

            recentOrders

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Internal server error",
            isError: true
        });

    }

});



// ==========================================
// ADMIN DASHBOARD
// ==========================================

router.get("/admin", verifyToken, async (req, res) => {

    try {

        const { role } = req;

        // Admin only
        if (role !== "superAdmin") {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }


        // Get all orders
        const orders = await Orders
            .find()
            .sort({ createdAt: -1 });


        // Get products
        const products = await Products.find();


        // Get customers
        const customers = await User.find({
            role: "customer"
        });


        // Order stats
        const totalOrders = orders.length;

        const pendingOrders = orders.filter(
            order => order.status === "Pending"
        ).length;

        const processingOrders = orders.filter(
            order => order.status === "Processing"
        ).length;

        const shippedOrders = orders.filter(
            order => order.status === "Shipped"
        ).length;

        const deliveredOrders = orders.filter(
            order => order.status === "Delivered"
        ).length;

        const cancelledOrders = orders.filter(
            order => order.status === "Cancelled"
        ).length;


        // Sales
        const totalSales = orders
            .filter(order => order.status !== "Cancelled")
            .reduce(
                (total, order) =>
                    total + Number(order.totalPrice || 0),
                0
            );


        // Low stock
        const lowStockProducts = products.filter(
            product => Number(product.stock) <= 5
        );


        // Recent orders
        const recentOrders = orders.slice(0, 5);


        res.status(200).json({

            message: "Admin dashboard data",

            stats: {

                totalOrders,

                pendingOrders,

                processingOrders,

                shippedOrders,

                deliveredOrders,

                cancelledOrders,

                totalProducts: products.length,

                totalCustomers: customers.length,

                lowStockProducts:
                    lowStockProducts.length,

                totalSales: Number(
                    totalSales.toFixed(2)
                )

            },

            recentOrders,

            lowStockProducts

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Internal server error",
            isError: true
        });

    }

});


module.exports = router;


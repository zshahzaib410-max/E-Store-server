const express = require("express");
const router = express.Router();
const multer = require("multer");

const { verifyToken } = require("../middleware/auth")
const Products = require("../models/products");
const cloudinary = require("../config/cloudinary");
const { getRandomId } = require("../config/global");


const storage = multer.memoryStorage();
const upload = multer({ storage });

// CREAT CODE HERE

router.post("/create", verifyToken, upload.fields([{ name: "image", }]), async (req, res) => {
    try {
        const { name, price, stock, description, category } = req.body;

        if (!name || !price || !stock || !description || !category) {
            return res.status(400).json({ message: "Please fill all fields", });
        }

        const { uid } = req;
        const id = getRandomId();

        let imageUrl = "";
        let imagePublicId = "";

        if (req.files?.image?.[0]) {
            await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream({ folder: "products" }, (error, result) => {
                    if (error) return reject(error);

                    imageUrl = result.secure_url;
                    imagePublicId = result.public_id;

                    resolve();
                }
                );

                uploadStream.end(req.files.image[0].buffer);
            });
        }

        const productData = { uid, id, name, price, stock, category, description, imageUrl, imagePublicId, };

        const product = new Products(productData);
        await product.save();

        res.status(201).json({
            message: "Product created successfully",
            product,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({ message: "Internal Server Error", isError: true, });
    }
}
);

// ALL PRODUCTS GET CODE

router.get("/all", verifyToken, async (req, res) => {
    try {
        if (req.role !== "superAdmin") { return res.status(410).json({ message: "User not access" }) }
        const { uid } = req
        const products = await Products.find({ uid })

        res.status(200).json({ message: "Products add successfully", products })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal server error", isError: true })
    }
})

// PUBLIC PRODUCTS GET CODE

router.get("/public-call", async (req, res) => {
    try {
        const products = await Products.find({ status: "active" })

        res.status(200).json({ message: "All products ", products })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal server error", isError: true })
    }
})

// DELET PRODUCT CODE HERE 

router.delete("/delete/:id", verifyToken, async (req, res) => {
    try {
        if (req.role !== "superAdmin") { return res.status(410).json({ message: "User not access" }) }
        const { uid } = req
        const { id } = req.params

        const product = await Products.findOneAndDelete({ id, uid })

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            })
        }

        if (product.imagePublicId) {
            await cloudinary.uploader.destroy(product.imagePublicId)
        }


        res.status(200).json({
            message: "Product deleted successfully"
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal server error", isError: true })
    }
})

// EDIT PRODUCTS CODE 

router.patch("/update/:id", verifyToken, upload.fields([{ name: "image" }]), async (req, res) => {
    try {
        if (req.role !== "superAdmin") { return res.status(410).json({ message: "User not access" }) }
        const { uid } = req
        const { id } = req.params

        const { name, price, stock, category, description } = req.body

        if (!name || !price || !stock || !category || !description) {
            return res.status(400).json({ message: "All fields are required" })
        }

        const product = await Products.findOne({ id, uid })

        if (!product) {
            return res.status(404).json({ message: "Product not found" })
        }

        let imageUrl = product.imageUrl
        let imagePublicId = product.imagePublicId

        if (req.files?.image?.[0]) {

            if (product.imagePublicId) {
                await cloudinary.uploader.destroy(product.imagePublicId)
            }

            await new Promise((resolve, reject) => {

                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: "products" },
                    (error, result) => {

                        if (error) return reject(error)

                        imageUrl = result.secure_url
                        imagePublicId = result.public_id

                        resolve()
                    }
                )

                uploadStream.end(req.files.image[0].buffer)

            })

        }

        const updateProduct = await Products.findOneAndUpdate(
            { id, uid }, { name, price, stock, category, description, imageUrl, imagePublicId }, { new: true })

        res.status(200).json({ message: "Product updated successfully", updateProduct })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal server error", isError: true })
    }
})

module.exports = router;
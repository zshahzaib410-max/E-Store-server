const express = require("express")
const router = express.Router()
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')
const { JWT_SECRET } = process.env

const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

const Users = require("../models/auth")
const { getRandomId } = require("../config/global")
const { verifyToken } = require("../middleware/auth")


router.post("/register", async (req, res) => {

    try {
        const { fullName, email, password } = req.body || {}
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "Fill all fields required" })
        }

        const userFound = await Users.findOne({ email })
        if (userFound) {
            return res.status(400).json({ message: "User already exists" })
        }

        const hashPassword = await bcrypt.hash(password, 10)


        const userData = { fullName, password: hashPassword, email, uid: getRandomId() }

        const newUser = new Users(userData)
        await newUser.save()
        res.status(201).json({
            message: "User created successfully",
            user: {
                uid: newUser.uid,
                fullName: newUser.fullName,
                email: newUser.email,
                role: newUser.role,
                status: newUser.status,
            }
        })

    }

    catch (err) {
        console.error(err)
        res.status(500).json({ message: "Internal server error" })
    }

})

//LOGIN CODE HERE /////////////

router.post("/login", async (req, res) => {

    try {
        const { email, password } = req.body || {}
        if (!email || !password) {
            return res.status(400).json({ message: "Fill all fields required" })
        }

        const userFound = await Users.findOne({ email })
        if (!userFound) {
            return res.status(400).json({ message: "Invalid email or password" })
        }

        const passwordValid = await bcrypt.compare(password, userFound.password)
        if (!passwordValid) {
            return res.status(400).json({ message: "Invalid email or password" })
        }

        if (userFound.status !== "active") {
            return res.status(400).json({ message: "Your account is not active" })
        }

        // Token generete here to stay login  //////////

        const token = jwt.sign({ uid: userFound.uid, role: userFound.role }, JWT_SECRET, { expiresIn: "1d" });

        const user = { uid: userFound.uid, fullName: userFound.fullName, email: userFound.email, status: userFound.status, role: userFound.role };

        res.status(200).json({ message: "User login successfully", token, user });
    }

    catch (err) {
        console.error(err)
        res.status(500).json({ message: "Internal server error" })
    }

})

//USER STAY LOGIN CODE HERE

router.get("/user", verifyToken, async (req, res) => {

    try {
        const { uid } = req

        const userFound = await Users.findOne({ uid })
        if (!userFound) {
            return res.status(404).json({ message: "User not found" })
        }

        res.status(200).json({
            message: "User profile", user: {
                uid: userFound.uid,
                fullName: userFound.fullName,
                email: userFound.email,
                role: userFound.role,
                status: userFound.status
            }
        })
    }

    catch (err) {
        console.error(err)
        res.status(500).json({ message: "Internal server error" })
    }

})

// FORGOT PASSWORD SENT EMAIL CODE HERE

router.post("/forgot-password", async (req, res) => {

    try {

        let { email } = req.body || {}

        if (!email) { return res.status(400).json({ message: "Email is required" }) }

        // email = email.trim().toLowerCase()
        // console.log("Forgot password email:", email)

        const userFound = await Users.findOne({ email })

        console.log("User found:", userFound)

        if (!userFound) { return res.status(400).json({ message: "User with this email does not exist" }) }

        const resetToken = jwt.sign({ uid: userFound.uid }, JWT_SECRET, { expiresIn: "15m" })

        const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`

        await transporter.sendMail({
            from: `"Your Website" <${process.env.EMAIL_USER}>`, to: userFound.email, subject: "Reset Your Password", html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">

                    <h2>Reset Your Password</h2>

                    <p>Hello ${userFound.fullName || "User"},</p>

                    <p>
                        You requested to reset your password.
                    </p>

                    <p>
                        Click the button below to reset your password:
                    </p>

                    <a
                        href="${resetLink}"
                        style="
                            display: inline-block;
                            padding: 12px 20px;
                            background: #1677ff;
                            color: white;
                            text-decoration: none;
                            border-radius: 6px;
                        "
                    >
                        Reset Password
                    </a>

                    <p>
                        This link will expire in 15 minutes.
                    </p>

                    <p>
                        If you did not request this, you can ignore this email.
                    </p>

                </div>
            `
        })

        console.log("Reset email sent successfully")

        return res.status(200).json({ message: "Password reset link sent to your email" })

    } catch (err) {

        console.error("Forgot Password Error:", err)

        return res.status(500).json({ message: "Failed to send password reset email" })
    }
})


// RESET PASSWORD CODE HERE

router.patch("/reset-password", async (req, res) => {

    try {

        const { token, password } = req.body || {};

        // Token aur password check
        if (!token || !password) { return res.status(400).json({ message: "Token and password are required" }); }

        // Password length check
        if (password.length < 6) { return res.status(400).json({ message: "Password must be at least 6 characters" }); }

        // Token verify
        let decoded;

        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {

            return res.status(400).json({ message: "Invalid or expired reset link" });
        }

        // Token se uid
        const { uid } = decoded;

        // User find
        const userFound = await Users.findOne({ uid });

        if (!userFound) {
            return res.status(400).json({ message: "User not found" });
        }

        // New password hash
        const hashPassword = await bcrypt.hash(password, 10);

        // Password update
        await Users.findOneAndUpdate({ uid }, { password: hashPassword }, { new: true });

        return res.status(200).json({ message: "Password reset successfully" });

    } catch (err) {

        console.error("Reset Password Error:", err);

        return res.status(500).json({ message: "Internal server error" });
    }

});

//USER PASSWORD CODE HERE

router.patch("/change-password", verifyToken, async (req, res) => {

    try {
        const { uid } = req

        const userFound = await Users.findOne({ uid })
        if (!userFound) {
            return res.status(400).json({ message: "User not found" })
        }

        const { oldPassword, newPassword } = req.body
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "All fields are required" })
        }

        const passwordValid = await bcrypt.compare(oldPassword, userFound.password)
        if (!passwordValid) {
            return res.status(400).json({ message: "Invalid old password" })
        }

        const hashPassword = await bcrypt.hash(newPassword, 10)

        const updateUser = await Users.findOneAndUpdate({ uid }, { password: hashPassword }, { new: true })

        res.status(200).json({ message: "User update successfully", updateUser })

    }

    catch (err) {
        console.error(err)
        res.status(500).json({ message: "Internal server error" })
    }

})

//USER UPDATE CODE

router.patch("/user-update", verifyToken, async (req, res) => {

    try {
        const { uid } = req

        const userFound = await Users.findOne({ uid })
        if (!userFound) {
            return res.status(404).json({ message: "User not found" })
        }

        const { fullName, email } = req.body
        if (!fullName || !email) {
            return res.status(400).json({ message: "All fields are required" })
        }

        const updateUser = await Users.findOneAndUpdate({ uid }, { fullName, email }, { new: true }).select("-password")
        if (!updateUser) { return res.status(404).json({ message: "User not found" }); }

        res.status(200).json({ message: "User update successfully", updateUser })

    }

    catch (err) {
        console.error(err)
        res.status(500).json({ message: "Internal server error" })
    }

})

//User DELETE CODE HERE

router.delete("/delete-user-by-user", verifyToken, async (req, res) => {

    try {
        const { uid } = req

        const userFound = await Users.findOne({ uid })
        if (!userFound) {
            return res.status(404).json({ message: "User not found" })
        }

        const userDelete = await Users.findOneAndDelete({ uid }).select("-password")
        if (!userDelete) { return res.status(404).json({ message: "User not found" }); }

        res.status(200).json({ message: "User delete successfully", userDelete })

    }

    catch (err) {
        console.error(err)
        res.status(500).json({ message: "Internal server error" })
    }

})


//ADMIN USERS GET CODE HERE

router.get("/users", verifyToken, async (req, res) => {

    try {
        const { uid } = req

        const userFound = await Users.findOne({ uid })

        if (!userFound || userFound.role !== "superAdmin") {
            return res.status(401).json({ message: "Unauthorized you are not super admin" })
        }

        const users = await Users.find().select("-password")

        res.status(200).json({ message: "Users", users })
    }

    catch (err) {
        console.error(err)
        res.status(500).json({ message: "Internal server error" })
    }

})

//USER UPDATE NAME, EMAIL, STATUS, ROLE BY ADMIN CODE HERE

router.patch("/user-update-by-superadmin/:userId", verifyToken, async (req, res) => {

    try {
        const { uid } = req

        const userFound = await Users.findOne({ uid })
        if (!userFound || userFound.role !== "superAdmin") {
            return res.status(401).json({ message: "Unauthorized you are not super admin" })
        }

        const { userId } = req.params

        const { fullName, email, role, status } = req.body;
        if (!userId || !fullName || !email || !role || !status) {
            return res.status(400).json({ message: "All fields are required" })
        }


        const updateUser = await Users.findOneAndUpdate({ uid: userId }, { email, fullName, role, status }, { new: true }).select("-password")
        if (!updateUser) { return res.status(404).json({ message: "User not found" }); }

        res.status(200).json({ message: "User update successfully", updateUser })

    }

    catch (err) {
        console.error(err)
        res.status(500).json({ message: "Internal server error" })
    }

})


//ADMIN DELETE CODE HERE

router.delete("/delete-user-by-superadmin/:userId", verifyToken, async (req, res) => {

    try {
        const { uid } = req

        const userFound = await Users.findOne({ uid })
        if (!userFound || userFound.role !== "superAdmin") {
            return res.status(401).json({ message: "Unauthorized" })
        }

        const { userId } = req.params
        if (uid === userId) { return res.status(400).json({ message: "You can't delete your own account" }) }

        const userDelete = await Users.findOneAndDelete({ uid: userId }).select("-password")
        if (!userDelete) { return res.status(404).json({ message: "User not found" }); }

        res.status(200).json({ message: "User delete successfully", userDelete })

    }

    catch (err) {
        console.error(err)
        res.status(500).json({ message: "Internal server error" })
    }

})






module.exports = router
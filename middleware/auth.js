const jwt = require('jsonwebtoken')
const { JWT_SECRET } = process.env

const verifyToken = (req, res, next) => {

    try {
        const token = req.headers.authorization?.split(" ")[1]
        if (!token) {
            return res.status(401).json({ message: "Unauthorized or token not access" })
        }
        jwt.verify(token, JWT_SECRET, (error, result) => {

            if (error) { return res.status(401).json({ message: "Unauthorized or token not access" }) }

            req.uid = result.uid
            req.role = result.role
            next()
        })
    }

    catch (err) {
        console.error(err)
        res.status(501).json({ message: "Internal server error" })
    }

}

module.exports = { verifyToken }
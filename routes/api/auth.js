const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/users');
const config = require('config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const {
    check,
    validationResult
} = require('express-validator');

// @route GET api/auth
// @desc TEST route
// @access Public

router.get('/', auth, async (req, res) => {

    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
})

// @route POST api/auth
// @desc Authenticate and get token
// @access Public

router.post('/', [
    check('email', 'Please enter a valid Email!')
        .isEmail(),
    check('password', 'Please Required !')
        .exists()
],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }
        const {
            email,
            password
        } = req.body;

        try {

            //see if user exists
            let user = await User.findOne({
                email
            });

            if (!user) {
                return res.status(400).json({
                    errors: [{
                        msg: 'Invalid Ninja Id !'
                    }]
                });
            }

            //compare password
            const ismatch = await bcrypt.compare(password, user.password);
            if (!ismatch) {
                return res.status(400).json({
                    errors: [{
                        msg: 'Oops !Password do not match !'
                    }]
                });
            }

            //return jsonwebtoken
            const payload = {
                user: {
                    id: user.id
                }
            }
            jwt.sign(payload, config.get('jwtToken'), {
                expiresIn: 360000
            }, (err, token) => {
                if (err)
                    throw err;
                res.json({
                    token
                });

            });

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    })

module.exports = router;
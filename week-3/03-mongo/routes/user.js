const { Router } = require("express");
const router = Router();
const userMiddleware = require("../middleware/user");
const { User, Course } = require("../db");
const z= require('zod');

const userSchema = z.object({
    username: z.string(),
    password: z.string().min(3).max(20),
});

// User Routes
router.post('/signup', (req, res) => {
    // Implement user signup logic
    const {username, password} = req.body;
    const result = userSchema.safeParse({username: username, password: password});
    if(result.success){
        User.findOne({username: username}, function(err, user){
            if(err){
                res.status(500).json({
                    message: "Internal server error"
                })
            }
            else if(user){
                res.status(409).json({
                    message: "Conflict"
                })
            }
            else{
                const user = new User({
                    username: username,
                    password: password
                })
                user.save(function(err, user){
                    if(err){
                        res.status(500).json({
                            message: "Internal server error"
                        })
                    }
                    else{
                        res.status(201).json({
                            message: "Created"
                        })
                    }
                })
            }
        })
    }
    else{
        res.status(400).json({
            message: "Bad request"
        })
    }

});

router.get('/courses', (req, res) => {
    // Implement listing all courses logic
    Course.find({}, function(err, courses){
        if(err){
            res.status(500).json({
                message: "Internal server error"
            })
        }
        else{
            res.status(200).json({
                courses: courses
            })
        }
    })
});

router.post('/courses/:courseId', userMiddleware, (req, res) => {
    // Implement course purchase logic
    const courseId = req.params.courseId;
    const username = req.headers.username;
    const password = req.headers.password;
    const user = {
        username: username,
        password: password
    }
    const result = userSchema.safeParse(user);
    if(result.success){
        User.findOne({username: username, password: password}, function(err, user){
            if(err){
                res.status(500).json({
                    message: "Internal server error"
                })
            }
            else if(!user){
                res.status(401).json({
                    message: "Unauthorized"
                })
            }
            else{
                Course.findOne({_id: courseId}, function(err, course){
                    if(err){
                        res.status(500).json({
                            message: "Internal server error"
                        })
                    }
                    else if(!course){
                        res.status(404).json({
                            message: "Not found"
                        })
                    }
                    else{
                        user.courses.push(course);
                        user.save(function(err, user){
                            if(err){
                                res.status(500).json({
                                    message: "Internal server error"
                                })
                            }
                            else{
                                res.status(200).json({
                                    message: "OK"
                                })
                            }
                        })
                    }
                })
            }
        })
    }
    else{
        res.status(401).json({
            message: "Unauthorized"
        })
    }
});

router.get('/purchasedCourses', userMiddleware, (req, res) => {
    // Implement fetching purchased courses logic
    const username = req.headers.username;
    const password = req.headers.password;
    const user = {
        username: username,
        password: password
    }
    const result = userSchema.safeParse(user);
    if(result.success){
        User.findOne({username: username, password: password}, function(err, user){
            if(err){
                res.status(500).json({
                    message: "Internal server error"
                })
            }
            else if(!user){
                res.status(401).json({
                    message: "Unauthorized"
                })
            }
            else{
                Course.find({_id: {$in: user.courses}}, function(err, courses){
                    if(err){
                        res.status(500).json({
                            message: "Internal server error"
                        })
                    }
                    else{
                        res.status(200).json({
                            courses: courses
                        })
                    }
                })
            }
        })
    }
    else{
        res.status(401).json({
            message: "Unauthorized"
        })
    }
});

module.exports = router
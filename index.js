const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const bodyParser = require('body-parser')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use('/src', express.static(__dirname + '/src'))

mongoose.connect(process.env['MONGO_URI'])
const Schema = mongoose.Schema
const model = mongoose.model
const User = model('User', new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    }
}))
const Exercise = model('Exercise', new Schema({
    username: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    date: {
        type: String,
        required: true,
    }
}))

app.route('/').get((req, res) => {
    res.sendFile(__dirname + '/src/index.html')
})

app.route('/api/users').get((req, res) => {
    User.find({}, 'username _id').then((docs) => {
        res.send(docs)
    }).catch((err) => {
        console.log("Error while fetching users")
        res.send("Error")
    })
}).post((req, res) => {
    const uname = req.body['username']
    new User({
        username: uname
    }).save().then((doc) => {
        res.json({ username: doc.username, _id: doc._id })
    }).catch((err) => {
        console.log("Error occured")
        res.send("Error")
    })
})

app.route('/api/users/:_id/exercises').post((req, res) => {
    const id = req.params['_id']
    const desc = req.body['description']
    const dur = parseInt(req.body['duration'])
    const dt = req.body['date'] ? new Date(req.body['date']) : new Date(Date.parse(`${new Date().toDateString()} GMT`))
    User.findById(id).then((user) => {
        const uname = user.username
        new Exercise({
            username: uname,
            description: desc,
            duration: dur,
            date: dt.toDateString()
        }).save().then((doc) => {
            res.json({ username: uname, description: desc, duration: dur, date: doc.date, _id: id })
        }).catch((err) => {
            console.log("Error occured")
            res.send("Error")
        })
    }).catch((err) => {
        console.log("Some error occured")
        res.send("Error")
    })
})

app.route('/api/users/:_id/logs').get((req, res) => {
    const id = req.params['_id']
    const f = req.query['from']
    const t = req.query['to']
    var limit = req.query['limit'] ? parseInt(req.query['limit']) : undefined
    User.findById(id).then((user) => {
        const uname = user.username
        Exercise.find({ username: uname }).then((docs) => {
            var arr = [...docs]
            if (f) {
                ft = new Date(f).getTime()
                arr = arr.filter((doc) => {
                    var d = new Date(Date.parse(`${doc.date} GMT`)).getTime()
                    return (ft <= d)
                })
            }
            if (t) {
                tt = new Date(t).getTime()
                arr = arr.filter((doc) => {
                    var d = new Date(Date.parse(`${doc.date} GMT`)).getTime()
                    return (d <= tt)
                })
            }
            var logs = arr.map((doc) => {
                return { description: doc.description, duration: doc.duration, date: doc.date }
            })
            if (limit && limit < arr.length) {
                logs = logs.slice(start = arr.length - limit)
            }
            res.json({ username: uname, _id: id, count: logs.length, log: logs })
        }).catch((err) => {
            console.log("Error")
            res.send("Error")
        })
    }).catch((err) => {
        console.log("Error occured")
        res.send("Error")
    })
})


const port = process.env['PORT'] || 3000;
app.listen(port, () => {
    console.log(`http://localhost:${port}`)
})

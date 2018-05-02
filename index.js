// import dependencies to configure server
const express = require("express")
const bodyParser = require("body-parser")
const cloudinary = require('cloudinary');
const mongoose = require("mongoose")
const app = express();
require('dotenv').config()

var multer = require('multer')

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + "." + file.fieldname.format)
    }
})

var upload = multer({ storage: storage })

const urlsDB = mongoose.model("url", {
    uri: {
        type: String,
        trim: true,
    },
    extension: {
        type: String,
        trim: true,
    },
    size: {
        type: Number,
        trim: true,
    },
})

mongoose.connect(process.env.MONGO_URI)

cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
});

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
    res.send("WORKING")
})

app.get('/api/files', (req, res) => {
    const getFiles = async () => {
        return await urlsDB.find();
    }

    const queryFiles = async (req, res) => {
        const files = await getFiles();
        res.send(files).status(200).json()
    }

    queryFiles(req, res);

})

app.post('/api/upload', upload.fields([{ name: 'file', maxCount: 1 }]), function (req, res, next) {

    const saveFile = async (cloudinaryFile) => {
        console.log(cloudinaryFile);

        const file = new urlsDB({
            uri: cloudinaryFile.secure_url,
            extension: cloudinaryFile.format,
            size: cloudinaryFile.bytes,
        })
        const result = await file.save()
        res.send(result).status(200)
    }

    cloudinary.uploader.upload(req.files.file[0].path, function (result) {
        saveFile(result)
    }, {
            resource_type: "video"
        });

})

app.listen(8080, () => {
    console.log("Running server!");

})
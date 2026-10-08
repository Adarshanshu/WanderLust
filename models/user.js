const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new Schema({
    email:{
        type:String,
        required:true,
        // username and password will automatically will be generated from passport-local-mongoose
    }
});


userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('user',userSchema)
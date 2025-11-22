const mongoose  =  require('mongoose');



const itemSchema  = new mongoose.Schema({
    name : {
        type : String,
    },
    amount :{
        type :Number,
        default : 0

    },

    status :{
        type : String,
        default :""

    },
    createdAt : {
        type : Date,
        default : Date.now
    }
})

module.exports =  mongoose.model('items',itemSchema);
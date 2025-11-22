const mongoose  =  require('mongoose');



const cartSchema  = new mongoose.Schema({
    user_id :{
        type : String,
    },
    items : [{
        type:String,
    }],
    amount : {
        type :Number,
        default :0
    },
    status :{
        type : String,
        default : ""

    },
    createdAt : {
        type : Date,
        default : Date.now()
    }
})

module.exports =  mongoose.model('carts',cartSchema);
const mongoose  =  require('mongoose');



const cart_itemSchema  = new mongoose.Schema({
    cart_id :{
        type :String,
    },
    item_id :{
        type : String,
    }
})

module.exports =  mongoose.model('cart_items',cart_itemSchema);
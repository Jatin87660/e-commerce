const mongoose  =  require('mongoose');


const ordersSchema = new mongoose.Schema({
    user_id: {
        type: String,
    },
    items: [{
        type: String,
    }],
    amount: {
        type: Number,
        default: 0
    }
}, { timestamps: true }); // <-- adds createdAt and updatedAt automatically


module.exports =  mongoose.model('orders',ordersSchema);
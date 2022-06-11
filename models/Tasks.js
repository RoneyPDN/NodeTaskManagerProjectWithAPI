const mongoose = require('mongoose');


const TaskSchema = new mongoose.Schema({
    name:{
        type: String,
        required:[true,'Por favor, informar o nome'],
        trim: true,
        maxlength: [20, 'O nome não pode ser maior que 20 caracteres'],
    },completed: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model('Task', TaskSchema)
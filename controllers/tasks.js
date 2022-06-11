const Task = require('../models/Tasks')
const asyncWrapper = require('../middleware/async')
const getAllTasks = asyncWrapper( async (req, res) => {
        const tasks = await Task.find({})
        res.status(200).json({tasks})
})
const createTask = asyncWrapper( async (req, res) => {
        const task = await Task.create(req.body)
        res.status(201).json({task})            
})
const getTask = asyncWrapper( async (req, res) => {
        const {id:taskID} = req.params
        const task = await Task.findOne({_id:taskID})

        res.status(200).json({ task })
    if(!task){
        return res.status(404).json({ msg: `Não existe dados com o seguinte ID = ${taskID}`})
    }
})
const updateTask = asyncWrapper( async (req, res) => {
        const {id:taskID} = req.params;
        const task = await Task.findByIdAndUpdate({_id:taskID}, req.body, {
            new:true,
            runValidators: true,
        })
        if(!task){
            return res.status(404).json({ msg: `Não existe dados com o seguinte ID = ${taskID}`})
        }    
        res.status(200).json({id:taskID,data:req.body})
    res.send('update task')
})
const deleteTask = asyncWrapper( async (req, res) => {
        const {id:taskID} = req.params
        const task = await Task.findOneAndDelete({_id:taskID})
        if(!task){
            return res.status(404).json({ msg: `Não existe dados com o seguinte ID = ${taskID}`})
        }    
    res.send('delete task')
})
module.exports = {
    getAllTasks, createTask, getTask, updateTask, deleteTask,
}
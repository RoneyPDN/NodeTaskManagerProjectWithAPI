const moongose = require('mongoose');

const connectDataBase = () => {moongose.connect(process.env.DB_LOCAL_URI,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}).then(con =>{
    console.log(`MongoDb connected with the host: ${con.connection.host}`)
})
};


module.exports = connectDataBase
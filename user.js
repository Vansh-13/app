const mongoose=require('mongoose');
mongoose.connect('mongodb+srv://madaanvansh:H@rsh13lpu@cluster0.fagey.mongodb.net/');

const userScahma=mongoose.Schema({
          username:String,
          name:String,
          age:Number,
          email:String,
          password:String,
          posts:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:'post'
            }
          ]
})

module.exports=mongoose.model("user",userScahma);

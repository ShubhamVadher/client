const mongoose=require("mongoose");
const userSchema=mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true,
        minlength:2
    },
    email:{
        type:String,
        required:true,
        trim:true,
        
    },
    password:{
        type:String,
        required:true,
        
        minlength:7
    },
    cpassword:{
        type:String,
        required:true,
        
        minlength:7
    },
    dues:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"due"
            }
    ],
    groups:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"group"
        }
    ],
    transactions:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"transactions"
        }
    ]

})

module.exports=mongoose.model('user',userSchema);
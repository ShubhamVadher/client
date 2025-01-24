require('dotenv').config()
const connection=require('./config/connection');
const express=require("express");
const bcrypt=require("bcrypt");
const User=require('./models/user');
const {otp}=require('./mailing/mail');
const {tokengen}=require('./jwt/gentoken');
const {isloggedin}=require('./middleware/middlesware');
const jwt=require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const Dues=require('./models/dues');
const otp_check=process.env.OTP_CHECK
const app=express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser())

app.post('/signin',async(req,res)=>{
    const {email,password}=req.body;
    const myuser=await User.findOne({email});
    if(myuser){
        const pass=await bcrypt.compare(password,myuser.password);
        if(pass){
            const token=tokengen(myuser);
            res.cookie("token",token);
            return res.status(200).json({message:"Signin success"});
        }
        else{
            return res.status(401).json({message:"Wrong email or password"})
        }
    }
    else{
        return res.status(401).json({message:"Wrong email or password"})
    }
    
})

app.post('/signup', async (req, res) => {
    const {name,email,password,cpassword} = req.body;
    console.log(req.body);
    const find_user = await User.findOne({ email });
    if (find_user) {
        return res.status(401).json({ message: "User Already exists, try signing in instead" });
    } 

    else if (password!=cpassword) {
        console.log(password);
        console.log(cpassword);
        return res.status(401).json({ message: "Password and Confirm password do not match" });
    } 
    else {
        const otpCode = await otp(email);  // OTP generation
        try {
            const hashedPassword = await bcrypt.hash(password, 12);  // Use await to ensure completion
            const otpcheck = jwt.sign({ name, email, password: hashedPassword, cpassword: hashedPassword, otp: otpCode }, otp_check);
            res.cookie('otpCookie', otpcheck);
            return res.status(200).json({ message: "Signup auth success" });
        } catch (err) {
            console.error('Error hashing password:', err);
            return res.status(500).json({ message: "Error processing signup" });
        }
    }
});


app.post('/signupotp',async(req,res)=>{
    const{otp,email,attempts_left}=req.body;
    try{
        if(!req.cookies.otpCookie){
            return res.status(404).json({message:"Something Went Wrong"});
        }
        const data=jwt.verify(req.cookies.otpCookie,otp_check);
        if(otp==data.otp){
            const created_user=await User.create({name:data.name,email:data.email,password:data.password,cpassword:data.password});
            res.clearCookie("otpCookie");
            const token=tokengen(created_user);
            res.cookie('token',token);
            return res.status(200).json({message:"Signup Success"});
        }
        else if(attempts_left>1){
            return res.status(401).json({message:"Incorrect OTP"});
        }
        else{
            res.clearCookie("otpCookie");
            return res.status(401).json({message:"Incorrect OTP"});
        }
    }
    catch(error){
        console.log(error);
    }

})

app.get('/dashboard', isloggedin, (req, res) => {
    // console.log("User data:", req.user); // Debugging line
    return res.status(200).json({ user: req.user });
});

app.get('/logout',isloggedin,(req,res)=>{
    res.clearCookie('token');
    return res.status(200).json({message:"Logged out Successfully"});  
})

app.post('/editprofile', isloggedin, async (req, res) => {
    const { username, password, newpassword, cnewpassword } = req.body;
    console.log(req.body)

    // Validate password presence
    if (!password) {
        return res.status(400).json({ message: "Current password is required" });
    }

    const result = await bcrypt.compare(password, req.user.password);
    if (!result) {
        return res.status(401).json({ message: "Incorrect current password" });
    }

    // Update password if requested
    if (newpassword) {
        if (newpassword !== cnewpassword) {
            return res.status(400).json({ message: "New password and confirmation do not match" });
        }
        req.user.password = await bcrypt.hash(newpassword, 12);
    }

    // Update username if requested
    if (username) {
        req.user.name = username;
    }

    // Save the updated user
    await req.user.save();
    return res.status(200).json({ message: "Profile updated successfully" });
});

app.post('/adddues',isloggedin,async(req,res)=>{
    const{ title,dueDate,amount,dueTo,currency,recurring}=req.body;
    const currentDate = new Date();
    const parsedDueDate = new Date(dueDate); // Make sure to parse the dueDate as a Date object

    const myuser=await User.findOne({name:dueTo});
    if(!myuser){
        return res.status(400).json({ message: "User you want to pay is not found" });
    }
    if (parsedDueDate <= currentDate) {
        return res.status(400).json({ message: "Due date must be in the future." });
    }
    const due=await Dues.create({
        title,
        due_by:req.user._id,
        due_date:dueDate,
        due_to:myuser._id,
        amount,
        currency,
        recurring

    })
    req.user.dues.push(due._id);

    // Populate the dues after adding
    await req.user.save(); // Save the user after adding the due
    await req.user.populate("dues"); // Populate the dues array

    return res.status(200).json({ message: "Due Added successfully" });
})

app.get('/loaddues',isloggedin,async(req,res)=>{
    const myuser = await User.findOne({ _id: req.user._id })
            .populate({
                path: 'dues',
                populate: {
                    path: 'due_to',
                    model: 'user' 
                }
            });
    
    
    if(myuser){
        
        return res.status(200).json({dues:myuser.dues})
    }
    else{
        return res.status(400);
    }
})

app.post('/edit/:id',isloggedin,async(req,res)=>{
    const id=req.params.id;
    const{ title,dueDate,amount,dueTo,currency,recurring}=req.body;
    const currentDate = new Date();
    const parsedDueDate = new Date(dueDate); // Make sure to parse the dueDate as a Date object
    const myuser=await User.findOne({name:dueTo});
    if(!myuser){
        return res.status(400).json({ message: "User you want to pay is not found" });
    }
    if (parsedDueDate <= currentDate) {
        return res.status(400).json({ message: "Due date must be in the future." });
    }
    const due=await Dues.findOneAndUpdate({_id:id},{
        title,
        
        due_date:dueDate,
        due_to:myuser._id,
        amount,
        currency,
        recurring

    });
    await due.save();
    if(!due){
        return res.status(404).json({message:'Due Not Found'});
    }
    return res.status(200).json({message:"Updated successfully"});

})

// const [formdata, setformdata] = useState({
//         title: '',
//         dueDate: '',
//         amount: '',
//         dueTo: '',
//         currency: '',
//         recurring: '',
      
//     });

app.get('/getdue/:id', isloggedin, async (req, res) => {
    const id = req.params.id;
    try {
      const due = await Dues.findOne({ _id: id }).populate('due_to'); // Populate due_to if it's a reference
      if (!due) {
        return res.status(400).json({ message: "No due found" });
      } else {
        return res.status(200).json({
          title: due.title,
          dueDate: due.due_date,
          amount: due.amount,
          dueTo: due.due_to?.name || "",
          currency: due.currency,
          recurring: due.recurring,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  app.get('/deletedue/:id', isloggedin, async (req, res) => {
    const id = req.params.id;
    try {
      // Delete the due from the Dues collection
      const due = await Dues.findOneAndDelete({ _id: id });
  
      if (due) {
        // Get the user ID from the request (assuming req.user is set by the authentication middleware)
        const userId = req.user._id;
  
        // Remove the due ID from the user's dues array
        await User.updateOne(
          { _id: userId }, // Match the user
          { $pull: { dues: id } } // Remove the due ID from the dues array
        );
  
        return res.status(200).json({ message: 'Due deleted successfully.' });
      } else {
        return res.status(404).json({ message: 'Due not found.' });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'An error occurred while deleting the due.' });
    }
  });
  

const port = process.env.PORT || 3000;
app.listen(port,()=>{
    console.log(`listening over port ${port}`)
})

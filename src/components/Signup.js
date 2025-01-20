// import React, { useState } from 'react'
// import axios from 'axios'

// import { useNavigate } from 'react-router-dom';
// function Signup() {
//     const navigate=useNavigate();
//     const[FormData,setFormData]=useState({email:'',password:'',name:'',cpassword:''});
//     const[err,seterr]=useState('');
//     const[showotp,setshowotp]=useState(false);
//     const[otp,setotp]=useState('');
//     const [attempts, setAttempts] = useState(3);
//     const changed=(e)=>{
//         const{name,value}=e.target;
//         setFormData(
//             {...FormData,
//             [name]:value}
//         )
//     }
//     const submited=async(e)=>{
//         e.preventDefault();
//         try{
//             const response=await axios.post('/signup',FormData);
//             if(response.status===200){
//                 setshowotp(true);
//             }
//         }
//         catch(error){
//             if(error.response&&error.response.data.message){
//                 seterr(error.response.data.message);
//             }
//             else{
//                 seterr("Something went Wrong");
//             }
//         }

//     }

//     const otpsubmitted = async (e) => {
//         e.preventDefault();
//         if (attempts <= 0) {
//           resetForm();
//           return;
//         }
    
//         try {
//           const response = await axios.post('/signupotp', {otp,email:email   });
//           if (response.status === 200) {
//             navigate('/profile'); // Navigate to another route (e.g., dashboard) on successful OTP verification
//           }
//         } catch (error) {
//           const remainingAttempts = attempts - 1;
//           setAttempts(remainingAttempts); // Decrease the attempt count
//           if (remainingAttempts <= 0) {
//             seterr('Maximum attempts reached. Please try again.');
//             setshowotp(false);
//             resetForm();
//           } else {
//             seterr(`Invalid OTP. You have ${remainingAttempts} attempts remaining.`);
//           }
//         }
//       };


//   return (
//     <>
//         <form onSubmit={submited}>
//             <input type="text" required name="name" value={FormData.name} placeholder='Name' onChange={changed}/>
//             <input type="email" required name="email" value={FormData.email} placeholder='Email' onChange={changed}/>
//             <input type="password" required name='password' value={FormData.password} placeholder='Password' onChange={changed}/>
//             <input type="password" required name='cpassword' value={FormData.cpassword} placeholder='Confirm Password' onChange={changed}/>
//             <button>Submit</button>
//         </form>
//         <p>{err}</p>
//         {
//             showotp&&<form className='hidden' onSubmit={otpsubmitted}>
//                 <input type="text" placeholder='OTP' value={otp} onChange={(e)=>setotp(e.target.value)}/>
//                 <button>Submit</button>
//             </form>
//         }
//     </>
//   )
// }

// export default Signup

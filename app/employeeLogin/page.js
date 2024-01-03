'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faEyeSlash, faEye } from '@fortawesome/free-solid-svg-icons';


const EmployeeLoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState(null); // State for error message


    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        // Clear the error message when the user types in the email field
        setError(null);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        // Clear the error message when the user types in the password field
        setError(null);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('http://localhost:5000/api/employee/login', {
                email: email,
                password: password,
            });

            // Handle successful login here, e.g., store the token in localStorage or state.
            console.log('Authentication successful', response.data);
            const token = response.data.token;

            localStorage.setItem('authToken', token);
            localStorage.setItem('empUsername', email); // Save the email or any other user information

            router.push('/'); // Redirect to the employee dashboard or any other route
        } catch (error) {
            // Handle login error here, e.g., display an error message.
            console.error('Authentication failed', error);
            setError('Invalid Email or Password');

        }
    };

    const backgroundImageUrl = 'https://img.freepik.com/free-vector/simple-blue-blank-background-vector-business_53876-175738.jpg?w=1060&t=st=1697710227~exp=1697710827~hmac=2ab6a050d4771018bf7db10f8ffd2245b223c5a37195b37716e080c4a5f0cf5c';

    return (
        <>
            <section className=" bg-gray-50 dark:bg-gray-900">

                <div className="bg-no-repeat bg-cover min-h-screen flex items-center justify-center sm:px-6 lg:px-8"
                    style={{ backgroundImage: `url(${backgroundImageUrl})` }}>
                    {/* <div className="w-full sm:w-2/3 md:w-1/2 lg:w-2/5 xl:w-1/3  p-6 bg-white rounded-lg shadow-md mt-5"> */}
                    <div className="sm:w-1/2 md:w-1/3 lg:w-1/3 p-6 bg-white rounded-lg shadow-md mt-5">
                        <div className="flex items-center justify-center">
                            <Image
                                src="/images/admin.png"
                                alt="img"
                                width={80}
                                height={80}
                            />

                        </div>
                        <h2 className="text-lg md:text-2xl font-semibold text-center">Admin Login</h2>
                        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
                            <div>
                                <label className="block text-sm font-medium">
                                    Email<span className="text-red-500 pl-1">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        name="email"
                                        value={email}
                                        onChange={handleEmailChange}
                                        placeholder="Enter Your Email"
                                        required
                                        className="w-full text-sm md:text-base px-4 py-2 border rounded-md focus:ring focus:ring-indigo-400"
                                    />
                                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <FontAwesomeIcon icon={faEnvelope} className="text-gray-500" />
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">
                                    Password<span className="text-red-500 pl-1">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        placeholder="******"
                                        value={password}
                                        onChange={handlePasswordChange}
                                        required
                                        className="w-full text-sm md:text-base px-4 py-2 border rounded-md focus:ring focus:ring-indigo-400"
                                    />
                                    <span
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                                        onClick={togglePasswordVisibility}
                                    >
                                        <FontAwesomeIcon
                                            icon={showPassword ? faEyeSlash : faEye} // Use the imported icons
                                            className="text-gray-500"
                                        />
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-end">
                                <Link href="/forgotPasswordEmp" className="text-xs md:text-sm font-medium text-primary-600 hover:underline dark:text-primary-500">Forgot password?</Link>
                            </div>

                            <div className="w-48 md:w-full">
                                {error && (
                                    <div className="text-center bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-md text-xs md:text-xs font-semibold md:font-bold p-5" role="alert ">
                                        {error}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2 px-4 text-sm md:text-base text-white bg-indigo-500 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring focus:ring-indigo-400"
                            >
                                Login
                            </button>

                        </form>
                    </div>
                </div>
                <footer className="text-center text-black-500 text-xs md:text-base md:-mt-10 -mt-5">
                    &copy;AB Software Solution. All rights reserved.
                </footer>
            </section>
        </>
    );
};

export default EmployeeLoginForm;





// 'use client'

// import React, { useState } from 'react';
// import axios from 'axios';
// import { useRouter } from 'next/navigation';
// import Image from 'next/image';
// import Link from 'next/link';

// const EmployeeLoginForm = () => {
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const router = useRouter();

//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         try {
//             const response = await axios.post('http://localhost:5000/api/employee/login', {
//                 email: email,
//                 password: password,
//             });


//             // Handle successful login here, e.g., store the token in localStorage or state.
//             console.log('Authentication successful', response.data);
//             const token = response.data.token;

//             localStorage.setItem('authToken', token);
//             localStorage.setItem('empUsername', email); // Save the email or any other user information

//             router.push('/'); // Redirect to the employee dashboard or any other route

//         } catch (error) {
//             // Handle login error here, e.g., display an error message.
//             console.error('Authentication failed', error);
//         }
//     };

//     const backgroundImageUrl = 'https://exergic.in/wp-content/uploads/2018/04/Orange-Background-Vector-Wallpaper.jpg';


//     return (
//         <div className="min-h-screen flex items-center justify-center sm:px-6 lg:px-8"
//             style={{ backgroundImage: `url(${backgroundImageUrl})` }}>
//             <div className="w-1/3 p-6 bg-white rounded-lg shadow-md mt-5">
//                 <div className="flex items-center justify-center">
//                     <Image
//                         src="/images/login.avif"
//                         alt="img"
//                         width={200}
//                         height={200} // You can adjust the height as needed
//                     />
//                 </div>
//                 <h2 className="text-2xl font-semibold text-center">Admin Login</h2>
//                 <form onSubmit={handleSubmit} className="mt-2 space-y-4">
//                     <div>
//                         <label className="block text-sm font-medium">Email:</label>
//                         <input
//                             type="email"
//                             name="email"
//                             value={email}
//                             onChange={(e) => setEmail(e.target.value)}
//                             required
//                             className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-indigo-400"
//                         />
//                     </div>
//                     <div>
//                         <label className="block text-sm font-medium">Password:</label>
//                         <input
//                             type="password"
//                             name="password"
//                             value={password}
//                             onChange={(e) => setPassword(e.target.value)}
//                             required
//                             className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-indigo-400"
//                         />
//                     </div>
//                     <div className="flex items-center justify-end">
//                         <Link href="/forgotPasswordEmp" className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500">Forgot password?</Link>
//                     </div>

//                     <button
//                         type="submit"
//                         className="w-full py-2 px-4 text-white bg-indigo-500 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring focus:ring-indigo-400"
//                     >
//                         Login
//                     </button>
//                 </form>
//             </div>
//         </div>
//     );
// };

// export default EmployeeLoginForm;

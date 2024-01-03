'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import NavSide from '../components/NavSide';
import { faEye, faEyeSlash, faEnvelope,faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


const SubemployeeForm = () => {
    const router = useRouter()
    const [phoneNumberError, setPhoneNumberError] = useState(null);
    const [subEmployee, setSubEmployee] = useState({
        name: '',
        email: '',
        password: '',
        adminCompanyName: '', // Pre-fill with the admin company name
        phoneNumber: '',
    });
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)

    const handleModalClose = () => {
        setIsSuccessModalOpen(false)
        router.push('/subList');
    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    useEffect(() => {
        // Fetch the admin's company name and pre-fill it in the form
        const fetchAdminCompany = async () => {
            try {
                const token = localStorage.getItem('authToken'); // Retrieve JWT token from localStorage
                const response = await axios.get('http://localhost:5000/api/employee/subemployees/company', {
                    headers: {
                        Authorization: token, // Include JWT token in the request headers
                    },
                });
                setSubEmployee((prev) => ({
                    ...prev,
                    adminCompanyName: response.data.companyName,
                }));
            } catch (error) {
                console.error('Error fetching admin company:', error);
                setError('Error fetching admin company');
            }
        };
        fetchAdminCompany();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Phone number validation using regex
        const phoneNumberPattern = /^\d{10}$/; // Matches a 10-digit number
        if (name === 'phoneNumber' && !phoneNumberPattern.test(value)) {
            setPhoneNumberError('Phone number should be 10 digits');
        } else {
            setPhoneNumberError(null);
        }
        setSubEmployee((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Send a POST request to create the subemployee
        try {
            const token = localStorage.getItem('authToken'); // Retrieve JWT token from localStorage
            await axios.post('http://localhost:5000/api/employee/registersub', subEmployee, {
                headers: {
                    Authorization: token, // Include JWT token in the request headers
                },
            });
            setSuccessMessage('Employee registered successfully');
            setError(null);
            
            // Clear the form fields
            setSubEmployee({
                name: '',
                email: '',
                password: '',
                adminCompanyName: subEmployee.adminCompanyName,
                phoneNumber: '',
            });
            
            setIsSuccessModalOpen(true)
            // router.push('/subList');

        } catch (error) {
            console.error('Error registering subemployee:', error);
            setError('Error registering subemployee');
        }
    };

    return (
        <>
            <NavSide />
            <div>

                {isSuccessModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                        <div className="modal-container bg-white sm:w-96 sm:p-6 rounded shadow-lg" onClick={(e) => e.stopPropagation()}>
                            <button type="button" className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={handleModalClose}></button>
                            <div className="p-2 text-center">
                                {/* Customize this section to display your success message */}
                                <FontAwesomeIcon icon={faCircleCheck} className='text-3xl md:text-5xl text-green-600 mt-2' />
                                <p className="mb-3 text-center justify-center mt-3">
                                    {successMessage}
                                </p>
                                <button
                                    type="button"
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4 mr-2 text text-xs md:text-base"
                                    onClick={handleModalClose}
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <section className="bg-gray-50 dark:bg-gray-900 md:mt-2 mt-5 p-8">
                    <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
                        <div className="w-72 md:w-1/2 p-4 bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md dark:bg-gray-800 dark:border-gray-700 sm:p-8">
                            <h2 className="text-xl font-bold leading-tight tracking-tight text-orange-500 md:text-2xl dark:text-white">
                                Create Employee
                            </h2>
                            <form onSubmit={handleSubmit} className="mt-2 space-y-2 lg:mt-5 md:space-y-5">
                                <div>
                                    <label htmlFor="name" className="block mb-0 text-sm font-medium text-gray-900 dark:text-white">Name
                                        <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        className="w-full px-4 py-2 text-xs md:text-sm border rounded-md"
                                        placeholder="Enter Employee Name"
                                        required
                                        value={subEmployee.name}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block mb-0 text-sm font-medium text-gray-900 dark:text-white">Email
                                        <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            name="email"
                                            value={subEmployee.email}
                                            onChange={handleChange}
                                            placeholder="Enter Email"
                                            required
                                            className="w-full px-4 py-2 text-xs md:text-sm border rounded-md"
                                        />
                                        <span className="absolute right-3 top-2 transform -translate-y-0">
                                            <FontAwesomeIcon
                                                icon={faEnvelope}
                                                className="text-gray-500"
                                            />{" "}
                                            {/* Email icon */}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="password" className="block mb-0 text-sm font-medium text-gray-900 dark:text-white">Password
                                        <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            placeholder="Create Password"
                                            value={subEmployee.password}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 text-xs md:text-sm border rounded-md"
                                        />
                                        <span
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                                            onClick={togglePasswordVisibility}
                                        >
                                            <FontAwesomeIcon
                                                icon={showPassword ? faEye : faEyeSlash} // Use the imported icons
                                                className="text-gray-500"
                                            />
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="phoneNumber" className="block mb-0 text-sm font-medium text-gray-900 dark:text-white">Phone Number  <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        id="phoneNumber"
                                        className="w-full px-4 py-2 text-xs md:text-sm border rounded-md"
                                        placeholder="Enter PhoneNumber"
                                        value={subEmployee.phoneNumber}
                                        onChange={handleChange}
                                        required
                                    />
                                    {phoneNumberError && <p className="text-red-500 text-sm mt-1">{phoneNumberError}</p>}

                                </div>
                                <button
                                    type="submit"
                                    className="col-span-2 bg-blue-700 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg w-full text-sm md:text-base"                            >
                                    Create Employee
                                </button>
                            </form>
                            {/* {/* {successMessage && <p className="mt-4 text-green-600">{successMessage}</p>} */}
                            {error && <p className="mt-4 text-red-600">{error}</p>}
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
};

export default SubemployeeForm;


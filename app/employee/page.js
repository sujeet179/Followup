"use client"

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import NavSideSuper from '../components/NavSideSuper';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'; // Assuming 'faWhatsapp' belongs to the brand icons

const initialFormData = {
    name: '',
    email: '',
    password: '',
    adminCompanyName: '',
    phoneNumber: '',

};

const EmployeeRegistration = () => {
    const [formData, setFormData] = useState(initialFormData);
    const [successMessage, setSuccessMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [adminCompanies, setAdminCompanies] = useState([]);
    const [error, setError] = useState(null);
    const router = useRouter();

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    useEffect(() => {
        // Fetch the list of admin's companies from the API
        const fetchAdminCompanies = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/company/companies');
                if (response.status === 200) {
                    setAdminCompanies(response.data);
                }
            } catch (err) {
                console.error('Error fetching admin companies:', err);
            }
        };

        fetchAdminCompanies();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('http://localhost:5000/api/employee/register', formData);

            if (response.status === 201) {
                setFormData({
                    name: '',
                    email: '',
                    password: '',
                    adminCompanyName: '',
                    phoneNumber: '',
                });
                setSuccessMessage('Admin added successfully.');

                const { email, password, phoneNumber } = formData;
                const link = 'http://localhost:3000/employeeLogin'
                const message = `*Welcome! You appointed as Admin for Followup Application*%0A%0A*Username:* ${email}%0A*Password:* ${password}%0A*Login:* ${link}`;
                const whatsappWebURL = `https://web.whatsapp.com/send?phone=${phoneNumber}\n&text=${message}`;

                window.open(whatsappWebURL, '_blank');
                router.push('/empList');
            }
        } catch (err) {
            if (err.response) {
                setError(err.response.data.error);
            } else {
                setError('An error occurred while registering the employee.');
            }
        }
    };

    return (
        <>
            <NavSideSuper />
            <div className='p-2 md:p-1 bg-slate-50 '>
                <div className="mx-auto max-w-md p-6 bg-white rounded-lg shadow-md mt-16 md:mt-28 border border-gray-300">
                    <h2 className="text-sm md:text-2xl font-bold text-center text-orange-500 -mt-3">Admin Registration</h2>
                    <form onSubmit={handleSubmit} className="mt-2 space-y-4">
                        <div>
                            <label className="block text-xs md:text-sm font-medium">Name <span className="text-red-500 text-md">*</span></label>
                            <input
                                type="text"
                                name="name"
                                placeholder='Enter Admin Name'
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-1 md:py-2 border rounded-md focus:ring focus:ring-indigo-400 text-xs md:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs md:text-sm font-medium">Phone Number<span className="text-red-500 text-md">*</span></label>
                            <input
                                type="text"
                                name="phoneNumber"
                                placeholder='Enter Phone Number'
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                className="w-full px-4 py-1 md:py-2 border rounded-md focus:ring focus:ring-indigo-400 text-xs md:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs md:text-sm font-medium">Email <span className="text-red-500 text-md">*</span></label>
                            <div className="relative">
                                <input
                                    type="email"
                                    name="email"
                                    placeholder='Enter Email Id'
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-1 md:py-2 border rounded-md focus:ring focus:ring-indigo-400 text-xs md:text-sm"
                                />
                                <span
                                    className="absolute right-4 top-2 cursor-pointer"
                                >
                                    <FontAwesomeIcon
                                        icon={faEnvelope}
                                        className='text-gray-500'
                                    />
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs md:text-sm font-medium">Password <span className="text-red-500 text-md">*</span></label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="********"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-1 md:py-2 border rounded-md focus:ring focus:ring-indigo-400 text-xs md:text-sm"
                                />

                                <span
                                    className="absolute right-3 top-2 cursor-pointer"
                                    onClick={togglePasswordVisibility}
                                >
                                    <FontAwesomeIcon
                                        icon={showPassword ? faEye : faEyeSlash}
                                        className='text-gray-500'
                                    />
                                </span>

                            </div>
                        </div>

                        <div>
                            <label className="block text-xs md:text-sm font-medium">Select Company Name<span className="text-red-500 text-md">*</span></label>
                            <select
                                name="adminCompanyName"
                                value={formData.adminCompanyName}
                                onChange={handleChange}
                                required
                                className="w-full px-2 py-2 border rounded-md focus:ring focus:ring-indigo-400 text-xs md:text-sm"
                            >
                                <option value="">Select Company</option>
                                {adminCompanies.map((company) => (
                                    <option key={company._id} value={company.companyName}>
                                        {company.companyName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {error && <p className="text-red-500">{error}</p>}
                        {successMessage && <p className="text-green-500">{successMessage}</p>}

                        <div className='relative'>
                            <button
                                type="submit"
                                className="w-full font-bold py-2 px-4 text-white bg-indigo-500 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring focus:ring-indigo-400 text-xs md:text-sm"
                            >
                                Register & Send
                            </button>
                            <span
                                className="absolute right-28 cursor-pointer text-2xl"
                            >
                                <FontAwesomeIcon
                                    icon={faWhatsapp}
                                    className='text-white'
                                />
                            </span>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default EmployeeRegistration;

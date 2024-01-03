'use client'

import React, { useState } from 'react';
import axios from 'axios';
import NavSideEmp from '../components/NavSideEmp';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';


const LeadFormEmp = () => {
    const router = useRouter()
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    const [formData, setFormData] = useState({
        customerName: '',
        companyName: '',
        contactNo: '',
        email: '',
        description: '',
        ownerName: '',
        website: '',
        leadPicture: null, // Initialize with null since it's a file input
    });

    
    const handleModalClose = () => {
        setIsSuccessModalOpen(false)
        router.push('/leadListEmp')
    }

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleChange = (e) => {
        const file = e.target.files[0]; // Assuming a single file upload
        setFormData({ ...formData, leadPicture: file });
    };

    const clearForm = () => {
        setFormData({
            customerName: '',
            companyName: '',
            contactNo: '',
            email: '',
            description: '',
            ownerName: '',
            website: '',
            leadPicture: null,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formDataWithFile = new FormData();
        for (const key in formData) {
            formDataWithFile.append(key, formData[key]);
        }

        // Get the token from localStorage
        const token = localStorage.getItem('authToken');

        // Create headers object with the Authorization token
        const headers = { Authorization: token };

        // Make an API call to create a lead with the token in the headers
        try {
            const response = await axios.post('http://localhost:5000/api/lead/createLead', formDataWithFile, { headers });
            console.log('Lead created:', response.data);
            setSuccessMessage('Lead Created Successfully')
            setIsSuccessModalOpen(true)

            const leadNotificationData = {
                message: 'A new lead has been created',
                description: formData.description,
                customerName: formData.customerName,
                companyName: formData.companyName,
                contactNo: formData.contactNo,
                email: formData.email,
                ownerName: formData.ownerName,
                website: formData.website,
                leadPicture: formData.leadPicture
            };

            const leadNotificationResponse = await axios.post('http://localhost:5000/api/lead/create/Notification', leadNotificationData, { headers });
            console.log('Lead notification created:', leadNotificationResponse.data);
            setSuccessMessage("Lead Created Successfully")
            setIsSuccessModalOpen(true)
            clearForm()
            // router.push('/leadList')

        } catch (error) {
            console.error('Error creating lead:', error);
        }
    };

    return (
        <>
            <NavSideEmp />

            {isSuccessModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-container bg-white sm:w-96 sm:p-6 rounded shadow-lg" onClick={(e) => e.stopPropagation()}>

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

            <div className="w-full md:flex justify-center items-center min-h-screen md:mt-10 md:pl-28 bg-slate-50">

                <div className="w-full md:w-1/2 mt-24 md:mt-0 lg:mt-0"> {/* Adjust the width and margin based on your design */}

                    <div className="w-full md:max-w-2xl overflow-x-auto border border-gray-200 rounded-lg p-5 bg-white">

                        <h1 className="text-xl font-bold mb-4 text-orange-500">Create Lead</h1>

                        <div className="mb-2">
                            <label className="block text-gray-700 font-bold mb-1 text-xs md:text-sm" htmlFor="description">
                                Lead Title
                            </label>
                            <input
                                id="description"
                                name="description"
                                placeholder='Lead Title'
                                value={formData.description}
                                onChange={handleInputChange}
                                className="border rounded-md px-3 py-1 w-full text-sm md:text-sm" />
                        </div>

                        <div className="mb-2">
                            <label className="block text-gray-700 font-bold mb-1 text-xs md:text-sm" htmlFor="customerName">
                                Customer Name
                            </label>
                            <input
                                type="text"
                                id="customerName"
                                name="customerName"
                                value={formData.customerName}
                                onChange={handleInputChange}
                                placeholder='Enter name'
                                className="border rounded-md px-2 py-1 text-xs md:text-sm w-full" // Adjust text size and padding
                            />
                        </div>
                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2">
                            <div className="mb-2 ">
                                <label className="block text-gray-700 font-bold mb-1 text-xs md:text-sm" htmlFor="companyName">
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    id="companyName"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    placeholder='Company name'
                                    className="border rounded-md px-3 py-1 w-full text-xs md:text-sm" />
                            </div>
                            <div className="mb-2">
                                <label className="block text-gray-700 text-xs md:text-sm font-bold mb-1" htmlFor="ownerName">
                                    Owner&apos;s Name
                                </label>
                                <input
                                    type="text"
                                    id="ownerName"
                                    name="ownerName"
                                    placeholder="Enter Owner's name"
                                    value={formData.ownerName}
                                    onChange={handleInputChange}
                                    className="border rounded-md px-3 py-1 w-full text-xs md:text-sm" />
                            </div>

                            <div className="mb-2">
                                <label className="block text-gray-700 font-bold mb-1 text-xs md:text-sm" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    type="text"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder='Enter Email'
                                    className="border rounded-md px-3 py-1 w-full text-xs md:text-sm" />
                            </div>

                            <div className="mb-2">
                                <label className="block text-gray-700 font-bold mb-1 text-xs md:text-sm" htmlFor="contactNo">
                                    Mobile No
                                </label>
                                <input
                                    type="text"
                                    id="contactNo"
                                    name="contactNo"
                                    value={formData.contactNo}
                                    onChange={handleInputChange}
                                    placeholder='Enter Mobile No.'
                                    className="border rounded-md px-3 py-1 w-full text-xs md:text-sm" />
                            </div>

                            <div className="mb-2">
                                <label className="block text-gray-700 text-xs md:text-sm font-bold mb-1" htmlFor="website">
                                    Website
                                </label>
                                <input
                                    type="text"
                                    id="website"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleInputChange}
                                    placeholder='Enter website URL'
                                    className="border rounded-md px-3 py-1 w-full text-xs md:text-sm" />
                            </div>
                            <div className="mb-2">
                                <label className="block text-gray-700 text-xs md:text-sm font-bold mb-1" htmlFor="leadPicture">
                                    Lead Picture
                                </label>
                                <input
                                    type="file"
                                    id="leadPicture"
                                    name="leadPicture"
                                    onChange={handleChange}
                                    className="border rounded-md px-3 py-0.5 w-full text-xs md:text-sm"
                                />
                            </div>


                            <div className="col-span-2 flex justify-center">
                                <button
                                    type="submit"
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm md:text-base"
                                >
                                    Create Lead
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LeadFormEmp;

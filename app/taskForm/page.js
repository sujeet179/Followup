'use client'

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import jwt_decode from 'jwt-decode';
import NavSide from '../components/NavSide';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import Select from 'react-select';

const decodedToken = typeof window !== 'undefined' ? jwt_decode(localStorage.getItem('authToken')) : null;


const getCurrentTimeIn12HourFormat = () => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

const TaskForm = () => {
  const router = useRouter();
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false); // State to manage error modal
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  const handleModalClose = () => {
    setIsSuccessModalOpen(false);
    router.push('/taskList');
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    deadlineDate: '',
    assignTo: '',
    picture: null,
    audio: null,
    assignedBy: decodedToken?.employeeId,
  });

  const [errors, setErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [subemployees, setSubemployees] = useState([]);
  const [currentStartTime, setCurrentStartTime] = useState(getCurrentTimeIn12HourFormat());
  const [currentEndTime, setCurrentEndTime] = useState(getCurrentTimeIn12HourFormat());

  useEffect(() => {
    axios
      .get('http://localhost:5000/api/employee/subemployees/list', {
        headers: {
          Authorization: localStorage.getItem('authToken'),
        },
      })
      .then((response) => {
        const subemployeeList = response.data.map((subemployee) => ({
          id: subemployee._id,
          name: `${subemployee.name}`, // Include type (Employee)
          phoneNumber: subemployee.phoneNumber,
          type: 'Employee', // Indicate type in the data
        }));

        // Also add the Admin as an option
        subemployeeList.push({
          id: decodedToken.employeeId, // Use the Admin's ID
          name: `${decodedToken.name} (Admin)`, // Include type (Admin)
          phoneNumber: null,
          type: 'Admin', // Indicate type in the data
        });

        console.log("subemployeeList", subemployeeList);
        setSubemployees(subemployeeList);
      })
      .catch((error) => {
        console.error('Error fetching subemployees:', error);
      });

    setCurrentStartTime(getCurrentTimeIn12HourFormat());

    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);

    setCurrentEndTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));

  }, []);

  // const handleSearchChange = (e) => {
  //   setSearchQuery(e.target.value)
  // }

  // const handleInputChange = (e) => {
  //   const { name, value } = e.target;
  //   setFormData({
  //     ...formData,
  //     [name]: value,
  //   });
  // };

  const handleInputChange = (selectedOptions) => {
    if (Array.isArray(selectedOptions)) {
      // Handling the case when the input is from the Select component
      const selectedEmployeeIds = selectedOptions.map(option => option.value);

      setFormData({
        ...formData,
        assignTo: selectedEmployeeIds,
      });

      setSelectedEmployees(selectedOptions);
    } else {
      // Handling the case when the input is from a regular input element
      const { name, value } = selectedOptions.target;

      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // const filteredEmployees = subemployees.filter(subemployee => {
  //   return subemployee.name.toLowerCase().includes(searchQuery.toLowerCase());
  // });

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData({
      ...formData,
      [name]: files[0],
    });
  };

  const handleRemovePicture = () => {
    setFormData({
      ...formData,
      picture: null,
    });
    const fileInput = document.getElementById('picture');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleRemoveAudio = () => {
    setFormData({
      ...formData,
      audio: null,
    });
    const audioInput = document.getElementById('audio');
    if (audioInput) {
      audioInput.value = '';
    }
  };


  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedStartTime = new Date(`${formData.startDate} ${currentStartTime}`);
    console.log(selectedStartTime);

    if (!formData.assignTo) {
      // Handle the case where no subemployee is selected
      return;
    }

    const currentDate = new Date();

    if (selectedStartTime < currentDate) {
      // Show an error message that the selected date or time is in the past
      setErrors([{ msg: 'Selected start date or time cannot be in the past' }]);
      setIsErrorModalOpen(true); // Open the error modal

      return;
    }

    const selectedSubemployee = subemployees.find((subemployee) => subemployee.id === formData.assignTo);
    const phoneNumber = selectedSubemployee ? selectedSubemployee.phoneNumber : null;


    console.log("selectedSubemployee", selectedEmployees)

    const requestBody = {
      title: formData.title,
      description: formData.description,
      startDate: formData.startDate,
      startTime: currentStartTime,
      deadlineDate: formData.deadlineDate,
      endTime: currentEndTime,
      assignTo: formData.assignTo,
      phoneNumber: phoneNumber, // Update this with the appropriate variable
      assignedBy: formData.assignedBy,
      picture: formData.picture,
      audio: formData.audio
    };

    console.log("requestBody", requestBody)
    try {
      const response = await axios.post('http://localhost:5000/api/task/create', requestBody, {
        headers: {
          Authorization: localStorage.getItem('authToken'),
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        console.log('Task created Successfully');
        setSuccessMessage(response.data.message);
        setErrors([]);

        const notificationResponse = await axios.post('http://localhost:5000/api/notification/create', {
          recipientId: formData.assignTo,
          taskId: response.data.taskId,
          message: 'A new task has been assigned to you!',
          title: formData.title,
          description: formData.description,
          startDate: formData.startDate,
          deadlineDate: formData.deadlineDate,
          startTime: currentStartTime,
          endTime: currentEndTime,
          status: 'Pending',
        }, {
          headers: {
            Authorization: localStorage.getItem('authToken'),
          },
        });

        if (notificationResponse.status === 201) {
          console.log('Notification sent Successfully');
        }
        setIsSuccessModalOpen(true);

        // router.push('/taskList');
      }
    } catch (error) {
      console.error('Task creation failed:', error);
      if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors([{ msg: 'Internal Server Error' }]);
      }
      setIsErrorModalOpen(true);
    }
  };

  const handleErrorModalClose = () => {
    setIsErrorModalOpen(false);
  };

  return (
    <>

      <NavSide />

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

      {isErrorModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="modal-container bg-white sm:w-96 sm:p-6 rounded shadow-lg" onClick={handleErrorModalClose}>
            <button
              type="button"
              className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
              onClick={handleErrorModalClose}
            ></button>
            <div className="p-2 text-center">
              {/* Customize this section to display your error message */}
              <FontAwesomeIcon icon={faXmark} className='text-3xl md:text-5xl text-red-600 mt-2' />
              <ul className="text-red-500">
                {errors.map((error, index) => (
                  <li key={index}>{error.msg}</li>
                ))}
              </ul>
              <button
                type="button"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4 mr-2 text text-xs md:text-base"
                onClick={handleErrorModalClose}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}


      {/* <div className="w-full flex justify-center items-center min-h-screen mt-12 pl-28"> */}
      <div className="w-full md:flex justify-center items-center min-h-screen md:mt-0 md:pl-28 bg-slate-50">
        {/* <div className=" max-w-2xl overflow-x-auto border border-red-200 rounded-lg p-5 bg-gray-50"> */}
        <div className="w-full md:max-w-2xl overflow-x-auto border border-gray-200 rounded-lg p-5 bg-white mt-16">

          <div className=" col-span-2 mb-3 md:text-2xl font-bold text-orange-500 text-left">Create Task</div>
          <div className="mb-2 ">
            <label htmlFor="title" className="block font-semibold text-xs lg:text-sm">
              Title / कार्यासाठी नाव <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              placeholder='Enter Task Title'
              value={formData.title}
              onChange={handleInputChange}
              className="border-2 border-gray-200 rounded-md px-3 py-2 w-full "
              required
            />
          </div>

          <div className="mb-2">
            <label htmlFor="description" className="block font-semibold text-xs lg:text-sm">
              Description / कार्य वर्णन <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              placeholder='Enter Task Description'
              value={formData.description}
              onChange={handleInputChange}
              className="border-2 border-gray-200 rounded-md px-3 py-2 w-full"
              required
            />
          </div>


          <div className="mb-2">
            <label htmlFor="assignTo" className="block font-semibold text-xs lg:text-sm">
              Assign To / नियुक्त करा <span className="text-red-500">*</span>
            </label>
            {/* <select
              id="assignTo"
              name="assignTo"
              value={formData.assignTo}
              onChange={handleInputChange}
              className="border-2 border-gray-200 rounded-md px-3 py-1 w-full"
              required
            >
              <option value="" disabled>
                Select Employee
              </option>
              {subemployees.map((subemployee) => (
                <option key={subemployee.id} value={subemployee.id}>
                  {subemployee.name}
                </option>
              ))}
            </select> */}
            <Select
              isMulti
              options={subemployees.map(subemployee => ({
                value: subemployee.id,
                label: subemployee.name,
              }))}
              value={selectedEmployees}
              onChange={(selectedOptions) => handleInputChange(selectedOptions || [])}
              className="border-2 border-gray-200 rounded-md px-3 py-1 w-full"
            />
          </div>


          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2">
            <div className="mb-1">
              <label htmlFor="startDate" className="block font-semibold text-xs lg:text-sm">
                Start Date /सुरु दिनांक <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                // className="border-2 border-gray-200 rounded-md px-3 py-1 w-full"
                className="border-2 border-gray-200 rounded-md px-2 py-1 w-32 md:w-full" // Adjust the width for mobile and larger screens
                required
                min={new Date().toISOString().split('T')[0]} // Restrict past dates using the min attribute
              />
            </div>


            <div className="mb-2">
              <label htmlFor="startTime" className="block font-semibold text-xs lg:text-sm md:pl-7">
                Start Time / सुरू वेळ <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center md:pl-6">
                <select
                  name="startHour"
                  value={currentStartTime.split(':')[0]}
                  onChange={(e) => {
                    const newHour = e.target.value;
                    setCurrentStartTime(`${newHour}:${currentStartTime.split(':')[1]} ${currentStartTime.split(' ')[1]}`);
                  }}
                  className="border border-gray-200 rounded-md md:px-2 py-1.5 mr-1"
                  required
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i === 0 ? '12' : i.toString().padStart(2, '0')}>
                      {i === 0 ? '12' : i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span><strong>: </strong></span>
                <select
                  name="startMinute"
                  value={currentStartTime.split(':')[1].split(' ')[0]}
                  onChange={(e) => {
                    const newMinute = e.target.value;
                    setCurrentStartTime(`${currentStartTime.split(':')[0]}:${newMinute} ${currentStartTime.split(':')[1].split(' ')[1]}`);
                  }}
                  className="border border-gray-200 rounded-md md:px-2 py-1.5 mr-2"
                  required
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i.toString().padStart(2, '0')}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <select
                  name="startAmPm"
                  value={currentStartTime.split(' ')[1]}
                  onChange={(e) => {
                    const newAmPm = e.target.value;
                    setCurrentStartTime(`${currentStartTime.split(':')[0]}:${currentStartTime.split(':')[1].split(' ')[0]} ${newAmPm}`);
                  }}
                  className="border border-gray-200 rounded-md md:px-2 py-1.5"
                  required
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>


            <div className="mb-1">
              <label htmlFor="deadlineDate" className="block font-semibold text-xs lg:text-sm">
                DeadLine /अंतिम दिनांक <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="deadlineDate"
                name="deadlineDate"
                value={formData.deadlineDate}
                onChange={handleInputChange}
                className="border-2 border-gray-200 rounded-md px-2 py-1 w-32 md:w-full" // Adjust the width for mobile and larger screens
                required
                min={new Date().toISOString().split('T')[0]} // Restrict past dates using the min attribute

              />
            </div>




            <div className="mb-2">
              <label htmlFor="endTime" className="block font-semibold md:pl-7 text-xs lg:text-sm ">
                End Time / अंतिम वेळ <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center md:pl-6">
                <select
                  name="endHour"
                  value={currentEndTime.split(':')[0]}
                  onChange={(e) => {
                    const newHour = e.target.value;
                    setCurrentEndTime(`${newHour}:${currentEndTime.split(':')[1]} ${currentEndTime.split(' ')[1]}`);
                  }}
                  className="border border-gray-200 rounded-md md:px-2 py-1.5 mr-1"
                  required
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i === 0 ? '12' : i.toString().padStart(2, '0')}>
                      {i === 0 ? '12' : i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span><strong>:</strong></span>
                <select
                  name="endMinute"
                  value={currentEndTime.split(':')[1].split(' ')[0]}
                  onChange={(e) => {
                    const newMinute = e.target.value;
                    setCurrentEndTime(`${currentEndTime.split(':')[0]}:${newMinute} ${currentEndTime.split(':')[1].split(' ')[1]}`);
                  }}
                  className="border border-gray-200 rounded-md md:px-2 py-1.5 mr-2"
                  required
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i.toString().padStart(2, '0')}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <select
                  name="endAmPm"
                  value={currentEndTime.split(' ')[1]}
                  onChange={(e) => {
                    const newAmPm = e.target.value;
                    setCurrentEndTime(`${currentEndTime.split(':')[0]}:${currentEndTime.split(':')[1].split(' ')[0]} ${newAmPm}`);
                  }}
                  className="border border-gray-200 rounded-md md:px-2 py-1.5 mr-2"
                  required
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>


            <div className="mb-1" style={{ position: 'relative' }}>
              <label htmlFor="picture" className="block font-semibold text-xs lg:text-sm">
                Picture / फोटो
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="file"
                  id="picture"
                  name="picture"
                  onChange={handleFileChange}
                  className="border-2 border-gray-200 rounded-md px-2 py-1 w-32 md:w-full text-xs md:text-sm"
                  style={{ paddingRight: '2.5rem' }} // Adjust padding to accommodate the button
                />
                {formData.picture && (
                  <button
                    type="button"
                    onClick={handleRemovePicture}
                    className="absolute text-black font-bold py-1 px-1 md:px-2 rounded-md text-xs md:text-sm"
                    style={{ right: '0', top: '0', marginTop: '0.3rem', marginRight: '0.2rem' }}
                  >
                    {/* Remove */}
                    <FontAwesomeIcon icon={faXmark} />

                  </button>
                )}
              </div>
            </div>



            <div className="mb-1 md:pl-6" style={{ position: 'relative' }}>
              <label htmlFor="audio" className="block font-semibold text-xs lg:text-sm">
                Audio / ऑडिओ
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="file"
                  id="audio"
                  name="audio"
                  onChange={handleFileChange}
                  className="border-2 border-gray-200 rounded-md px-2 py-1 w-32 md:w-full text-xs md:text-sm"
                  style={{ paddingRight: '2.5rem' }} // Adjust padding to accommodate the button
                />
                {formData.audio && (
                  <button
                    type="button"
                    onClick={handleRemoveAudio}
                    className="absolute text-black font-bold py-1 px-2 rounded-md text-xs md:text-sm"
                    style={{ right: '0', top: '0', marginTop: '0.3rem', marginRight: '0.2rem' }}
                  >
                    {/* Remove */}
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="col-span-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Create Task
            </button>
          </form>

        </div>
      </div>
    </>
  );
};

export default TaskForm;
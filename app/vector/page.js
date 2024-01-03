// 'use client'
// import React, { useEffect, useState } from "react";
// import { Chart } from "chart.js";
// import axios from "axios";
// import NavSide from "../components/NavSide";
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faTasks, faSquareCheck, faHourglassHalf, faExclamationCircle, faCalendarPlus, faUpload } from '@fortawesome/free-solid-svg-icons';

// const labelStyles = [
//   {

//     label: "Total Employee Tasks",
//     icon: faTasks,
//     iconColor: "purple",
//     iconSize: "l",
//   },
//   {

//     label: "Completed Tasks",
//     icon: faSquareCheck,
//     iconColor: "green",
//     iconSize: "l",
//   },
//   {
//     label: "Pending Tasks",
//     icon: faHourglassHalf,
//     iconColor: "blue",
//     iconSize: "l",
//   },
//   {
//     label: "Overdue Tasks",
//     icon: faExclamationCircle,
//     iconColor: "red",
//     iconSize: "l",
//   },
//   {

//     label: "Today Added Tasks",
//     icon: faCalendarPlus,
//     iconColor: "orange",
//     iconSize: "l",
//   },
//   {

//     label: "Send Tasks",
//     icon: faUpload,
//     iconColor: "yellow",
//     iconSize: "l",
//   },
// ];

// const Vector = () => {
//   const [chartData, setChartData] = useState([]);
//   const [hasData, setHasData] = useState(false); // Track if data exists


//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const token = localStorage.getItem("authToken");
//         const response = await axios.get("http://localhost:5000/api/task/adminTaskCounts", {
//           headers: {
//             Authorization: token,
//           },
//         });

//         if (response.data) {
//           const taskCounts = response.data;
//           const chartData = [
//             taskCounts.totalEmployeeTasks,
//             taskCounts.completedTasks,
//             taskCounts.pendingTasks,
//             taskCounts.overdueTasks,
//             taskCounts.todayAddedTasks,
//             taskCounts.sendTasks,
//           ];

//           setChartData(chartData);
//           setHasData(chartData.some(data => data > 0)); // Check if any data exists
//         } else {
//           setHasData(false); // No data available
//         }
         
//       } catch (error) {
//         console.error("Error fetching data:", error);
//         setHasData(false); // Set hasData to false if an error occurs

//       }
//     };

//     fetchData();
//   }, []);

//   useEffect(() => {
//     if (hasData) {
//       let ctx = document.getElementById("myChart").getContext("2d");
//       let myChart = new Chart(ctx, {
//         type: "doughnut",
//         data: {
//           datasets: [
//             {
//               data: chartData,
//               borderColor: ["rgb(128, 0, 128)", "rgb(34, 139, 34)", "rgb(0, 71, 171)", "rgb(210, 4, 45)", "rgb(205, 127, 50)", "rgb(255, 215, 0)"],
//               backgroundColor: ["rgb(128, 0, 128)", "rgb(34, 139, 34)", "rgb(0, 71, 171)", "rgb(210, 4, 45)", "rgb(205, 127, 50)", "rgb(255, 215, 0)"],
//               borderWidth: 2,
//             },
//           ],
//         },
//         options: {
//           cutoutPercentage: 50,
//           tooltips: {
//             callbacks: {
//               label: function (tooltipItem, data) {
//                 const labelIndex = tooltipItem.index;
//                 const label = labelStyles[labelIndex].label;
//                 const value = data.datasets[0].data[labelIndex];
//                 return `${label}: ${value}`;
//               },
//             },
//           },
//         },
//       });
//     }
//   }, [chartData, hasData]);


//   return (
//     <>
//       <NavSide />
//       <div className="mt-20"></div>
//       <div className="w-full h-screen flex flex-col items-center">
//         <div className="desktop-box p-4 m-4 bg-white rounded-lg text-center text-2xl font-bold text-red-800">
//           <h1>Dashboard</h1>
//           <div className="w-full flex justify-center items-center mt-5">
//             {hasData ? (
//               <canvas id="myChart" className="cursor-pointer desktop-graph"></canvas>
//             ) : (
//               <div className="static-circle mr-40" style={{ width: '430px', height: '430px', borderRadius: '50%', backgroundColor: 'gray', position: 'relative' }}>
//                 <div className="donut-chart" style={{ position: 'absolute', width: '50%', height: '50%', borderRadius: '50%', background: 'radial-gradient(circle at center, lightgray 0%, white 0%)', top: '25%', left: '25%' }}></div>
//               </div>
//             )}
//           </div>


//           <div className="text-center text-sm desktop-labels pt-20 pl-3 text-md md:text-base">
//             {labelStyles.map((item, index) => (
//               <div
//                 key={index}
//                 className={`flex items-center justify-start mb-2 ${isMobileView() ? "mobile-label-box" : "desktop-label-box"
//                   }`}
//               >
//                 {isMobileView() && (
//                   <div
//                     className="label-box-mobile"
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       padding: "8px",
//                       borderRadius: "4px",
//                       boxShadow: "2px 2px 4px rgba(0, 0, 0, 0.2)",
//                       width: "100%",
//                     }}
//                   >
//                     <div style={{ color: item.iconColor }}>
//                       <FontAwesomeIcon icon={item.icon} size={item.iconSize} style={{ marginRight: "10px" }} />
//                     </div>
//                     <p style={{ color: item.color }}>{item.label}</p>
//                   </div>
//                 )}
//                 {!isMobileView() && (
//                   <div style={{ backgroundColor: item.color, width: "30px", height: "15px", marginRight: "20px" }}></div>
//                 )}
//                 {!isMobileView() && (
//                   <div style={{ color: item.iconColor }}>
//                     <FontAwesomeIcon icon={item.icon} size={item.iconSize} style={{ marginRight: "10px" }} />
//                   </div>
//                 )}
//                 {!isMobileView() && <p style={{ color: item.color }}>{item.label}</p>}
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//       <style>{`
//         @media (min-width: 768px) {
//           .desktop-graph {
//             width: 100%;
//             margin-right: 250px;
//           }
//           .desktop-box {
//             width: 65%;
//             position: absolute;
//             box-shadow: 0 3px 3px -3px gray, 0 -3px 3px -3px gray, -3px 0 3px -3px gray, 3px 0 3px -3px gray;
//             right: 6%;
//           }
//           .desktop-labels {
//             position: absolute;
//             top: 50%;
//             transform: translateY(-50%);
//             right: 70px;
//           }
//           .desktop-label-box {
//             display: flex;
//             align-items: center;
//           }
//         }

//         @media (max-width: 767px) {
//           .mobile-graph {
//             width: 90%;
//           }
//           .mobile-box {
//             width: 100%;
//             right: auto;
//           }
//           .mobile-labels {
//             text-align: center;
//           }
//           .mobile-label-box {
//             display: flex;
//             align-items: center;
//           }
//           .label-box-mobile {
//             margin-right: 10px;
//           }
//         }
//       `}</style>
//     </>
//   );
// };

// const isMobileView = () => {
//   return window.innerWidth <= 767;
// };

// export default Vector;


'use client';
import React, { useEffect, useState } from "react";
import { Chart } from "chart.js";
import axios from "axios";
import NavSide from "../components/NavSide";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTasks, faSquareCheck, faHourglassHalf, faExclamationCircle, faCalendarPlus, faUpload } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from "next/navigation";

// ... (previous imports)

const labelStyles = [
  {
    label: "Total Employee Tasks",
    icon: faTasks,
    iconColor: "purple",
    iconSize: "l",
  },
  {
    label: "Completed Tasks",
    icon: faSquareCheck,
    iconColor: "green",
    iconSize: "l",
  },
  {
    label: "Pending Tasks",
    icon: faHourglassHalf,
    iconColor: "blue",
    iconSize: "l",
  },
  {
    label: "Overdue Tasks",
    icon: faExclamationCircle,
    iconColor: "red",
    iconSize: "l",
  },
  {
    label: "Today Added Tasks",
    icon: faCalendarPlus,
    iconColor: "orange",
    iconSize: "l",
  },
  {
    label: "Send Tasks",
    icon: faUpload,
    iconColor: "yellow",
    iconSize: "l",
  },
];

const Vector = () => {
  const [chartData, setChartData] = useState([]);
  const [hasData, setHasData] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(null);

  const router = useRouter();

  const handleLabelClick = (label) => {
    setSelectedLabel(label);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get("http://localhost:5000/api/task/adminTaskCounts", {
          headers: {
            Authorization: token,
          },
        });

        if (response.data) {
          const taskCounts = response.data;
          const chartData = [
            taskCounts.totalEmployeeTasks,
            taskCounts.completedTasks,
            taskCounts.pendingTasks,
            taskCounts.overdueTasks,
            taskCounts.todayAddedTasks,
            taskCounts.sendTasks,
          ];

          setChartData(chartData);
          setHasData(chartData.some(data => data > 0));
        } else {
          setHasData(false);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        setHasData(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (hasData) {
      let ctx = document.getElementById("myChart").getContext("2d");
      let myChart = new Chart(ctx, {
        type: "doughnut",
        data: {
          datasets: [
            {
              data: chartData,
              borderColor: ["rgb(128, 0, 128)", "rgb(34, 139, 34)", "rgb(0, 71, 171)", "rgb(210, 4, 45)", "rgb(205, 127, 50)", "rgb(255, 215, 0)"],
              backgroundColor: ["rgb(128, 0, 128)", "rgb(34, 139, 34)", "rgb(0, 71, 171)", "rgb(210, 4, 45)", "rgb(205, 127, 50)", "rgb(255, 215, 0)"],
              borderWidth: 2,
            },
          ],
        },
        options: {
          cutoutPercentage: 50,
          tooltips: {
            callbacks: {
              label: function (tooltipItem, data) {
                const labelIndex = tooltipItem.index;
                const label = labelStyles[labelIndex].label;
                const value = data.datasets[0].data[labelIndex];
                return `${label}: ${value}`;
              },
            },
          },
        },
      });
    }
  }, [chartData, hasData]);

  const CompletedTasksList = () => {
    router.push('/completedTask');
  };

  const PendingTasksList = () => {
    router.push('/pending');
  };

  const OverdueTasksList = () => {
    router.push('/overdue');
  };

  const SendTasksList = () => {
    router.push('/sendTask');
  };

  const todayAddedTasks = () => {
    router.push('/todaysTask');
  };

  const isMobileView = () => {
    return window.innerWidth <= 767;
  };

  return (
    <>
      <NavSide />
      <div className="mt-20"></div>
      <div className="w-full h-screen flex flex-col items-center overflow-x-auto">
        <div className="desktop-box p-4 m-4 bg-white rounded-lg text-center text-2xl font-bold text-red-800 -mt-4 md:mt-5">
          <h1>Dashboard</h1>
          <div className="w-full flex justify-center items-center mt-5 pl-2 md:pr-60">
            <div className={`graph-container ${isMobileView() && !hasData ? 'hidden' : ''}`}>
              {hasData ? (
                <canvas id="myChart" className={`cursor-pointer ${isMobileView() ? 'mobile-chart' : 'desktop-graph'}`}></canvas>
              ) : (
                <div className="static-circle mr-5 mt-8" style={{ width: '380px', height: '380px', borderRadius: '50%', backgroundColor: '#A0A0A0', position: 'relative' }}>
                  <div className="donut-chart " style={{ position: 'absolute', width: '50%', height: '50%', borderRadius: '50%', top: '25%', left: '25%' }}></div>
                </div>
              )}
            </div>
          </div>
          {isMobileView() && !hasData && (
            <div className="static-circle mr-5" style={{ width: '250px', height: '250px', borderRadius: '50%', backgroundColor: '#A0A0A0', position: 'relative', top: '-30px', left: '50%', transform: 'translateX(-50%)', marginTop: '100px' }}>
               <div className="donut-chart " style={{ position: 'absolute', width: '50%', height: '50%', borderRadius: '50%', top: '25%', left: '25%',backgroundColor:'white' }}></div>
            </div>
            
          )}
          {/* Move labels section below the graph container in mobile view */}
          <div className={`text-center text-sm ${isMobileView() ? 'mobile-labels' : 'desktop-labels'} pt-12  ml-2 text-md md:text-base relative`}>
            {labelStyles.map((item, index) => (
              <div
                key={index}
                className={`flex items-center justify-start mb-2 ${isMobileView() ? "mobile-label-box" : "desktop-label-box"
                  }`}
                onClick={() => handleLabelClick(item.label)}
                style={{ cursor: "pointer" }}
              >
                {isMobileView() && (
                  <div
                    className="label-box-mobile"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "8px",
                      borderRadius: "4px",
                      boxShadow: "2px 2px 4px rgba(0, 0, 0, 0.2)",
                      width: "100%",
                      paddingTop:"10px"
                    }}
                  >
                    <div style={{ color: item.iconColor}}>
                      <FontAwesomeIcon icon={item.icon} size={item.iconSize} style={{ marginRight: "5px" }} />
                    </div>
                    <p style={{ color: item.color, marginLeft: "5px" }}>{item.label}</p>
                  </div>
                )}
                {!isMobileView() && (
                  <>
                    <div style={{ backgroundColor: item.color, width: "30px", height: "15px", marginRight: "20px" }}></div>
                    <div style={{ color: item.iconColor }}>
                      <FontAwesomeIcon icon={item.icon} size={item.iconSize} style={{ marginRight: "10px" }} />
                    </div>
                    <p style={{ color: item.color, marginLeft: "5px" }}>{item.label} &thinsp;</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        {selectedLabel && (
          <div className="list-container">
            {selectedLabel === "Completed Tasks" && <CompletedTasksList />}
            {selectedLabel === "Pending Tasks" && <PendingTasksList />}
            {selectedLabel === "Overdue Tasks" && <OverdueTasksList />}
            {selectedLabel === "Send Tasks" && <SendTasksList />}
            {selectedLabel === "Received Tasks" && <ReceivedTasksList />}
            {selectedLabel === "Received Tasks" && <todayAddedTasks />}
          </div>
        )}
      </div>
      <style>{`
  @media (min-width: 768px) {
    .desktop-graph {
      width: 768px;            
    }
    .desktop-box {
      width: 65%;
      height: 80%;
      position: absolute;
      box-shadow: 0 3px 3px -3px gray, 0 -3px 3px -3px gray, -3px 0 3px -3px gray, 3px 0 3px -3px gray;
      right: 6%;
    }
    .desktop-labels {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      right: 70px;
    }
    .desktop-label-box {
      display: flex;
      align-items: center;
    }
    .graph-container {
      position: relative;
    }
    .static-circle-container {
      position: relative;
      width: 100%;
      padding-bottom: 100%;
      overflow: hidden;
    }
    .static-circle {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-color: lightgray;  /* Update this line */
    }
    
    .donut-chart {
      position: absolute;
      width: 50%;
      height: 50%;
      border-radius: 50%;
      background: radial-gradient(circle at center, lightgray 0%, white 0%);
      top: 25%;
      left: 25%;
    }
  }

  @media (max-width: 767px) {
    .mobile-chart {
      width: 500px;
    }
    .desktop-box {
      width: 100%;
      right: auto;
    }
    .desktop-labels {
      text-align: center;
    }
    .mobile-label-box {
      display: flex;
      align-items: center;
    }
    .label-box-mobile {
      margin-right: 10px;
    }
    .graph-container.hidden {
      display: none;
    }
  }
`}</style>
    </>
  );
};

export default Vector;
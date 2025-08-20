"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Dynamically import the map components with no SSR
let VectorMap = null;
let inMill = null;

// Load map components dynamically
const loadMapComponents = async () => {
  try {
    const [vectorMapModule, inMillModule] = await Promise.all([
      import("@react-jvectormap/core"),
      import("@react-jvectormap/india")
    ]);
    
    VectorMap = vectorMapModule.VectorMap;
    inMill = inMillModule.inMill;
    
    return true;
  } catch (error) {
    console.error("Error loading map components:", error);
    return false;
  }
};

// pass your dynamic value here
const valueForGujarat = 8500000; // try 80, 150, 250 to see shades change
const maxValue = 8500000; // Maximum value for full color coverage

// Chart data

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      // text: 'Monthly Data Chart',
      font: {
        size: 16,
        weight: 'bold'
      }
    },
    tooltip: {
      callbacks: {
        // label: function(context) {
        //   return `${context.dataset.label}: ${context.parsed.y}`;
        // },
        title: function(context) {
          return ''; // Hide the title line
        },
        afterBody: function(context) {
          const currentIndex = context[0].dataIndex;
          const currentValue = context[0].parsed.y;
          const previousValue = context[0].dataset.data[currentIndex - 1];
          
          if (previousValue !== undefined && previousValue !== 0) {
            const change = ((currentValue - previousValue) / previousValue) * 100;
            const changeText = change >= 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`;
            const changeType = change >= 0 ? 'Increased' : 'Decreased';
            const icon = change >= 0 ? '📈' : '📉';
            return `${icon} ${changeType} by ${changeText} from previous 3 months`;
          } else {
            return '📊 First data point';
          }
        }
      },
      bodySpacing: 10,
      titleSpacing: 10
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Values'
      }
    },
    x: {
      title: {
        display: true,
        // text: 'Months'
      }
    }
  },
  // Control bar width
  barThickness: 60, // Fixed width in pixels
  // Alternative: use barPercentage for relative width
  // barPercentage: 0.6, // 60% of available space
};

// Calculate coverage percentage
const getCoveragePercentage = (value) => {
  return Math.min((value / maxValue) * 100, 100);
};

// Calculate color intensity based on value ratio
const getColorIntensity = (value) => {
  const ratio = value / maxValue;
  if (ratio >= 1) return "#08306b"; // Full coverage - dark blue
  if (ratio >= 0.8) return "#08519c"; // Very high - very dark blue
  if (ratio >= 0.7) return "#08306b"; // Very high - dark blue
  if (ratio >= 0.6) return "#2171b5"; // High - dark blue
  if (ratio >= 0.5) return "#4292c6"; // High - medium blue
  if (ratio >= 0.4) return "#6baed6"; // Medium-high - light blue
  if (ratio >= 0.3) return "#6baed6"; // Medium - light blue
  if (ratio >= 0.2) return "#9ecae1"; // Medium-low - lighter blue
  if (ratio >= 0.1) return "#c6dbef"; // Low - very light blue
  return "#c6dbef"; // Very low - lightest blue
};

// Function to fetch data from Google Sheets

// Client-side only wrapper for the map
const ClientOnlyMap = ({ children }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <div>Loading map...</div>;
  }

  return children;
};

export default function Hospital() {
  const mapRef = useRef(null);
  const [valueForGujarat, setValueForGujarat] = useState(null);
  const [mapComponentsLoaded, setMapComponentsLoaded] = useState(false);
  const coveragePercentage = getCoveragePercentage(valueForGujarat);
  const colorIntensity = getColorIntensity(valueForGujarat);
  const [chartData, setChartData] = useState(null);
  console.log("🚀 ~ Hospital ~ chartData:", chartData)

  const chartData1 = {
    labels: chartData?.data?.slice(5, 16).map(item => item.Formula),
    datasets: [
      {
        label: 'Data',
        // label: chartData?.data?.slice(5, 15).map(item => item.Formula),
        data: chartData?.data?.slice(5, 16).map(item => parseFloat(item.Value) || 0),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(199, 199, 199, 0.8)',
          'rgba(83, 102, 255, 0.8)',
          'rgba(78, 252, 3, 0.8)',
          'rgba(252, 3, 244, 0.8)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 102, 255, 1)',
          'rgba(78, 252, 3, 1)',
          'rgba(252, 3, 244, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  
  const fetchGoogleSheetsData = async () => {
    try {
      // Replace with your actual spreadsheet ID and sheet name
      const spreadsheetId = "1uswPQnZocRGSVE-Gd08GIbWzxflTwnrg6ybOT3BGQlw";
      const sheetName = "Sheet1";

      const response = await fetch(
        `/api/google-sheets?spreadsheetId=${spreadsheetId}&sheetName=${sheetName}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Google Sheets Data:", data);

      // Extract and log the "Add on total" value
      const addOnTotalRow = data.data.find(
        (row) => row.Category === "Final Total" && row.Formula === ""
      );
      if (addOnTotalRow) {
        console.log("Add on total value:", addOnTotalRow.Value);
        setValueForGujarat(addOnTotalRow.Value);
      }

      setChartData(data);
      return data;
    } catch (error) {
      console.error("Error fetching Google Sheets data:", error);
    }
  };

  useEffect(() => {
    // Fetch Google Sheets data when component mounts
    fetchGoogleSheetsData();
  }, []);

  useEffect(() => {
    // Check if both map components are loaded
    const checkMapComponents = async () => {
      try {
        // Load the map components
        const success = await loadMapComponents();
        if (success) {
          // Add a small delay to ensure components are fully initialized
          setTimeout(() => {
            setMapComponentsLoaded(true);
          }, 100);
        }
      } catch (error) {
        console.error("Error loading map components:", error);
      }
    };

    // Load map components when component mounts
    checkMapComponents();
  }, []);

  useEffect(() => {
    // Wait for map to render, then apply radial coverage
    const timer = setTimeout(() => {
      if (mapRef.current) {
        const mapContainer = mapRef.current;
        const gujaratPath = mapContainer.querySelector('[data-code="IN-GJ"]');
        if (gujaratPath) {
          // For 100% coverage, use solid fill instead of gradient
          if (coveragePercentage >= 99.9) {
            gujaratPath.style.fill = colorIntensity;
            gujaratPath.style.fillOpacity = "0.8";
          } else {
            // Create SVG overlay for radial coverage
            const svg = mapContainer.querySelector("svg");
            if (svg) {
              // Add radial gradient definition
              const defs =
                svg.querySelector("defs") ||
                document.createElementNS("http://www.w3.org/2000/svg", "defs");
              if (!svg.querySelector("defs")) {
                svg.appendChild(defs);
              }

              // Create radial gradient
              const radialGradient = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "radialGradient"
              );
              radialGradient.setAttribute("id", "gujaratCoverage");
              radialGradient.setAttribute("cx", "80%");
              radialGradient.setAttribute("cy", "70%");
              radialGradient.setAttribute("r", "90%");

              const stop1 = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "stop"
              );
              stop1.setAttribute("offset", "0%");
              stop1.setAttribute("stop-color", colorIntensity);
              stop1.setAttribute("stop-opacity", "0.8");

              const stop2 = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "stop"
              );
              stop2.setAttribute("offset", `${coveragePercentage}%`);
              stop2.setAttribute("stop-color", colorIntensity);
              stop2.setAttribute("stop-opacity", "0.8");

              const stop3 = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "stop"
              );
              stop3.setAttribute("offset", `${coveragePercentage}%`);
              stop3.setAttribute("stop-color", colorIntensity);
              stop3.setAttribute("stop-opacity", "0");

              const stop4 = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "stop"
              );
              stop4.setAttribute("offset", "100%");
              stop4.setAttribute("stop-color", "transparent");
              stop4.setAttribute("stop-opacity", "0");

              radialGradient.appendChild(stop1);
              radialGradient.appendChild(stop2);
              radialGradient.appendChild(stop3);
              radialGradient.appendChild(stop4);
              defs.appendChild(radialGradient);

              // Apply the gradient to Gujarat
              gujaratPath.style.fill = `url(#gujaratCoverage)`;
            }
          }
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [coveragePercentage, colorIntensity]);

  return (
    <div
     
    >
      {/* <h1
        style={{
          textAlign: "center",
          marginBottom: "20px",
          color: "#333",
          fontSize: "2rem",
        }}
      >
        {valueForGujarat.toLocaleString()} Patient
      </h1> */}
      {valueForGujarat && mapComponentsLoaded ? (
        <>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px",
          // backgroundColor: "#f8f9fa",
          width: "100%",
          maxWidth: "600px",
          margin: "0 auto"
        }}
        >
          {/* Chart Section */}
          
          {/* Map Section */}
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <div style={{ marginBottom: "15px" }}>
              <span
                style={{ fontSize: "16px", color: "#333", fontWeight: "bold" }}
              >
                Coverage: {coveragePercentage.toFixed(2)}%
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: colorIntensity,
                  border: "2px solid #000",
                  marginRight: "10px",
                }}
              />
              <span style={{ fontSize: "16px", color: "#333" }}>
                Gujarat: {valueForGujarat.toLocaleString()} /{" "}
                {maxValue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Map Container */}
          <div
            style={{
              border: "2px solid #ddd",
              borderRadius: "8px",
              backgroundColor: "white",
              padding: "20px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ width: "600px", height: "600px" }} ref={mapRef}>
              <style>
                {`
                  .jvectormap-container svg path {
                    stroke: #000000 !important;
                    stroke-width: 1px !important;
                    stroke-opacity: 1 !important;
                  }
                `}
              </style>
              <ClientOnlyMap>
                {VectorMap && inMill ? (
                  <VectorMap
                    map={inMill}
                    backgroundColor="transparent"
                    regionStyle={{
                      initial: {
                        fill: "transparent",
                        fillOpacity: 1,
                        stroke: "#000000",
                        strokeWidth: 3,
                        strokeOpacity: 1,
                      },
                      hover: {
                        fill: "transparent",
                        fillOpacity: 1,
                      },
                    }}
                    // Custom rendering for Gujarat with radial coverage
                    onRegionTipShow={(_, label, code) => {
                      if (code === "IN-GJ") {
                        (label).html(
                          `Gujarat: ${valueForGujarat.toLocaleString()} (${coveragePercentage.toFixed(
                            2
                          )}% coverage)`
                        );
                      } else {
                        const currentHtml = (label).html();
                        (label).html(currentHtml.split("</br>")[0]);
                      }
                    }}
                  />
                ) : (
                  <div>Loading map components...</div>
                )}
              </ClientOnlyMap>
            </div>
          </div>
        </div>
        <div>
        
          <div style={{ 
            marginTop: "20px", 
            padding: "20px",
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            border: "2px solid #ddd",
            width: "90%",
            // maxWidth: "600px",
            margin: "0 auto"
          }}>
            <h2 style={{ 
              textAlign: "center", 
              marginBottom: "20px", 
              color: "#333",
              fontSize: "1.5rem"
            }}>
              3 Months Data Visualization
            </h2>
            <div style={{ width: "90%",  margin: "0 auto" }}>
              <Bar data={chartData1} options={chartOptions} />
            </div>
          </div>
        </div>
        </>
      ) : (
        <div>
          <h1>
            {!valueForGujarat ? "Loading data..." : "Loading map components..."}
          </h1>
        </div>
      )}
    </div>
  );
}

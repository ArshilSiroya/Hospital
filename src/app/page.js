"use client";
import React, { useEffect, useRef, useState } from "react";

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
        (row) => row.Category === "" && row.Formula === "Add on total"
      );
      if (addOnTotalRow) {
        console.log("Add on total value:", addOnTotalRow.Value);
        setValueForGujarat(addOnTotalRow.Value);
      }

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
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
        backgroundColor: "#f8f9fa",
      }}
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
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <div style={{ marginBottom: "15px" }}>
              <span
                style={{ fontSize: "16px", color: "#333", fontWeight: "bold" }}
              >
                Coverage: {coveragePercentage.toFixed(2)}%
              </span>
            </div>

            {/* Visual coverage indicator */}
            {/* <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  width: "200px",
                  height: "200px",
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${colorIntensity} 0%, ${colorIntensity} ${coveragePercentage}%, transparent ${coveragePercentage}%, transparent 100%)`,
                  border: "3px solid #000",
                  margin: "0 auto",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#333",
                  }}
                >
                  {coveragePercentage.toFixed(1)}%
                </div>
              </div>
            </div> */}

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

            {/* <div style={{ fontSize: "14px", color: "#666", marginTop: "15px" }}>
              <div>
                • <strong>10% coverage:</strong> Small dot in center
              </div>
              <div>
                • <strong>50% coverage:</strong> Color spreads from center to
                cover half of Gujarat
              </div>
              <div>
                • <strong>100% coverage:</strong> Full Gujarat is colored
              </div>
            </div> */}
          </div>
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

            {/* Legend with coverage visualization */}
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

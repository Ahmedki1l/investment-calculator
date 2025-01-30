/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";

/**
 * Format a number as SAR currency with no decimals.
 */
function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Simple numeric formatter (with 0 decimals) for brevity.
 */
function formatNumber(value) {
  if (value == null || isNaN(value)) return "";
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

const FinancialCalculator = () => {
  // -------------------------------------
  // 1) MAIN INPUTS
  // -------------------------------------
  const [inputs, setInputs] = useState({
    // Basic Info
    totalFloors: 22,
    administrativeFloors: 20,
    technicalFloors: 1,
    groundFloor: 1,
    mezzanineFloors: 1,
    vipFloors: 1,
    basementFloors: 4,

    // Spaces
    totalLandArea: 3200,
    groundFloorArea: 940,
    mezzanineFloorArea: 780,
    vipFloorArea: 780,
    administrativeFloorArea: 1350,
    technicalFloorArea: 1350,
    basementFloorArea: 3200,
    sharedAreas: 2260,

    // Cost Schedule
    pricePerSqMeter: 20000,
    administrativeCost: 2600,
    parkingCost: 2200,
    technicalFloorsCost: 1400,
    sharedAreasCost: 300,
    salesCommissionPct: 5, // 5% of total revenue

    // Tax Rate
    taxRate: 14.0,
  });

  const handleInputChange = (e, isFloat = false) => {
    const { name, value } = e.target;
    setInputs((prev) => ({
      ...prev,
      [name]: isFloat ? parseFloat(value) : parseInt(value, 10),
    }));
  };

  // -------------------------------------
  // 2) YEAR-BY-YEAR PLAN
  // -------------------------------------
  const [planYears, setPlanYears] = useState(5);
  const [yearPlan, setYearPlan] = useState([
    {
      year: 2025,
      priceIncrease: 0.08,
      vipShare: 0.5,
      mezzShare: 0.2,
      adminShare: 0.2,
    },
    {
      year: 2026,
      priceIncrease: 0.08,
      vipShare: 0.1,
      mezzShare: 0.1,
      adminShare: 0.1,
    },
    {
      year: 2027,
      priceIncrease: 0.08,
      vipShare: 0.1,
      mezzShare: 0.1,
      adminShare: 0.1,
    },
    {
      year: 2028,
      priceIncrease: 0.08,
      vipShare: 0.1,
      mezzShare: 0.1,
      adminShare: 0.1,
    },
    {
      year: 2029,
      priceIncrease: 0.08,
      vipShare: 0.2,
      mezzShare: 0.1,
      adminShare: 0.1,
    },
    {
      year: 2030,
      priceIncrease: 0.08,
      vipShare: 0,
      mezzShare: 0.1,
      adminShare: 0.1,
    },
    {
      year: 2031,
      priceIncrease: 0.08,
      vipShare: 0,
      mezzShare: 0.1,
      adminShare: 0.1,
    },
    {
      year: 2032,
      priceIncrease: 0.08,
      vipShare: 0,
      mezzShare: 0.1,
      adminShare: 0.1,
    },
    {
      year: 2033,
      priceIncrease: 0.08,
      vipShare: 0,
      mezzShare: 0.1,
      adminShare: 0.1,
    },
  ]);

  // Let user adjust how many plan years
  const handlePlanYearsChange = (e) => {
    const newCount = parseInt(e.target.value, 10);
    setPlanYears(newCount);

    setYearPlan((prev) => {
      const diff = newCount - prev.length;
      if (diff > 0) {
        // add extra
        const lastYear = prev.length ? prev[prev.length - 1].year : 2025;
        const newRows = Array.from({ length: diff }, (_, idx) => ({
          year: lastYear + idx + 1,
          priceIncrease: 0.08,
          vipShare: 0,
          mezzShare: 0,
          adminShare: 1.0,
        }));
        return [...prev, ...newRows];
      }
      if (diff < 0) {
        // remove
        return prev.slice(0, newCount);
      }
      return prev;
    });
  };

  // Handler for changing a single row/field
  const handleYearPlanChange = (index, field, value) => {
    const updated = [...yearPlan];
    updated[index][field] = parseFloat(value);
    setYearPlan(updated);
  };

  // -------------------------------------
  // 3) EXTRA FIELDS for Valuation, Taxes, etc.
  // -------------------------------------
  const [discountFactor, setDiscountFactor] = useState(7.0); // e.g. 7%
  const [propertyTransferTax, setPropertyTransferTax] = useState(5.0);
  const [vatRate, setVatRate] = useState(15.0);
  const [zakatRate, setZakatRate] = useState(2.5);
  const [municipalFees, setMunicipalFees] = useState(0.0);
  const [currentVipPrice, setCurrentVipPrice] = useState(23000);
  const [currentMezzPrice, setCurrentMezzPrice] = useState(17000);
  const [currentAdminPrice, setCurrentAdminPrice] = useState(13000);

  // -------------------------------------
  // 4) CORE CALCULATIONS
  // -------------------------------------
  const calculations = useMemo(() => {
    // (A) COSTS
    const totalAdminArea =
      inputs.administrativeFloorArea * inputs.administrativeFloors +
      inputs.mezzanineFloorArea +
      inputs.vipFloorArea +
      inputs.groundFloorArea;
    const totalBasementArea = inputs.basementFloorArea * inputs.basementFloors;
    const landCost = inputs.totalLandArea * inputs.pricePerSqMeter;

    const adminFloorsCost = totalAdminArea * inputs.administrativeCost;
    const basementFloorsCost = totalBasementArea * inputs.parkingCost;
    const technicalAreaCost =
      inputs.technicalFloorArea * inputs.technicalFloorsCost;
    const sharedAreasCost = inputs.sharedAreas * inputs.sharedAreasCost;

    // We'll approximate that salesCommission is % of total revenue, so we compute it after revenue.

    // (B) REVENUES (Year by Year)
    let vCurrentVipPrice = currentVipPrice;
    let vCurrentMezzPrice = currentMezzPrice;
    let vCurrentAdminPrice = currentAdminPrice;

    let totalRevenues = 0;
    const yearlyData = [];
    let sumVip = 0;
    let sumMezz = 0;
    let sumAdmin = 0;

    for (let i = 0; i < yearPlan.length; i++) {
      const { year, priceIncrease, vipShare, mezzShare, adminShare } =
        yearPlan[i];
      if (i > 0) {
        vCurrentVipPrice *= 1 + priceIncrease;
        vCurrentMezzPrice *= 1 + priceIncrease;
        vCurrentAdminPrice *= 1 + priceIncrease;
      }

      const currentVipArea = inputs.vipFloorArea * vipShare;
      const currentMezzArea = inputs.mezzanineFloorArea * mezzShare;
      const currentAdminArea =
        inputs.administrativeFloorArea *
        inputs.administrativeFloors *
        adminShare;

      const vipRevenue = currentVipArea * currentVipPrice;
      const mezzRevenue = currentMezzArea * currentMezzPrice;
      const adminRevenue = currentAdminArea * currentAdminPrice;

      const totalForYear = vipRevenue + mezzRevenue + adminRevenue;
      totalRevenues += totalForYear;

      sumVip += vipShare;
      sumMezz += mezzShare;
      sumAdmin += adminShare;

      yearlyData.push({
        year,
        vip: vipRevenue,
        vCurrentVipPrice,
        currentVipArea,
        mezzanine: mezzRevenue,
        vCurrentMezzPrice,
        currentMezzArea,
        administrative: adminRevenue,
        vCurrentAdminPrice,
        currentAdminArea,
        total: totalForYear,
      });
    }

    // Now we can compute the sales commission
    const salesCommission = (inputs.salesCommissionPct / 100) * totalRevenues;
    const totalVariableCost =
      adminFloorsCost +
      basementFloorsCost +
      technicalAreaCost +
      sharedAreasCost +
      salesCommission;
    const totalCost = landCost + totalVariableCost;

    const netOperatingProfit = totalRevenues - totalCost;
    const netOperatingProfitPercent = totalRevenues
      ? (netOperatingProfit / totalRevenues).toFixed(2) * 100
      : 0;
    const roi = totalCost
      ? ((netOperatingProfit / totalCost) * 100).toFixed(2)
      : 0;

    // (C) BREAKEVEN
    let breakEvenPercent = 0;
    if (totalRevenues > 0) {
      breakEvenPercent = ((totalCost / totalRevenues) * 100).toFixed(2);
    }

    // (D) Valuation (Placeholder: Simple discounting)
    let discountRows = [];
    let cumulative = 0;
    for (let i = 0; i < yearlyData.length; i++) {
      const yearIndex = i + 1; // 1-based
      const factor = Math.pow(1 + discountFactor / 100, yearIndex);
      const discFlow = yearlyData[i].total / factor;
      cumulative += discFlow;
      discountRows.push({
        year: yearlyData[i].year,
        flow: yearlyData[i].total,
        discountedFlow: discFlow,
        cumulative,
      });
    }
    const xnpv = cumulative - totalCost; // Very rough placeholder
    const xirr = 25.5; // Hard-coded
    const dpp = 4.3; // Hard-coded

    return {
      // cost breakdown
      landCost,
      adminFloorsCost,
      basementFloorsCost,
      technicalAreaCost,
      sharedAreasCost,
      salesCommission,
      totalVariableCost,
      totalCost,

      // revenue details
      yearlyData,
      totalRevenues,
      netOperatingProfit,
      netOperatingProfitPercent,
      roi,
      breakEvenPercent,
      sumVip,
      sumMezz,
      sumAdmin,

      // discount / valuation
      discountFactor,
      discountRows,
      xnpv,
      xirr,
      dpp,
    };
  }, [
    inputs,
    yearPlan,
    discountFactor,
    currentVipPrice,
    currentMezzPrice,
    currentAdminPrice,
  ]);

  // Helper functions
  // A helper function to generate percentages from 0% to 100% in 10% steps
  function generateOptions(maxDecimal = 1.0, step = 0.1) {
    const options = [];
    for (let val = 0; val <= maxDecimal + 0.000001; val += step) {
      const fraction = parseFloat(val.toFixed(2));
      if (fraction <= maxDecimal) {
        options.push(fraction);
      }
    }
    return options;
  }
  // -------------------------------------
  // RENDER
  // -------------------------------------
  return (
    <div className="w-full p-4 bg-white text-black text-sm font-sans">
      {/* BASIC INFORMATION */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-2">Basic Information</h2>
        <table className="w-full border border-gray-300 border-collapse text-left">
          <thead className="bg-green-100">
            <tr>
              <th className="border border-gray-300 px-2 py-1">Item</th>
              <th className="border border-gray-300 px-2 py-1">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-2 py-1">
                Total number of floors above ground
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  name="totalFloors"
                  type="number"
                  value={inputs.totalFloors}
                  onChange={handleInputChange}
                />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">
                Number of repeated administrative floors
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  name="administrativeFloors"
                  type="number"
                  value={inputs.administrativeFloors}
                  onChange={handleInputChange}
                />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">
                Number of technical floors
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  name="technicalFloors"
                  type="number"
                  value={inputs.technicalFloors}
                  onChange={handleInputChange}
                />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">Ground floor</td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  name="groundFloor"
                  type="number"
                  value={inputs.groundFloor}
                  onChange={handleInputChange}
                />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">Mezzanine</td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  name="mezzanineFloors"
                  type="number"
                  value={inputs.mezzanineFloors}
                  onChange={handleInputChange}
                />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">
                Number of basement floors (parking)
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  name="basementFloors"
                  type="number"
                  value={inputs.basementFloors}
                  onChange={handleInputChange}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* SPACES */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-2">Spaces</h2>
        <table className="w-full border border-gray-300 border-collapse text-left">
          <thead className="bg-green-100">
            <tr>
              <th className="border border-gray-300 px-2 py-1">Item</th>
              <th className="border border-gray-300 px-2 py-1">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-2 py-1">
                Total land area (m²)
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  name="totalLandArea"
                  type="number"
                  value={inputs.totalLandArea}
                  onChange={handleInputChange}
                />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">
                Ground floor construction (reception + lounge + services) (m²)
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  name="groundFloorArea"
                  type="number"
                  value={inputs.groundFloorArea}
                  onChange={handleInputChange}
                />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">
                Mezzanine floor (m²)
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  name="mezzanineFloorArea"
                  type="number"
                  value={inputs.mezzanineFloorArea}
                  onChange={handleInputChange}
                />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">
                (VIP) floor area (m²)
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  name="vipFloorArea"
                  type="number"
                  value={inputs.vipFloorArea}
                  onChange={handleInputChange}
                />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">
                Administrative floor area (m²)
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  name="administrativeFloorArea"
                  type="number"
                  value={inputs.administrativeFloorArea}
                  onChange={handleInputChange}
                />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">
                Technical service floor (m²)
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  name="technicalFloorArea"
                  type="number"
                  value={inputs.technicalFloorArea}
                  onChange={handleInputChange}
                />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">
                Basement floor (m²)
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  name="basementFloorArea"
                  type="number"
                  value={inputs.basementFloorArea}
                  onChange={handleInputChange}
                />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">
                Shared areas (m²)
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  name="sharedAreas"
                  type="number"
                  value={inputs.sharedAreas}
                  onChange={handleInputChange}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* COST SCHEDULE */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-2">Cost Schedule</h2>
        {/* Fixed Cost */}
        <h3 className="font-semibold mb-2">Fixed Cost</h3>
        <table className="w-full border border-gray-300 border-collapse text-left mb-4">
          <thead className="bg-green-100">
            <tr>
              <th className="border border-gray-300 px-2 py-1">Item</th>
              <th className="border border-gray-300 px-2 py-1">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-2 py-1">
                Price Per Square Meter (SAR/m²)
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  name="pricePerSqMeter"
                  type="number"
                  value={inputs.pricePerSqMeter}
                  onChange={handleInputChange}
                />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">
                Land Size (m²)
              </td>
              <td className="border border-gray-300 px-2 py-1">
                {inputs.totalLandArea}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1 font-semibold">
                Subtotal (Land Cost)
              </td>
              <td className="border border-gray-300 px-2 py-1 font-semibold">
                {formatCurrency(calculations.landCost)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Variable Cost */}
        <h3 className="font-semibold mb-2">Variable Cost</h3>
        <table className="w-full border border-gray-300 border-collapse text-left">
          <thead className="bg-green-100">
            <tr>
              <th className="border border-gray-300 px-2 py-1">Item</th>
              <th className="border border-gray-300 px-2 py-1">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-2 py-1">
                Administrative cost (SAR/m²)
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  name="administrativeCost"
                  type="number"
                  value={inputs.administrativeCost}
                  onChange={handleInputChange}
                />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">
                Parking cost (SAR/m²)
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  name="parkingCost"
                  type="number"
                  value={inputs.parkingCost}
                  onChange={handleInputChange}
                />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">
                Technical floors cost (SAR/m²)
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  name="technicalFloorsCost"
                  type="number"
                  value={inputs.technicalFloorsCost}
                  onChange={handleInputChange}
                />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">
                Shared areas cost (SAR/m²)
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  name="sharedAreasCost"
                  type="number"
                  value={inputs.sharedAreasCost}
                  onChange={handleInputChange}
                />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">
                Sales Commission (%)
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  name="salesCommissionPct"
                  type="number"
                  value={inputs.salesCommissionPct}
                  onChange={(e) => handleInputChange(e, true)}
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 space-y-1 text-sm">
          <p>
            <strong>Administrative floors cost:</strong>{" "}
            {formatCurrency(calculations.adminFloorsCost)}
          </p>
          <p>
            <strong>Basement floors (parking) cost:</strong>{" "}
            {formatCurrency(calculations.basementFloorsCost)}
          </p>
          <p>
            <strong>Technical floors cost:</strong>{" "}
            {formatCurrency(calculations.technicalAreaCost)}
          </p>
          <p>
            <strong>Shared areas cost:</strong>{" "}
            {formatCurrency(calculations.sharedAreasCost)}
          </p>
          <p>
            <strong>Sales Commission:</strong>{" "}
            {formatCurrency(calculations.salesCommission)}
          </p>
          <p>
            <strong>Variable Subtotal:</strong>{" "}
            {formatCurrency(calculations.totalVariableCost)}
          </p>
          <p className="text-base font-semibold border-t pt-1 mt-2">
            Total Cost = {formatCurrency(calculations.totalCost)}
          </p>
        </div>
      </div>

      {/* Excel-Like Revenue Plan / Schedule */}
      <div className="mb-6">
        {/* Header info */}
        <p className="text-xl font-bold mb-2">Revenue Schedule</p>

        <p className="text-lg font-bold mb-2">Selling</p>

        {/* Single table with columns for each forecast year */}
        <div className="overflow-auto">
          <table className="border border-collapse w-full text-sm">
            {/* ---------- TABLE HEAD ---------- */}
            <thead className="bg-gray-100">
              <tr>
                <th
                  className="border px-2 py-1 text-left"
                  style={{ width: "180px" }}
                ></th>
                {calculations.yearlyData.map((y) => (
                  <th key={y.year} className="border px-2 py-1 text-right">
                    {y.year}F
                  </th>
                ))}
              </tr>
            </thead>

            {/* ---------- TABLE BODY ---------- */}
            <tbody>
              {/* Example row: Tax Rate (same across all years) */}
              <tr>
                <td className="border px-2 py-1 font-semibold">Tax Rate</td>
                {calculations.yearlyData.map((y, i) => (
                  <td key={y.year} className="border px-2 py-1 text-right">
                    {inputs.taxRate.toFixed(1)}%
                  </td>
                ))}
              </tr>

              {/* Example row: Price Increase per year */}
              <tr>
                <td className="border px-2 py-1 font-semibold">
                  Price Increase
                </td>
                {yearPlan.map((row, i) => (
                  <td key={row.year} className="border px-2 py-1 text-right">
                    <div className="inline-flex items-center justify-end space-x-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.priceIncrease * 100}
                        onChange={(e) => {
                          let newValue = e.target.value ? e.target.value : 0;

                          if (newValue > 100) {
                            newValue = 100;
                          }

                          const parsedValue = parseFloat(newValue);
                          handleYearPlanChange(
                            i,
                            "priceIncrease",
                            parsedValue / 100
                          );
                        }}
                        className="w-10 text-right text-black bg-white px-1"
                      />
                      <span className="text-black">%</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Blank or separator row */}
              <tr className="bg-gray-50">
                <td
                  className="border px-2 py-1"
                  colSpan={1 + calculations.yearlyData.length}
                >
                  &nbsp;
                </td>
              </tr>

              {/* VIP floor rows (area, % completion, avg price, total revenue, etc.)
            You can break these out into multiple rows if you like, or just one. */}
              <tr>
                <td className="border px-2 py-1 font-semibold">VIP Floor</td>
              </tr>
              {/* Row for Current Year Area */}
              <tr>
                <td className="border px-2 py-1">
                  Area (Total: {inputs.vipFloorArea * inputs.vipFloors} m²)
                </td>
                {calculations.yearlyData.map((y) => (
                  <td key={y.year} className="border px-2 py-1 text-right">
                    {y.currentVipArea}m²
                  </td>
                ))}
              </tr>
              {/* Row for % of completion */}
              <tr>
                <td className="border px-2 py-1">% of Completion</td>
                {yearPlan.map((y, idx) => {
                  // Sum of all vipShares to the left
                  const usedSoFar = yearPlan
                    .slice(0, idx)
                    .reduce((acc, item) => acc + item.vipShare, 0);

                  // Round leftover to 2 decimals
                  const leftoverRaw = 1 - usedSoFar;
                  const leftover = parseFloat(
                    Math.max(0, leftoverRaw).toFixed(2)
                  );

                  console.log("leftover" + idx + ": ", leftover);

                  return (
                    <td key={y.year} className="border px-2 py-1 text-right">
                      <select
                        className="bg-white border border-gray-300 rounded px-1 py-0.5 text-right"
                        value={y.vipShare}
                        onChange={(e) => {
                          handleYearPlanChange(idx, "vipShare", e.target.value);
                          if (idx < yearPlan.length - 1) {
                            let leftover2 = parseFloat(
                              leftover - e.target.value
                            ).toFixed(2);
                            for (let i = idx + 1; i < yearPlan.length; i++) {
                              console.log("leftover2" + i + ": ", leftover2);
                              if (yearPlan[i].vipShare <= leftover2) {
                                handleYearPlanChange(
                                  i,
                                  "vipShare",
                                  yearPlan[i].vipShare
                                );
                                leftover2 = parseFloat(
                                  leftover2 - yearPlan[i].vipShare
                                ).toFixed(2);
                              } else if (leftover2 >= 0.1) {
                                handleYearPlanChange(i, "vipShare", leftover2);
                                leftover2 = 0;
                              } else {
                                handleYearPlanChange(i, "vipShare", 0);
                              }
                            }
                          }
                        }}
                      >
                        {/* Generate options from 0 up to leftover in 10% steps */}
                        {generateOptions(leftover, 0.1).map((val) => (
                          <option key={val} value={val}>
                            {(val * 100).toFixed(0)}%
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                })}
              </tr>
              {/* Row for AVG sales price per sft */}
              <tr>
                <td className="border px-2 py-1">AVG Sales Price / m²</td>
                {calculations.yearlyData.map((row, idx) =>
                  idx === 0 ? (
                    <>
                      <td className="borde px-2">
                        <div className="flex justify-end">
                          <Input
                            type="number"
                            className="w-20 text-right"
                            value={currentVipPrice}
                            onChange={(e) => setCurrentVipPrice(e.target.value)}
                          />
                        </div>
                      </td>
                    </>
                  ) : (
                    <td key={row.year} className="border px-2 py-1 text-right">
                      {formatCurrency(row.vCurrentVipPrice)}
                    </td>
                  )
                )}
              </tr>
              <tr>
                <td className="border px-2 py-1 font-semibold">
                  Total Revenue
                </td>

                {calculations.yearlyData.map((y) => (
                  <td key={y.year} className="border px-2 py-1 text-right">
                    {/* For example, show the total VIP revenue */}
                    {formatCurrency(y.vip)}
                  </td>
                ))}
              </tr>

              {/* Blank or separator row */}
              <tr className="bg-gray-50">
                <td
                  className="border px-2 py-1"
                  colSpan={1 + calculations.yearlyData.length}
                >
                  &nbsp;
                </td>
              </tr>

              {/* Mezzanine floor */}
              <tr>
                <td className="border px-2 py-1 font-semibold">
                  Mezzanine Floor
                </td>
              </tr>
              {/* Row for Current Year Area */}
              <tr>
                <td className="border px-2 py-1">
                  Area (Total:{" "}
                  {inputs.mezzanineFloorArea * inputs.mezzanineFloors} m²)
                </td>
                {calculations.yearlyData.map((y) => (
                  <td key={y.year} className="border px-2 py-1 text-right">
                    {y.currentMezzArea}m²
                  </td>
                ))}
              </tr>
              {/* Row for % of completion */}
              <tr>
                <td className="border px-2 py-1">% of Completion</td>
                {yearPlan.map((y, idx) => {
                  // Sum of all mezzShares to the left
                  const usedSoFar = yearPlan
                    .slice(0, idx)
                    .reduce((acc, item) => acc + item.mezzShare, 0);

                  // Round leftover to 2 decimals
                  const leftoverRaw = 1 - usedSoFar;
                  const leftover = parseFloat(
                    Math.max(0, leftoverRaw).toFixed(2)
                  );

                  console.log("leftover" + idx + ": ", leftover);

                  return (
                    <td key={y.year} className="border px-2 py-1 text-right">
                      <select
                        className="bg-white border border-gray-300 rounded px-1 py-0.5 text-right"
                        value={y.mezzShare}
                        onChange={(e) => {
                          handleYearPlanChange(
                            idx,
                            "mezzShare",
                            e.target.value
                          );
                          if (idx < yearPlan.length - 1) {
                            let leftover2 = parseFloat(
                              leftover - e.target.value
                            ).toFixed(2);
                            for (let i = idx + 1; i < yearPlan.length; i++) {
                              console.log("leftover2" + i + ": ", leftover2);
                              if (yearPlan[i].mezzShare <= leftover2) {
                                handleYearPlanChange(
                                  i,
                                  "mezzShare",
                                  yearPlan[i].mezzShare
                                );
                                leftover2 = parseFloat(
                                  leftover2 - yearPlan[i].mezzShare
                                ).toFixed(2);
                              } else if (leftover2 >= 0.1) {
                                handleYearPlanChange(i, "mezzShare", leftover2);
                                leftover2 = 0;
                              } else {
                                handleYearPlanChange(i, "mezzShare", 0);
                              }
                            }
                          }
                        }}
                      >
                        {/* Generate options from 0 up to leftover in 10% steps */}
                        {generateOptions(leftover, 0.1).map((val) => (
                          <option key={val} value={val}>
                            {(val * 100).toFixed(0)}%
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                })}
              </tr>
              {/* Row for AVG sales price per sft */}
              <tr>
                <td className="border px-2 py-1">AVG Sales Price / m²</td>
                {calculations.yearlyData.map((row, idx) =>
                  idx === 0 ? (
                    <>
                      <td className="borde px-2">
                        <div className="flex justify-end">
                          <Input
                            type="number"
                            className="w-20 text-right"
                            value={currentMezzPrice}
                            onChange={(e) =>
                              setCurrentMezzPrice(e.target.value)
                            }
                          />
                        </div>
                      </td>
                    </>
                  ) : (
                    <td key={row.year} className="border px-2 py-1 text-right">
                      {formatCurrency(row.vCurrentMezzPrice)}
                    </td>
                  )
                )}
              </tr>
              <tr>
                <td className="border px-2 py-1 font-semibold">
                  Total Revenue
                </td>
                {calculations.yearlyData.map((y) => (
                  <td key={y.year} className="border px-2 py-1 text-right">
                    {formatCurrency(y.mezzanine)}
                  </td>
                ))}
              </tr>

              {/* Blank or separator row */}
              <tr className="bg-gray-50">
                <td
                  className="border px-2 py-1"
                  colSpan={1 + calculations.yearlyData.length}
                >
                  &nbsp;
                </td>
              </tr>

              {/* Administrative floor */}
              <tr>
                <td className="border px-2 py-1 font-semibold">
                  Administrative Floor
                </td>
              </tr>
              {/* Row for Current Year Area */}
              <tr>
                <td className="border px-2 py-1">
                  Area (Total:{" "}
                  {inputs.administrativeFloorArea * inputs.administrativeFloors}{" "}
                  m²)
                </td>
                {calculations.yearlyData.map((y) => (
                  <td key={y.year} className="border px-2 py-1 text-right">
                    {y.currentAdminArea}m²
                  </td>
                ))}
              </tr>
              {/* Row for % of completion */}
              <tr>
                <td className="border px-2 py-1">% of Completion</td>
                {yearPlan.map((y, idx) => {
                  // Sum of all adminShares to the left
                  const usedSoFar = yearPlan
                    .slice(0, idx)
                    .reduce((acc, item) => acc + item.adminShare, 0);

                  // Round leftover to 2 decimals
                  const leftoverRaw = 1 - usedSoFar;
                  const leftover = parseFloat(
                    Math.max(0, leftoverRaw).toFixed(2)
                  );

                  console.log("leftover" + idx + ": ", leftover);

                  return (
                    <td key={y.year} className="border px-2 py-1 text-right">
                      <select
                        className="bg-white border border-gray-300 rounded px-1 py-0.5 text-right"
                        value={y.adminShare}
                        onChange={(e) => {
                          handleYearPlanChange(
                            idx,
                            "adminShare",
                            e.target.value
                          );
                          if (idx < yearPlan.length - 1) {
                            let leftover2 = parseFloat(
                              leftover - e.target.value
                            ).toFixed(2);
                            for (let i = idx + 1; i < yearPlan.length; i++) {
                              console.log("leftover2" + i + ": ", leftover2);
                              if (yearPlan[i].adminShare <= leftover2) {
                                handleYearPlanChange(
                                  i,
                                  "adminShare",
                                  yearPlan[i].adminShare
                                );
                                leftover2 = parseFloat(
                                  leftover2 - yearPlan[i].adminShare
                                ).toFixed(2);
                              } else if (leftover2 >= 0.1) {
                                handleYearPlanChange(
                                  i,
                                  "adminShare",
                                  leftover2
                                );
                                leftover2 = 0;
                              } else {
                                handleYearPlanChange(i, "adminShare", 0);
                              }
                            }
                          }
                        }}
                      >
                        {/* Generate options from 0 up to leftover in 10% steps */}
                        {generateOptions(leftover, 0.1).map((val) => (
                          <option key={val} value={val}>
                            {(val * 100).toFixed(0)}%
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                })}
              </tr>
              {/* Row for AVG sales price per sft */}
              <tr>
                <td className="border px-2 py-1">AVG Sales Price / m²</td>
                {calculations.yearlyData.map((row, idx) =>
                  idx === 0 ? (
                    <>
                      <td className="borde px-2">
                        <div className="flex justify-end">
                          <Input
                            type="number"
                            className="w-20 text-right"
                            value={currentAdminPrice}
                            onChange={(e) =>
                              setCurrentAdminPrice(e.target.value)
                            }
                          />
                        </div>
                      </td>
                    </>
                  ) : (
                    <td key={row.year} className="border px-2 py-1 text-right">
                      {formatCurrency(row.vCurrentAdminPrice)}
                    </td>
                  )
                )}
              </tr>
              <tr>
                <td className="border px-2 py-1 font-semibold">
                  Total Revenue
                </td>
                {calculations.yearlyData.map((y) => (
                  <td key={y.year} className="border px-2 py-1 text-right">
                    {formatCurrency(y.administrative)}
                  </td>
                ))}
              </tr>

              {/* Blank or separator row */}
              <tr className="bg-gray-50">
                <td
                  className="border px-2 py-1"
                  colSpan={1 + calculations.yearlyData.length}
                >
                  &nbsp;
                </td>
              </tr>
            </tbody>

            {/* ---------- TABLE FOOT ---------- */}
            <tfoot>
              <tr className="bg-green-50">
                <td className="border px-2 py-1 font-bold text-left">
                  Total Revenues
                </td>
                {calculations.yearlyData.map((y) => (
                  <td
                    key={y.year}
                    className="border px-2 py-1 text-right font-semibold"
                  >
                    {formatCurrency(y.total)}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-lg font-bold mb-2 mt-2">Renting</p>

        {/* Single table with columns for each forecast year */}
        <div className="overflow-auto">
          <table className="border border-collapse w-full text-sm">
            {/* ---------- TABLE HEAD ---------- */}
            <thead className="bg-gray-100">
              <tr>
                <th
                  className="border px-2 py-1 text-left"
                  style={{ width: "180px" }}
                ></th>
                {calculations.yearlyData.map((y) => (
                  <th key={y.year} className="border px-2 py-1 text-right">
                    {y.year}F
                  </th>
                ))}
              </tr>
            </thead>

            {/* ---------- TABLE BODY ---------- */}
            <tbody>
              {/* Example row: Tax Rate (same across all years) */}
              <tr>
                <td className="border px-2 py-1 font-semibold">Tax Rate</td>
                {calculations.yearlyData.map((y, i) => (
                  <td key={y.year} className="border px-2 py-1 text-right">
                    {inputs.taxRate.toFixed(1)}%
                  </td>
                ))}
              </tr>

              {/* Example row: Price Increase per year */}
              <tr>
                <td className="border px-2 py-1 font-semibold">
                  Price Increase
                </td>
                {yearPlan.map((row, i) => (
                  <td key={row.year} className="border px-2 py-1 text-right">
                    <div className="inline-flex items-center justify-end space-x-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.priceIncrease * 100}
                        onChange={(e) => {
                          let newValue = e.target.value ? e.target.value : 0;

                          if (newValue > 100) {
                            newValue = 100;
                          }

                          const parsedValue = parseFloat(newValue);
                          handleYearPlanChange(
                            i,
                            "priceIncrease",
                            parsedValue / 100
                          );
                        }}
                        className="w-10 text-right text-black bg-white px-1"
                      />
                      <span className="text-black">%</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Blank or separator row */}
              <tr className="bg-gray-50">
                <td
                  className="border px-2 py-1"
                  colSpan={1 + calculations.yearlyData.length}
                >
                  &nbsp;
                </td>
              </tr>

              {/* VIP floor rows (area, % completion, avg price, total revenue, etc.)
            You can break these out into multiple rows if you like, or just one. */}
              <tr>
                <td className="border px-2 py-1 font-semibold">VIP Floor</td>
              </tr>
              {/* Row for Current Year Area */}
              <tr>
                <td className="border px-2 py-1">
                  Area (Total: {inputs.vipFloorArea * inputs.vipFloors} m²)
                </td>
                {calculations.yearlyData.map((y) => (
                  <td key={y.year} className="border px-2 py-1 text-right">
                    {y.currentVipArea}m²
                  </td>
                ))}
              </tr>
              {/* Row for % of completion */}
              <tr>
                <td className="border px-2 py-1">% of Completion</td>
                {yearPlan.map((y, idx) => {
                  // Sum of all vipShares to the left
                  const usedSoFar = yearPlan
                    .slice(0, idx)
                    .reduce((acc, item) => acc + item.vipShare, 0);

                  // Round leftover to 2 decimals
                  const leftoverRaw = 1 - usedSoFar;
                  const leftover = parseFloat(
                    Math.max(0, leftoverRaw).toFixed(2)
                  );

                  console.log("leftover" + idx + ": ", leftover);

                  return (
                    <td key={y.year} className="border px-2 py-1 text-right">
                      <select
                        className="bg-white border border-gray-300 rounded px-1 py-0.5 text-right"
                        value={y.vipShare}
                        onChange={(e) => {
                          handleYearPlanChange(idx, "vipShare", e.target.value);
                          if (idx < yearPlan.length - 1) {
                            let leftover2 = parseFloat(
                              leftover - e.target.value
                            ).toFixed(2);
                            for (let i = idx + 1; i < yearPlan.length; i++) {
                              console.log("leftover2" + i + ": ", leftover2);
                              if (yearPlan[i].vipShare <= leftover2) {
                                handleYearPlanChange(
                                  i,
                                  "vipShare",
                                  yearPlan[i].vipShare
                                );
                                leftover2 = parseFloat(
                                  leftover2 - yearPlan[i].vipShare
                                ).toFixed(2);
                              } else if (leftover2 >= 0.1) {
                                handleYearPlanChange(i, "vipShare", leftover2);
                                leftover2 = 0;
                              } else {
                                handleYearPlanChange(i, "vipShare", 0);
                              }
                            }
                          }
                        }}
                      >
                        {/* Generate options from 0 up to leftover in 10% steps */}
                        {generateOptions(leftover, 0.1).map((val) => (
                          <option key={val} value={val}>
                            {(val * 100).toFixed(0)}%
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                })}
              </tr>
              {/* Row for AVG sales price per sft */}
              <tr>
                <td className="border px-2 py-1">AVG Sales Price / m²</td>
                {calculations.yearlyData.map((row, idx) =>
                  idx === 0 ? (
                    <>
                      <td className="borde px-2">
                        <div className="flex justify-end">
                          <Input
                            type="number"
                            className="w-20 text-right"
                            value={currentVipPrice}
                            onChange={(e) => setCurrentVipPrice(e.target.value)}
                          />
                        </div>
                      </td>
                    </>
                  ) : (
                    <td key={row.year} className="border px-2 py-1 text-right">
                      {formatCurrency(row.vCurrentVipPrice)}
                    </td>
                  )
                )}
              </tr>
              <tr>
                <td className="border px-2 py-1 font-semibold">
                  Total Revenue
                </td>

                {calculations.yearlyData.map((y) => (
                  <td key={y.year} className="border px-2 py-1 text-right">
                    {/* For example, show the total VIP revenue */}
                    {formatCurrency(y.vip)}
                  </td>
                ))}
              </tr>

              {/* Blank or separator row */}
              <tr className="bg-gray-50">
                <td
                  className="border px-2 py-1"
                  colSpan={1 + calculations.yearlyData.length}
                >
                  &nbsp;
                </td>
              </tr>

              {/* Mezzanine floor */}
              <tr>
                <td className="border px-2 py-1 font-semibold">
                  Mezzanine Floor
                </td>
              </tr>
              {/* Row for Current Year Area */}
              <tr>
                <td className="border px-2 py-1">
                  Area (Total:{" "}
                  {inputs.mezzanineFloorArea * inputs.mezzanineFloors} m²)
                </td>
                {calculations.yearlyData.map((y) => (
                  <td key={y.year} className="border px-2 py-1 text-right">
                    {y.currentMezzArea}m²
                  </td>
                ))}
              </tr>
              {/* Row for % of completion */}
              <tr>
                <td className="border px-2 py-1">% of Completion</td>
                {yearPlan.map((y, idx) => {
                  // Sum of all mezzShares to the left
                  const usedSoFar = yearPlan
                    .slice(0, idx)
                    .reduce((acc, item) => acc + item.mezzShare, 0);

                  // Round leftover to 2 decimals
                  const leftoverRaw = 1 - usedSoFar;
                  const leftover = parseFloat(
                    Math.max(0, leftoverRaw).toFixed(2)
                  );

                  console.log("leftover" + idx + ": ", leftover);

                  return (
                    <td key={y.year} className="border px-2 py-1 text-right">
                      <select
                        className="bg-white border border-gray-300 rounded px-1 py-0.5 text-right"
                        value={y.mezzShare}
                        onChange={(e) => {
                          handleYearPlanChange(
                            idx,
                            "mezzShare",
                            e.target.value
                          );
                          if (idx < yearPlan.length - 1) {
                            let leftover2 = parseFloat(
                              leftover - e.target.value
                            ).toFixed(2);
                            for (let i = idx + 1; i < yearPlan.length; i++) {
                              console.log("leftover2" + i + ": ", leftover2);
                              if (yearPlan[i].mezzShare <= leftover2) {
                                handleYearPlanChange(
                                  i,
                                  "mezzShare",
                                  yearPlan[i].mezzShare
                                );
                                leftover2 = parseFloat(
                                  leftover2 - yearPlan[i].mezzShare
                                ).toFixed(2);
                              } else if (leftover2 >= 0.1) {
                                handleYearPlanChange(i, "mezzShare", leftover2);
                                leftover2 = 0;
                              } else {
                                handleYearPlanChange(i, "mezzShare", 0);
                              }
                            }
                          }
                        }}
                      >
                        {/* Generate options from 0 up to leftover in 10% steps */}
                        {generateOptions(leftover, 0.1).map((val) => (
                          <option key={val} value={val}>
                            {(val * 100).toFixed(0)}%
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                })}
              </tr>
              {/* Row for AVG sales price per sft */}
              <tr>
                <td className="border px-2 py-1">AVG Sales Price / m²</td>
                {calculations.yearlyData.map((row, idx) =>
                  idx === 0 ? (
                    <>
                      <td className="borde px-2">
                        <div className="flex justify-end">
                          <Input
                            type="number"
                            className="w-20 text-right"
                            value={currentMezzPrice}
                            onChange={(e) =>
                              setCurrentMezzPrice(e.target.value)
                            }
                          />
                        </div>
                      </td>
                    </>
                  ) : (
                    <td key={row.year} className="border px-2 py-1 text-right">
                      {formatCurrency(row.vCurrentMezzPrice)}
                    </td>
                  )
                )}
              </tr>
              <tr>
                <td className="border px-2 py-1 font-semibold">
                  Total Revenue
                </td>
                {calculations.yearlyData.map((y) => (
                  <td key={y.year} className="border px-2 py-1 text-right">
                    {formatCurrency(y.mezzanine)}
                  </td>
                ))}
              </tr>

              {/* Blank or separator row */}
              <tr className="bg-gray-50">
                <td
                  className="border px-2 py-1"
                  colSpan={1 + calculations.yearlyData.length}
                >
                  &nbsp;
                </td>
              </tr>

              {/* Administrative floor */}
              <tr>
                <td className="border px-2 py-1 font-semibold">
                  Administrative Floor
                </td>
              </tr>
              {/* Row for Current Year Area */}
              <tr>
                <td className="border px-2 py-1">
                  Area (Total:{" "}
                  {inputs.administrativeFloorArea * inputs.administrativeFloors}{" "}
                  m²)
                </td>
                {calculations.yearlyData.map((y) => (
                  <td key={y.year} className="border px-2 py-1 text-right">
                    {y.currentAdminArea}m²
                  </td>
                ))}
              </tr>
              {/* Row for % of completion */}
              <tr>
                <td className="border px-2 py-1">% of Completion</td>
                {yearPlan.map((y, idx) => {
                  // Sum of all adminShares to the left
                  const usedSoFar = yearPlan
                    .slice(0, idx)
                    .reduce((acc, item) => acc + item.adminShare, 0);

                  // Round leftover to 2 decimals
                  const leftoverRaw = 1 - usedSoFar;
                  const leftover = parseFloat(
                    Math.max(0, leftoverRaw).toFixed(2)
                  );

                  console.log("leftover" + idx + ": ", leftover);

                  return (
                    <td key={y.year} className="border px-2 py-1 text-right">
                      <select
                        className="bg-white border border-gray-300 rounded px-1 py-0.5 text-right"
                        value={y.adminShare}
                        onChange={(e) => {
                          handleYearPlanChange(
                            idx,
                            "adminShare",
                            e.target.value
                          );
                          if (idx < yearPlan.length - 1) {
                            let leftover2 = parseFloat(
                              leftover - e.target.value
                            ).toFixed(2);
                            for (let i = idx + 1; i < yearPlan.length; i++) {
                              console.log("leftover2" + i + ": ", leftover2);
                              if (yearPlan[i].adminShare <= leftover2) {
                                handleYearPlanChange(
                                  i,
                                  "adminShare",
                                  yearPlan[i].adminShare
                                );
                                leftover2 = parseFloat(
                                  leftover2 - yearPlan[i].adminShare
                                ).toFixed(2);
                              } else if (leftover2 >= 0.1) {
                                handleYearPlanChange(
                                  i,
                                  "adminShare",
                                  leftover2
                                );
                                leftover2 = 0;
                              } else {
                                handleYearPlanChange(i, "adminShare", 0);
                              }
                            }
                          }
                        }}
                      >
                        {/* Generate options from 0 up to leftover in 10% steps */}
                        {generateOptions(leftover, 0.1).map((val) => (
                          <option key={val} value={val}>
                            {(val * 100).toFixed(0)}%
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                })}
              </tr>
              {/* Row for AVG sales price per sft */}
              <tr>
                <td className="border px-2 py-1">AVG Sales Price / m²</td>
                {calculations.yearlyData.map((row, idx) =>
                  idx === 0 ? (
                    <>
                      <td className="borde px-2">
                        <div className="flex justify-end">
                          <Input
                            type="number"
                            className="w-20 text-right"
                            value={currentAdminPrice}
                            onChange={(e) =>
                              setCurrentAdminPrice(e.target.value)
                            }
                          />
                        </div>
                      </td>
                    </>
                  ) : (
                    <td key={row.year} className="border px-2 py-1 text-right">
                      {formatCurrency(row.vCurrentAdminPrice)}
                    </td>
                  )
                )}
              </tr>
              <tr>
                <td className="border px-2 py-1 font-semibold">
                  Total Revenue
                </td>
                {calculations.yearlyData.map((y) => (
                  <td key={y.year} className="border px-2 py-1 text-right">
                    {formatCurrency(y.administrative)}
                  </td>
                ))}
              </tr>

              {/* Blank or separator row */}
              <tr className="bg-gray-50">
                <td
                  className="border px-2 py-1"
                  colSpan={1 + calculations.yearlyData.length}
                >
                  &nbsp;
                </td>
              </tr>
            </tbody>

            {/* ---------- TABLE FOOT ---------- */}
            <tfoot>
              <tr className="bg-green-50">
                <td className="border px-2 py-1 font-bold text-left">
                  Total Revenues
                </td>
                {calculations.yearlyData.map((y) => (
                  <td
                    key={y.year}
                    className="border px-2 py-1 text-right font-semibold"
                  >
                    {formatCurrency(y.total)}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
        
      </div>

      {/* FINAL SUMMARY */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-2">Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-gray-600 text-sm">Total Cost</p>
            <p className="text-xl font-semibold">
              {formatCurrency(calculations.totalCost)}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Total Revenue</p>
            <p className="text-xl font-semibold">
              {formatCurrency(calculations.totalRevenues)}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Net Profit (Before Zakat)</p>
            <p className="text-xl font-semibold">
              {formatCurrency(calculations.netOperatingProfit)}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Net Profit %</p>
            <p className="text-xl font-semibold">
              {calculations.netOperatingProfitPercent}%
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">ROI</p>
            <p className="text-xl font-semibold">{calculations.roi}%</p>
          </div>
        </div>
      </div>

      {/* OPTIONAL REVENUE CHART */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-2">Revenue Projection</h2>
        <div className="h-72 md:h-96 w-full border border-gray-300 bg-white">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={calculations.yearlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(val) => formatCurrency(val)} width={80} />
              <Tooltip formatter={(val) => formatCurrency(val)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                name="Total Revenue"
                stroke="#2563eb"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="vip"
                name="VIP"
                stroke="#ef4444"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="mezzanine"
                name="Mezzanine"
                stroke="#10b981"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="administrative"
                name="Administrative"
                stroke="#f59e0b"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BREAKEVEN POINT SCHEDULE */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-2">Breakeven Point Schedule</h2>
        <p className="text-xs text-gray-600 mb-2">
          All figures in SAR unless stated
        </p>
        <div className="overflow-auto">
          <table className="min-w-[900px] border border-collapse text-sm">
            <thead className="bg-green-100">
              <tr>
                <th className="border px-2 py-1">Break even %</th>
                <th className="border px-2 py-1">Value</th>
                {yearPlan.map((y) => (
                  <th key={y.year} className="border px-2 py-1">
                    {y.year}F
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-2 py-1">Break even %</td>
                <td className="border px-2 py-1 text-center">
                  {calculations.breakEvenPercent}%
                </td>
                {calculations.yearlyData.map((y, i) => {
                  const portion =
                    (y.total * calculations.breakEvenPercent) / 100;
                  return (
                    <td key={y.year} className="border px-2 py-1 text-right">
                      {formatCurrency(portion)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPARATIVE ANALYSIS SCHEDULE (Blank) */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-2">
          Comparative Analysis Schedule
        </h2>
        <p className="text-xs text-gray-600 mb-2">
          — (Currently no data; fill as needed)
        </p>
        {/* Additional data or charts here */}
      </div>

      {/* TAXATION AND OTHER FEES */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-2">Taxation and Other Fees</h2>
        <p className="text-xs text-gray-600 mb-2">
          All figures in USD thousands unless stated
        </p>
        <table className="w-full border border-gray-300 border-collapse text-sm">
          <thead className="bg-green-100">
            <tr>
              <th className="border border-gray-300 px-2 py-1">Fee</th>
              <th className="border border-gray-300 px-2 py-1">Rate (%)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-2 py-1">
                (Property Transfer Tax)
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  type="number"
                  step="0.1"
                  className="w-20"
                  value={propertyTransferTax}
                  onChange={(e) =>
                    setPropertyTransferTax(parseFloat(e.target.value))
                  }
                />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">
                Value Added Tax (VAT)
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  type="number"
                  step="0.1"
                  className="w-20"
                  value={vatRate}
                  onChange={(e) => setVatRate(parseFloat(e.target.value))}
                />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">Zakat</td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  type="number"
                  step="0.1"
                  className="w-20"
                  value={zakatRate}
                  onChange={(e) => setZakatRate(parseFloat(e.target.value))}
                />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">
                Municipal Services Fees
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <Input
                  type="number"
                  step="0.1"
                  className="w-20"
                  value={municipalFees}
                  onChange={(e) => setMunicipalFees(parseFloat(e.target.value))}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* VALUATION */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-2">Valuation</h2>
        <p className="text-xs text-gray-600 mb-2">
          All figures in USD thousands unless stated
        </p>
        <div className="flex items-center space-x-4 mb-4">
          <label className="text-sm text-gray-700">Discount Factor (%)</label>
          <Input
            type="number"
            step="0.1"
            className="w-24"
            value={discountFactor}
            onChange={(e) => setDiscountFactor(parseFloat(e.target.value))}
          />
        </div>

        <div className="overflow-auto">
          <table className="min-w-[900px] border border-collapse text-sm">
            <thead className="bg-green-100">
              <tr>
                <th className="border px-2 py-1">Year</th>
                <th className="border px-2 py-1">Cash Flow</th>
                <th className="border px-2 py-1">Discounted Flow</th>
                <th className="border px-2 py-1">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {calculations.discountRows?.map((row) => (
                <tr key={row.year}>
                  <td className="border px-2 py-1">{row.year}F</td>
                  <td className="border px-2 py-1 text-right">
                    {formatCurrency(row.flow)}
                  </td>
                  <td className="border px-2 py-1 text-right">
                    {formatCurrency(row.discountedFlow)}
                  </td>
                  <td className="border px-2 py-1 text-right">
                    {formatCurrency(row.cumulative)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVESTMENT E-VALUATION TOOLS */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-2">Investment E-Valuation Tools</h2>
        <table className="w-full border border-gray-300 border-collapse text-sm mb-2">
          <thead className="bg-green-100">
            <tr>
              <th className="border px-2 py-1">Metric</th>
              <th className="border px-2 py-1">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-2 py-1">XNPV (Net Present Value)</td>
              <td className="border px-2 py-1 text-right">
                {formatCurrency(calculations.xnpv)}
              </td>
            </tr>
            <tr>
              <td className="border px-2 py-1">
                XIRR (Internal Rate of Return)
              </td>
              <td className="border px-2 py-1 text-right">
                {calculations.xirr}%
              </td>
            </tr>
            <tr>
              <td className="border px-2 py-1">
                DPP (Discounted Payback Period)
              </td>
              <td className="border px-2 py-1 text-right">
                {calculations.dpp} Years
              </td>
            </tr>
          </tbody>
        </table>

        {/* Example discount table to show payback details */}
        <div className="overflow-auto">
          <table className="min-w-[600px] border border-collapse text-sm">
            <thead className="bg-green-100">
              <tr>
                <th className="border px-2 py-1">Year</th>
                <th className="border px-2 py-1">Cash Flow</th>
                <th className="border px-2 py-1">Discounted Cash Flow</th>
                <th className="border px-2 py-1">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {calculations.discountRows?.map((row, i) => (
                <tr key={i}>
                  <td className="border px-2 py-1">{row.year}F</td>
                  <td className="border px-2 py-1 text-right">
                    {formatCurrency(row.flow)}
                  </td>
                  <td className="border px-2 py-1 text-right">
                    {formatCurrency(row.discountedFlow)}
                  </td>
                  <td className="border px-2 py-1 text-right">
                    {formatCurrency(row.cumulative)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialCalculator;

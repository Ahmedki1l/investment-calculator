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

import {Card, CardContent, CardHeader, CardTitle} from "../ui/card";
import {Input} from "../ui/input";

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

  // -------------------------------------
  // 4) CORE CALCULATIONS
  // -------------------------------------
  const calculations = useMemo(() => {
    // (A) COSTS
    const totalAdminArea =
      inputs.administrativeFloorArea * inputs.administrativeFloors + inputs.mezzanineFloorArea + inputs.vipFloorArea + inputs.groundFloorArea;
    const totalBasementArea = inputs.basementFloorArea * inputs.basementFloors;
    const landCost = inputs.totalLandArea * inputs.pricePerSqMeter;

    const adminFloorsCost = totalAdminArea * inputs.administrativeCost;
    const basementFloorsCost = totalBasementArea * inputs.parkingCost;
    const technicalAreaCost =
      inputs.technicalFloorArea * inputs.technicalFloorsCost;
    const sharedAreasCost = inputs.sharedAreas * inputs.sharedAreasCost;

    // We'll approximate that salesCommission is % of total revenue, so we compute it after revenue.

    // (B) REVENUES (Year by Year)
    let currentVipPrice = 23000;
    let currentMezzPrice = 17000;
    let currentAdminPrice = 13000;

    let totalRevenues = 0;
    const yearlyData = [];
    let sumVip = 0;
    let sumMezz = 0;
    let sumAdmin = 0;

    for (let i = 0; i < yearPlan.length; i++) {
      const { year, priceIncrease, vipShare, mezzShare, adminShare } =
        yearPlan[i];
      if (i > 0) {
        currentVipPrice *= 1 + priceIncrease;
        currentMezzPrice *= 1 + priceIncrease;
        currentAdminPrice *= 1 + priceIncrease;
      }

      const vipRevenue = inputs.vipFloorArea * currentVipPrice * vipShare;
      const mezzRevenue =
        inputs.mezzanineFloorArea * currentMezzPrice * mezzShare;
        console.log(mezzRevenue);
      const adminRevenue =
        inputs.administrativeFloorArea *
        inputs.administrativeFloors *
        currentAdminPrice *
        adminShare;

      const totalForYear = vipRevenue + mezzRevenue + adminRevenue;
      totalRevenues += totalForYear;

      sumVip += vipShare;
      sumMezz += mezzShare;
      sumAdmin += adminShare;

      yearlyData.push({
        year,
        vip: vipRevenue,
        mezzanine: mezzRevenue,
        administrative: adminRevenue,
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
      ? ((netOperatingProfit / totalRevenues)).toFixed(2) * 100
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
  }, [inputs, yearPlan, discountFactor]);

  // -------------------------------------
  // RENDER
  // -------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-sm text-gray-900">
      {/* =============================================== */}
      {/* BASIC INFORMATION */}
      {/* =============================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="pr-4 py-1">
                  Total number of floors above ground
                </td>
                <td>
                  <Input
                    name="totalFloors"
                    type="number"
                    value={inputs.totalFloors}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <td className="pr-4 py-1">
                  Number of repeated administrative floors
                </td>
                <td>
                  <Input
                    name="administrativeFloors"
                    type="number"
                    value={inputs.administrativeFloors}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <td className="pr-4 py-1">Number of technical floors</td>
                <td>
                  <Input
                    name="technicalFloors"
                    type="number"
                    value={inputs.technicalFloors}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <td className="pr-4 py-1">Ground floor</td>
                <td>
                  <Input
                    name="groundFloor"
                    type="number"
                    value={inputs.groundFloor}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <td className="pr-4 py-1">Mezzanine</td>
                <td>
                  <Input
                    name="mezzanineFloors"
                    type="number"
                    value={inputs.mezzanineFloors}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <td className="pr-4 py-1">
                  Number of basement floors (parking)
                </td>
                <td>
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
        </CardContent>
      </Card>

      {/* =============================================== */}
      {/* SPACES */}
      {/* =============================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Spaces</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="pr-4 py-1">Total land area (m²)</td>
                <td>
                  <Input
                    name="totalLandArea"
                    type="number"
                    value={inputs.totalLandArea}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <td className="pr-4 py-1">
                  Ground floor construction (reception + lounge + services) (m²)
                </td>
                <td>
                  <Input
                    name="groundFloorArea"
                    type="number"
                    value={inputs.groundFloorArea}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <td className="pr-4 py-1">Mezzanine floor (m²)</td>
                <td>
                  <Input
                    name="mezzanineFloorArea"
                    type="number"
                    value={inputs.mezzanineFloorArea}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <td className="pr-4 py-1">(VIP) floor area (m²)</td>
                <td>
                  <Input
                    name="vipFloorArea"
                    type="number"
                    value={inputs.vipFloorArea}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <td className="pr-4 py-1">Administrative floor area (m²)</td>
                <td>
                  <Input
                    name="administrativeFloorArea"
                    type="number"
                    value={inputs.administrativeFloorArea}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <td className="pr-4 py-1">Technical service floor (m²)</td>
                <td>
                  <Input
                    name="technicalFloorArea"
                    type="number"
                    value={inputs.technicalFloorArea}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <td className="pr-4 py-1">Basement floor (m²)</td>
                <td>
                  <Input
                    name="basementFloorArea"
                    type="number"
                    value={inputs.basementFloorArea}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <td className="pr-4 py-1">Shared areas (m²)</td>
                <td>
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
        </CardContent>
      </Card>

      {/* =============================================== */}
      {/* COST SCHEDULE */}
      {/* =============================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold mb-2">Fixed Cost</h3>
          <table className="w-full text-sm mb-6">
            <tbody>
              <tr>
                <td className="pr-4 py-1">Price Per Square Meter (SAR/m²)</td>
                <td>
                  <Input
                    name="pricePerSqMeter"
                    type="number"
                    value={inputs.pricePerSqMeter}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <td className="pr-4 py-1">Land Size (m²)</td>
                <td>{inputs.totalLandArea}</td>
              </tr>
              <tr>
                <td className="pr-4 py-1 font-semibold">
                  Subtotal (Land Cost)
                </td>
                <td className="font-semibold">
                  {formatCurrency(calculations.landCost)}
                </td>
              </tr>
            </tbody>
          </table>

          <h3 className="font-semibold mb-2">Variable Cost</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="pr-4 py-1">Administrative cost (SAR/m²)</td>
                <td>
                  <Input
                    name="administrativeCost"
                    type="number"
                    value={inputs.administrativeCost}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <td className="pr-4 py-1">Parking cost (SAR/m²)</td>
                <td>
                  <Input
                    name="parkingCost"
                    type="number"
                    value={inputs.parkingCost}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <td className="pr-4 py-1">Technical floors cost (SAR/m²)</td>
                <td>
                  <Input
                    name="technicalFloorsCost"
                    type="number"
                    value={inputs.technicalFloorsCost}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <td className="pr-4 py-1">Shared areas cost (SAR/m²)</td>
                <td>
                  <Input
                    name="sharedAreasCost"
                    type="number"
                    value={inputs.sharedAreasCost}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <td className="pr-4 py-1">Sales Commission (%)</td>
                <td>
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
        </CardContent>
      </Card>

      {/* =============================================== */}
      {/* REVENUE PLAN CONFIG */}
      {/* =============================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Plan Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <label className="text-sm text-gray-700 mr-2">
              Number of Plan Years:
            </label>
            <Input
              type="number"
              value={planYears}
              onChange={handlePlanYearsChange}
              className="w-24"
            />
          </div>
          <p className="text-xs mb-4 text-gray-600">
            For each year, enter <strong>priceIncrease</strong> (decimal for %),
            plus
            <strong> vipShare</strong>, <strong>mezzShare</strong>, and{" "}
            <strong>adminShare</strong> for how much of each type you plan to
            sell (0–1).
          </p>

          <div className="overflow-auto">
            <table className="min-w-[600px] border border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1 text-sm">Year</th>
                  <th className="border px-2 py-1 text-sm">
                    Price Increase (%)
                  </th>
                  <th className="border px-2 py-1 text-sm">VIP Share</th>
                  <th className="border px-2 py-1 text-sm">Mezz Share</th>
                  <th className="border px-2 py-1 text-sm">Admin Share</th>
                </tr>
              </thead>
              <tbody>
                {yearPlan.map((row, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">
                      <Input
                        type="number"
                        className="w-20"
                        value={row.year}
                        onChange={(e) =>
                          handleYearPlanChange(idx, "year", e.target.value)
                        }
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <Input
                        type="number"
                        step="0.01"
                        className="w-20"
                        value={row.priceIncrease}
                        onChange={(e) =>
                          handleYearPlanChange(
                            idx,
                            "priceIncrease",
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <Input
                        type="number"
                        step="0.01"
                        className="w-20"
                        value={row.vipShare}
                        onChange={(e) =>
                          handleYearPlanChange(idx, "vipShare", e.target.value)
                        }
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <Input
                        type="number"
                        step="0.01"
                        className="w-20"
                        value={row.mezzShare}
                        onChange={(e) =>
                          handleYearPlanChange(idx, "mezzShare", e.target.value)
                        }
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <Input
                        type="number"
                        step="0.01"
                        className="w-20"
                        value={row.adminShare}
                        onChange={(e) =>
                          handleYearPlanChange(
                            idx,
                            "adminShare",
                            e.target.value
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-sm text-red-600">
            {calculations.sumVip > 1 && (
              <p>
                VIP shares total {(calculations.sumVip * 100).toFixed(1)}%
                (exceeds 100%)
              </p>
            )}
            {calculations.sumMezz > 1 && (
              <p>
                Mezzanine shares total {(calculations.sumMezz * 100).toFixed(1)}
                % (exceeds 100%)
              </p>
            )}
            {calculations.sumAdmin > 1 && (
              <p>
                Administrative shares total{" "}
                {(calculations.sumAdmin * 100).toFixed(1)}% (exceeds 100%)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* =============================================== */}
      {/* REVENUE SCHEDULE TABLE */}
      {/* =============================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="min-w-[800px] border border-collapse text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1 text-left">Year</th>
                  <th className="border px-2 py-1 text-left">VIP</th>
                  <th className="border px-2 py-1 text-left">Mezzanine</th>
                  <th className="border px-2 py-1 text-left">Administrative</th>
                  <th className="border px-2 py-1 text-left">Total</th>
                </tr>
              </thead>
              <tbody>
                {calculations.yearlyData.map((row) => (
                  <tr key={row.year}>
                    <td className="border px-2 py-1">{row.year}F</td>
                    <td className="border px-2 py-1">
                      {formatCurrency(row.vip)}
                    </td>
                    <td className="border px-2 py-1">
                      {formatCurrency(row.mezzanine)}
                    </td>
                    <td className="border px-2 py-1">
                      {formatCurrency(row.administrative)}
                    </td>
                    <td className="border px-2 py-1 font-semibold">
                      {formatCurrency(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-base font-semibold">
            Total Revenues: {formatCurrency(calculations.totalRevenues)}
          </div>
        </CardContent>
      </Card>

      {/* =============================================== */}
      {/* FINAL SUMMARY */}
      {/* =============================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Cost</p>
              <p className="text-xl font-semibold mt-1">
                {formatCurrency(calculations.totalCost)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-xl font-semibold mt-1">
                {formatCurrency(calculations.totalRevenues)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Net Profit (Before Zakat)</p>
              <p className="text-xl font-semibold mt-1">
                {formatCurrency(calculations.netOperatingProfit)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Net Profit %</p>
              <p className="text-xl font-semibold mt-1">
                {calculations.netOperatingProfitPercent}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ROI</p>
              <p className="text-xl font-semibold mt-1">{calculations.roi}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* =============================================== */}
      {/* OPTIONAL REVENUE CHART */}
      {/* =============================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 md:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={calculations.yearlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis
                  tickFormatter={(val) => formatCurrency(val)}
                  width={80}
                />
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
        </CardContent>
      </Card>

      {/* =============================================== */}
      {/* BREAKEVEN POINT SCHEDULE */}
      {/* =============================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Breakeven Point Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-600 mb-2">
            All figures in SAR unless stated
          </p>
          <div className="overflow-auto">
            <table className="min-w-[900px] border border-collapse text-sm">
              <thead className="bg-gray-100">
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
                  {/* Just as an example, we show total cost in each column. In real usage,
              you'd show e.g. partial cost or net flows per year, etc. */}
                  {calculations.yearlyData.map((y, i) => {
                    // We'll pretend each year shares the cost proportionally
                    // just for demonstration. Adjust as needed.
                    // E.g. cost portion = totalCost * (i+1)*0.1 => placeholder
                    const portion = y.total * calculations.breakEvenPercent / 100;
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
        </CardContent>
      </Card>

      {/* =============================================== */}
      {/* COMPARATIVE ANALYSIS SCHEDULE (Blank) */}
      {/* =============================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Comparative Analysis Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-600 mb-2">
            — (Currently no data; fill as needed)
          </p>
          {/* Render additional comparative data or charts here */}
        </CardContent>
      </Card>

      {/* =============================================== */}
      {/* TAXATION AND OTHER FEES */}
      {/* =============================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Taxation and Other Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-600 mb-2">
            All figures in USD thousands unless stated
          </p>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td>(Property Transfer Tax) </td>
                <td>
                  <Input
                    type="number"
                    step="0.1"
                    className="w-20"
                    value={propertyTransferTax}
                    onChange={(e) =>
                      setPropertyTransferTax(parseFloat(e.target.value))
                    }
                  />
                  <span className="ml-1">%</span>
                </td>
              </tr>
              <tr>
                <td>Value Added Tax (VAT) </td>
                <td>
                  <Input
                    type="number"
                    step="0.1"
                    className="w-20"
                    value={vatRate}
                    onChange={(e) => setVatRate(parseFloat(e.target.value))}
                  />
                  <span className="ml-1">%</span>
                </td>
              </tr>
              <tr>
                <td>Zakat</td>
                <td>
                  <Input
                    type="number"
                    step="0.1"
                    className="w-20"
                    value={zakatRate}
                    onChange={(e) => setZakatRate(parseFloat(e.target.value))}
                  />
                  <span className="ml-1">%</span>
                </td>
              </tr>
              <tr>
                <td>Municipal Services Fees:</td>
                <td>
                  <Input
                    type="number"
                    step="0.1"
                    className="w-20"
                    value={municipalFees}
                    onChange={(e) =>
                      setMunicipalFees(parseFloat(e.target.value))
                    }
                  />
                  <span className="ml-1">%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* =============================================== */}
      {/* VALUATION */}
      {/* =============================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Valuation</CardTitle>
        </CardHeader>
        <CardContent>
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

          {/* Show discounted cash flow table (placeholder) */}
          <div className="overflow-auto">
            <table className="min-w-[900px] border border-collapse text-sm">
              <thead className="bg-gray-100">
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
        </CardContent>
      </Card>

      {/* =============================================== */}
      {/* INVESTMENT E-VALUATION TOOLS */}
      {/* =============================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Investment E-Valuation Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm mb-4">
            <tbody>
              <tr>
                <td>XNPV (Net Present Value)</td>
                <td className="font-semibold text-right">
                  {formatCurrency(calculations.xnpv)}
                </td>
              </tr>
              <tr>
                <td>XIRR (Internal Rate of Return)</td>
                <td className="font-semibold text-right">
                  {calculations.xirr}%
                </td>
              </tr>
              <tr>
                <td>DPP (Discounted Payback Period)</td>
                <td className="font-semibold text-right">
                  {calculations.dpp} Years
                </td>
              </tr>
            </tbody>
          </table>

          {/* Example: Summarize a discount table for payback */}
          <div className="overflow-auto">
            <table className="min-w-[600px] border border-collapse text-sm">
              <thead className="bg-gray-100">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialCalculator;

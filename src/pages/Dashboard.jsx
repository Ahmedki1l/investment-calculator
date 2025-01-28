// /* eslint-disable no-unused-vars */
// // src/pages/Dashboard.jsx
// import React, { useState } from 'react';
// import { Loader2 } from 'lucide-react';
// import InputForm from '../components/financial/InputForm';
// import { ExecutiveSummary, FinancialMetrics } from '../components/financial/FinancialMetrics';
// import { RevenueChart, ProjectOverview } from '../components/financial/RevenueChart';
// import DetailedDataTable from '../components/financial/DetailedDataTable';

// const Dashboard = () => {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [data, setData] = useState(null);

//   const calculateFinancials = async (formData) => {
//     setLoading(true);
//     setError(null);
    
//     try {
//       const response = await fetch(`${import.meta.env.VITE_API_URL}/financial/calculate`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'X-API-Key': import.meta.env.VITE_API_KEY
//         },
//         body: JSON.stringify(formData)
//       });

//       if (!response.ok) {
//         throw new Error('Failed to calculate financials');
//       }

//       const result = await response.json();
//       if (result.success) {
//         setData(result.data);
//       } else {
//         throw new Error(result.error || 'Failed to process data');
//       }
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <h1 className="text-3xl font-bold text-gray-900">Real Estate Financial Analysis</h1>
//           <p className="mt-2 text-gray-600">Comprehensive Investment Analysis Dashboard</p>
//         </div>

//         {/* Input Form */}
//         <div className="mb-8">
//           <InputForm onSubmit={calculateFinancials} disabled={loading} />
//         </div>

//         {/* Loading State */}
//         {loading && (
//           <div className="flex justify-center items-center p-8">
//             <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
//           </div>
//         )}

//         {/* Error State */}
//         {error && (
//           <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
//             <p className="text-red-800">{error}</p>
//           </div>
//         )}

//         {/* Results */}
//         {data && !loading && (
//           <div className="space-y-8">
//             {/* Executive Summary */}
//             <ExecutiveSummary data={data} />

//             {/* Overview Cards */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//               <ProjectOverview data={data} />
//               <FinancialMetrics data={data} />
//             </div>

//             {/* Revenue Chart */}
//             <RevenueChart data={data} />

//             {/* Detailed Data */}
//             <DetailedDataTable data={data} />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };


import FinancialCalculator from '../components/financial/FinancialCalculator';

const Dashboard = () => {
    return (
        <div className="w-full px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Real Estate Financial Analysis</h1>
      <FinancialCalculator />
    </div>
  );
};

export default Dashboard;
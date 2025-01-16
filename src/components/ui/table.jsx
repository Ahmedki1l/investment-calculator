/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
// src/components/ui/table.jsx

import React from "react";

const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className="w-full caption-bottom border-collapse text-sm"
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className="[&_tr]:border-b" {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className="[&_tr:last-child]:border-0" {...props} />
));
TableBody.displayName = "TableBody";

const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className="h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0"
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className="p-4 align-middle [&:has([role=checkbox])]:pr-0"
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr ref={ref} className="border-b even:bg-gray-50" {...props} />
));
TableRow.displayName = "TableRow";

export { Table, TableHeader, TableHead, TableBody, TableCell, TableRow };

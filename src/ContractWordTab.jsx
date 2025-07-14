import React from 'react';

export default function ContractWordTab() {
  return (
    <div className="min-h-screen bg-neutral-900 p-6">
      <div className="grid grid-cols-6 gap-4">
        {/* Left Column - Two Tall Boxes */}
        <div className="col-span-1 flex flex-col gap-4">
          <div className="bg-gray-300 rounded-xl h-64 w-full" id="box-tall-1" />
          <div className="bg-gray-300 rounded-xl h-64 w-full" id="box-tall-2" />
        </div>

        {/* Middle Column - Two Wide Boxes stacked */}
        <div className="col-span-2 flex flex-col gap-4">
          <div className="bg-gray-300 rounded-xl h-28 w-full" id="box-wide-top" />
          <div className="bg-gray-300 rounded-xl h-28 w-full" id="box-wide-bottom" />
        </div>

        {/* Right Columns - Four Small Boxes (2x2 Grid) */}
        <div className="col-span-3 grid grid-cols-2 gap-4">
          <div className="bg-gray-300 rounded-xl h-28 w-full" id="box-small-1" />
          <div className="bg-gray-300 rounded-xl h-28 w-full" id="box-small-2" />
          <div className="bg-gray-300 rounded-xl h-28 w-full" id="box-small-3" />
          <div className="bg-gray-300 rounded-xl h-28 w-full" id="box-small-4" />
        </div>
      </div>
    </div>
  );
}

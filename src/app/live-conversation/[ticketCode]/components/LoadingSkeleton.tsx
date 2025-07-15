"use client";

export default function LoadingSkeleton() {
  return (
    <div className="w-full h-full flex flex-col">
      {/* Header Skeleton */}
      <div className="bg-black bg-opacity-20 p-4 rounded-2xl mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-md text-logoWhite hover:bg-logoBlue hover:text-logoWhite transition-colors font-body text-body">
              ← Back
            </button>
            <div className="bg-darkWhite bg-opacity-50 rounded h-6 w-20 animate-pulse"></div>
            <div className="bg-darkWhite bg-opacity-50 rounded-full h-6 w-16 animate-pulse"></div>
          </div>
          <div className="bg-darkWhite bg-opacity-50 rounded h-10 w-24 animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="bg-darkWhite bg-opacity-50 rounded h-6 w-3/4 animate-pulse"></div>
          <div className="flex gap-6">
            <div className="bg-darkWhite bg-opacity-30 rounded h-4 w-24 animate-pulse"></div>
            <div className="bg-darkWhite bg-opacity-30 rounded h-4 w-32 animate-pulse"></div>
            <div className="bg-darkWhite bg-opacity-30 rounded h-4 w-28 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Comments Skeleton */}
      <div className="flex-1 overflow-auto rounded-2xl bg-black bg-opacity-10 p-4">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className="bg-white bg-opacity-5 backdrop-blur-sm rounded-2xl p-4 border border-gray-600"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-darkWhite bg-opacity-50 rounded-full animate-pulse"></div>
                  <div>
                    <div className="bg-darkWhite bg-opacity-50 rounded h-4 w-24 mb-1 animate-pulse"></div>
                    <div className="bg-darkWhite bg-opacity-30 rounded h-3 w-32 animate-pulse"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-darkWhite bg-opacity-30 rounded h-3 w-16 mb-1 animate-pulse"></div>
                  <div className="bg-darkWhite bg-opacity-30 rounded h-3 w-20 animate-pulse"></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="bg-darkWhite bg-opacity-40 rounded h-4 w-full animate-pulse"></div>
                <div className="bg-darkWhite bg-opacity-40 rounded h-4 w-4/5 animate-pulse"></div>
                <div className="bg-darkWhite bg-opacity-40 rounded h-4 w-3/5 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
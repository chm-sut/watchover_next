"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function TicketTimelineLoader() {
  const router = useRouter();

  return (
    <div className="flex-1 relative">
          {/* Scrollable Content */}
          <div className="absolute rounded-2xl inset-0 bg-logoBlack bg-opacity-40 overflow-y-auto">
          {/* Floating Header */}
          <div className="sticky rounded-t-2xl top-0 z-20 bg-logoBlack bg-opacity-10 backdrop-blur-md px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 relative overflow-hidden border-b border-white border-opacity-20">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-logoWhite hover:bg-logoBlue hover:text-logoWhite transition-colors font-body text-body"
              >
                ← Back
              </button>
              <div className="flex items-center gap-3">
                <div className="bg-darkWhite bg-opacity-50 rounded h-6 w-16 animate-pulse"></div>
                <div className="bg-darkWhite bg-opacity-50 rounded h-6 w-48 animate-pulse"></div>
              </div>
            </div>
          </div>
            {/* Ticket Information Card */}
            <div className="rounded-2xl p-4 sm:p-6 md:p-8 w-full">

            {/* Loading Skeleton - Ticket Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="space-y-4">
                <div>
                  <label className="text-darkWhite text-sm block mb-1">Ticket Name:</label>
                  <div className="bg-darkWhite bg-opacity-30 rounded h-6 w-3/4 animate-pulse"></div>
                </div>
                
                <div>
                  <label className="text-darkWhite text-sm block mb-1">Priority:</label>
                  <div className="bg-darkWhite bg-opacity-30 rounded-full h-6 w-20 animate-pulse"></div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-darkWhite text-sm block mb-1">Ticket Code:</label>
                  <div className="bg-darkWhite bg-opacity-30 rounded h-6 w-1/2 animate-pulse"></div>
                </div>
                
                <div>
                  <label className="text-darkWhite text-sm block mb-1">Customer:</label>
                  <div className="bg-darkWhite bg-opacity-30 rounded h-6 w-2/3 animate-pulse"></div>
                </div>
              </div>
            </div>

            <div className="mb-6 sm:mb-8">
              <label className="text-darkWhite text-sm block mb-1">Last Update:</label>
              <div className="bg-darkWhite bg-opacity-30 rounded h-6 w-1/3 animate-pulse"></div>
            </div>

            {/* Status Information Section */}
            <div>
              <h3 className="font-heading text-body sm:text-h6 text-logoWhite mb-4 sm:mb-6">Status Information</h3>
              
              {/* Loading Timeline */}
              <div className="relative pl-16 sm:pl-20">
                {/* Single Continuous Timeline Line */}
                <div 
                  className="absolute left-[-32px] sm:left-[-40px] top-3 sm:top-4 w-0.5 bg-darkWhite z-0" 
                  style={{ height: `${(5 - 1) * 6.5 * 16}px` }}
                />
                
                {["Loading...", "Loading...", "Loading...", "Loading...", "Loading..."].map((_, index) => (
                  <div key={index} className="relative mb-6 sm:mb-8 last:mb-0">
                    {/* Timeline Icon */}
                    <div className="absolute left-[-50px] sm:left-[-58px] top-0 w-9 h-9 sm:w-11 sm:h-11 z-10 animate-pulse">
                      <Image src="/icons/notStart.svg" alt="Loading" width={40} height={40} className="w-full h-full" />
                    </div>
                    
                    {/* Loading Step Card */}
                    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 sm:p-6 w-fit min-w-[200px] sm:min-w-[250px]">
                      <div className="bg-darkWhite bg-opacity-50 rounded h-6 w-32 mb-2 sm:mb-3 animate-pulse"></div>
                      <div className="space-y-1 sm:space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm text-darkWhite whitespace-nowrap">Date:</span>
                          <div className="bg-darkWhite bg-opacity-30 rounded h-4 w-24 animate-pulse"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm text-darkWhite whitespace-nowrap">Time:</span>
                          <div className="bg-darkWhite bg-opacity-30 rounded h-4 w-16 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>
    </div>
  );
}
import { useState } from 'react';

const Hero = ({ data, onLogin }) => {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative">
      <div className="flex flex-col lg:flex-row gap-12 items-center">
        
        {/* LEFT CONTENT */}
        <div className="w-full lg:w-1/2 flex flex-col items-start text-left">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-700 bg-slate-800/30 mb-8">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-purple-300 tracking-wider">
              {data?.badge}
            </span>
          </div>

          <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 text-white">
            {data?.titleLine1} <br />
            {data?.titleLine2} <br />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              {data?.titleHighlight}
            </span>
          </h1>

          <p className="text-lg text-slate-400 mb-10 max-w-2xl">
            {data?.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            
            {/* ✅ BUTTON LOGIN */}
            <button
              onClick={onLogin}
              className="relative z-10 bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition"
            >
              {data?.primaryButton || "Coba Demo Gratis"}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>

          </div>
        </div>

        {/* RIGHT UI MOCKUP */}
        <div className="w-full lg:w-1/2 mt-12 lg:mt-0">
          <div className="bg-[#151b2b] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden h-[400px]">
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

            <div className="flex gap-4 h-full relative z-10">
              
              <div className="w-1/4 h-full bg-slate-800/50 rounded-xl"></div>

              <div className="w-3/4 flex flex-col gap-4">
                
                <div className="flex gap-4">
                  <div className="w-1/3 h-20 bg-slate-800/80 rounded-xl"></div>
                  <div className="w-1/3 h-20 bg-slate-800/80 rounded-xl"></div>
                  <div className="w-1/3 h-20 bg-slate-800/80 rounded-xl"></div>
                </div>

                <div className="w-full h-full bg-slate-800/40 border border-slate-800/50 rounded-xl flex items-end p-4 gap-4">
                  <div className="w-1/4 h-1/3 bg-slate-700/50 rounded-t-md"></div>
                  <div className="w-1/4 h-2/3 bg-slate-700/80 rounded-t-md"></div>
                  <div className="w-1/4 h-full bg-purple-600/80 rounded-t-md"></div>
                  <div className="w-1/4 h-1/2 bg-slate-700/50 rounded-t-md"></div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Hero;
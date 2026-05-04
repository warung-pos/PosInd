import React, { useState } from 'react';

const Hero = ({ data, onLogin }) => {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative">
      <div className="flex flex-col lg:flex-row gap-12 items-center">
        <div className="w-full lg:w-1/2 flex flex-col items-start text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-700 bg-slate-800/30 mb-8">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-purple-300 tracking-wider">{data.badge}</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 text-white">
            {data.titleLine1} <br />
            {data.titleLine2} <br />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{data.titleHighlight}</span>
          </h1>
          <p className="text-lg text-slate-400 mb-10 max-w-2xl">{data.description}</p>
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            
            {/* Tombol Coba Demo Gratis diarahkan ke onLogin */}
            <button onClick={onLogin} className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition">
              {data.primaryButton}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            
            {/* Tombol Video memunculkan modal */}
            <button onClick={() => setShowVideo(true)} className="bg-[#151b2b] hover:bg-slate-800 border border-slate-700 text-white px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              {data.secondaryButton}
            </button>
          </div>
        </div>
        
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

      {/* MODAL VIDEO POP-UP */}
      {showVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#151b2b] p-6 rounded-2xl max-w-3xl w-full border border-slate-800 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Video Pengenalan WarungPOS</h3>
              <button onClick={() => setShowVideo(false)} className="text-slate-400 hover:text-white p-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="aspect-video bg-slate-800 rounded-xl flex flex-col items-center justify-center gap-4 border border-slate-700">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-slate-500"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              <span className="text-slate-400">Simulasi Video Player Berjalan...</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Hero;
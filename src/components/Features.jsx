const Features = ({ data }) => {
  // Pengaman agar tidak error jika data kosong
  if (!data || !data.items) {
    return null; 
  }

  const getIcon = (type) => {
    switch (type) {
      case 'settings':
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 
            2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 
            1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 
            2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4 
            a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 
            2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 
            1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 
            2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9 
            a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 
            2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9 
            a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 
            2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 
            1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 
            2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9 
            a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 
            2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        );

      case 'package':
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          </svg>
        );

      case 'trending':
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <section 
      id="fitur" 
      className="bg-[#0b0e17] py-24 border-t border-slate-800 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HEADER */}
        <div className="text-center mb-16">
          <p className="text-purple-500 font-bold tracking-[0.2em] text-sm mb-4">
            {data.subtitle}
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white">
            {data.title}
          </h2>
        </div>

        {/* FEATURES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.items.map((feature) => (
            <div 
              key={feature.id} 
              className="bg-[#151b2b] border border-slate-800 rounded-3xl p-8 hover:border-purple-500/50 transition duration-300"
            >
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
                {getIcon(feature.icon)}
              </div>

              <h3 className="text-2xl font-bold text-white mb-4">
                {feature.title}
              </h3>

              <p className="text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Features;
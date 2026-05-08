const Navbar = ({ data, onLogin }) => {

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="border-b border-slate-800 bg-[#0f1423]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* LOGO */}
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="bg-linear-to-br from-purple-500 to-purple-700 w-10 h-10 rounded-xl flex items-center justify-center"> 
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="8" cy="21" r="1"/>
                <circle cx="19" cy="21" r="1"/>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
              </svg>
            </div>

            <span className="text-2xl font-bold tracking-tight text-white">
              {data.logoText}
              <span className="text-purple-400">{data.logoHighlight}</span>
            </span>
          </div>

          {/* MENU */}
          <div className="hidden md:flex space-x-8 items-center">
            
            {/* 🔥 FIX DI SINI */}
            {data.links.map((link, idx) => (
              <button
                key={idx}
                onClick={() => scrollToSection(link.id)}
                className="text-gray-300 hover:text-white transition"
              >
                {link.label}
              </button>
            ))}

            <button 
              onClick={onLogin} 
              className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-lg transition"
            >
              Masuk
            </button>

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
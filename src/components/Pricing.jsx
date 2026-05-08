import { Check } from 'lucide-react';

const Pricing = ({ onSelectPlan }) => {
  const plans = [
    { 
      name: "Basic", 
      price: 0, 
      features: ["Stok Terbatas", "Laporan Harian", "1 User"],
      description: "Cocok untuk usaha kecil yang baru mulai",
    },
    { 
      name: "Pro", 
      price: 150000, 
      features: ["Stok Tak Terbatas", "Laporan Pajak", "5 User", "Support 24/7"], 
      popular: true,
      description: "Paling cocok untuk UMKM berkembang",
    },
    { 
      name: "Enterprise", 
      price: 500000, 
      features: ["Custom Fitur", "Multi Cabang", "Unlimited User"],
      description: "Solusi lengkap untuk bisnis besar",
    }
  ];

  const formatPrice = (price) => {
    if (price === 0) return "Gratis";
    return `Rp${price.toLocaleString('id-ID')}`;
  };

  return (
    <section id="harga" className="py-24 bg-[#0f1423] px-6">
      <div className="max-w-7xl mx-auto text-center">
        
        {/* HEADER */}
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
          Pilih Paket Bisnismu
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Mulai gratis dan upgrade kapan saja sesuai kebutuhan tokomu
        </p>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {plans.map((plan, idx) => (
            
            <div 
              key={idx} 
              className={`relative p-8 rounded-3xl border transition-all duration-300 hover:scale-105 ${
                plan.popular 
                  ? 'border-purple-500 bg-purple-500/5 shadow-[0_0_25px_rgba(168,85,247,0.2)] scale-105' 
                  : 'border-slate-800 bg-slate-900/50'
              }`}
            >

              {/* 🔥 BADGE POPULAR */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                  PALING POPULER
                </div>
              )}

              {/* TITLE */}
              <h3 className="text-xl font-bold text-white mb-2">
                {plan.name}
              </h3>

              {/* DESC */}
              <p className="text-sm text-slate-400 mb-4">
                {plan.description}
              </p>

              {/* PRICE */}
              <div className="text-4xl font-extrabold text-white my-4">
                {formatPrice(plan.price)}
                {plan.price !== 0 && (
                  <span className="text-sm text-gray-500">/bulan</span>
                )}
              </div>

              {/* FEATURES */}
              <ul className="text-left space-y-4 mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <Check size={18} className="text-purple-400" /> 
                    {f}
                  </li>
                ))}
              </ul>

              {/* BUTTON */}
              <button 
                onClick={() => onSelectPlan?.(plan)}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  plan.popular 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg' 
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                {plan.price === 0 ? "Mulai Gratis" : "Pilih Paket"}
              </button>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
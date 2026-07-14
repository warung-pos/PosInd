import { CheckCircle2, X } from 'lucide-react';

const Pricing = ({ onSelectPlan }) => {
  const plans = [
    {
      name: 'Basic',
      price: 'Gratis',
      numericPrice: 0,
      desc: 'Sempurna untuk memulai usaha kecil',
      color: 'from-slate-500 to-slate-600',
      icon: '🛒',
      features: [
        { text: 'Hingga 30 produk', included: true },
        { text: '1 akun pengguna', included: true },
        { text: 'Transaksi POS dasar', included: true },
        { text: 'Laporan harian', included: true },
        { text: 'Cetak struk (thermal)', included: true },
        { text: 'Pembayaran Cash', included: true },
        { text: 'Pembayaran QRIS', included: false },
        { text: 'Laporan pajak & keuangan', included: false },
        { text: 'Multi cabang', included: false },
        { text: 'Export laporan (Excel/PDF)', included: false },
        { text: 'Support prioritas 24/7', included: false },
        { text: 'Custom branding struk', included: false },
      ]
    },
    {
      name: 'Pro',
      price: 'Rp150.000',
      numericPrice: 150000,
      period: '/bulan',
      desc: 'Solusi terbaik untuk UMKM berkembang',
      color: 'from-purple-500 to-purple-700',
      icon: '⚡',
      popular: true,
      features: [
        { text: 'Produk tak terbatas', included: true },
        { text: 'Hingga 5 akun pengguna', included: true },
        { text: 'Transaksi POS lengkap', included: true },
        { text: 'Laporan harian & mingguan', included: true },
        { text: 'Cetak struk (thermal)', included: true },
        { text: 'Pembayaran Cash', included: true },
        { text: 'Pembayaran QRIS (SmartBank)', included: true },
        { text: 'Laporan pajak & keuangan', included: true },
        { text: 'Multi cabang', included: false },
        { text: 'Export laporan (Excel/PDF)', included: true },
        { text: 'Support prioritas 24/7', included: true },
        { text: 'Custom branding struk', included: false },
      ]
    },
    {
      name: 'Enterprise',
      price: 'Rp500.000',
      numericPrice: 500000,
      period: '/bulan',
      desc: 'Untuk bisnis besar & multi-cabang',
      color: 'from-amber-500 to-orange-600',
      icon: '👑',
      features: [
        { text: 'Produk tak terbatas', included: true },
        { text: 'Unlimited akun pengguna', included: true },
        { text: 'Transaksi POS lengkap', included: true },
        { text: 'Laporan real-time & analitik', included: true },
        { text: 'Cetak struk (thermal)', included: true },
        { text: 'Pembayaran Cash', included: true },
        { text: 'Pembayaran QRIS (SmartBank)', included: true },
        { text: 'Laporan pajak & keuangan', included: true },
        { text: 'Multi cabang (unlimited)', included: true },
        { text: 'Export laporan (Excel/PDF)', included: true },
        { text: 'Support prioritas 24/7', included: true },
        { text: 'Custom branding struk', included: true },
      ]
    },
  ];

  return (
    <section id="harga" className="py-24 bg-[#0f1423] px-6">
      <div className="max-w-7xl mx-auto text-center">
        
        {/* HEADER */}
        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
          Pilih Paket Bisnismu
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto mb-16">
          Mulai gratis dan upgrade kapan saja sesuai kebutuhan tokomu. Semua paket dilengkapi fitur POS modern.
        </p>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          {plans.map((p, i) => (
            
            <div 
              key={i} 
              className={`relative flex flex-col bg-[#0f1423] border ${
                p.popular ? 'border-purple-600 shadow-2xl shadow-purple-900/30 md:-mt-4' : 'border-slate-800'
              } rounded-[2rem] overflow-hidden transition-all hover:translate-y-[-6px] hover:shadow-xl`}
            >

              {/* Card gradient top bar */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${p.color}`} />

              {p.popular && (
                <div className="absolute top-4 right-4 bg-purple-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg text-white">
                  ⭐ Terpopuler
                </div>
              )}

              <div className="p-8 text-left">
                {/* Plan icon & name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center text-2xl shadow-lg`}>
                    {p.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-extrabold text-white">{p.name}</h4>
                    <p className="text-slate-500 text-xs">{p.desc}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-end gap-1 my-6 text-white">
                  <span className="text-4xl font-black">{p.price}</span>
                  {p.period && <span className="text-slate-500 text-sm mb-1">{p.period}</span>}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => onSelectPlan?.({ ...p, price: p.numericPrice })}
                  className={`w-full py-3.5 rounded-2xl font-bold transition-all text-sm active:scale-95 text-white shadow-lg bg-gradient-to-r ${p.color} hover:opacity-90 hover:shadow-xl`}
                >
                  {p.name === 'Basic' ? '🚀 Mulai Gratis' : '📦 Pilih Paket'}
                </button>

                {/* Divider */}
                <div className="border-t border-slate-800 my-6" />

                {/* Features */}
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">Yang kamu dapatkan:</p>
                  {p.features.map((f, j) => (
                    <div key={j} className={`flex items-center gap-3 text-sm ${ f.included ? 'text-slate-200' : 'text-slate-600 line-through' }`}>
                      {f.included
                        ? <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                        : <X size={15} className="text-slate-650 shrink-0" />
                      }
                      <span>{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
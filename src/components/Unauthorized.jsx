import { ShieldOff, ArrowLeft } from 'lucide-react';

/**
 * Komponen Unauthorized — ditampilkan saat user mencoba mengakses
 * tab/halaman yang bukan hak aksesnya (termasuk via developer tools).
 *
 * @param {Object}   props
 * @param {string}   props.role        - Role user saat ini
 * @param {string}   props.tabLabel    - Nama tab yang dicoba diakses
 * @param {Function} props.onGoBack    - Callback untuk kembali ke tab default
 */
const Unauthorized = ({ role, tabLabel, onGoBack }) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8 min-h-[60vh]">
      <div className="flex flex-col items-center text-center max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Icon dengan glow effect */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl scale-150" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-500/10 to-red-600/20 border border-red-500/30 flex items-center justify-center shadow-2xl">
            <ShieldOff size={40} className="text-red-400" strokeWidth={1.5} />
          </div>
        </div>

        {/* Judul */}
        <h2 className="text-2xl font-bold text-white mb-2">
          Akses Ditolak
        </h2>

        {/* Pesan detail */}
        <p className="text-slate-400 text-sm leading-relaxed mb-2">
          {tabLabel
            ? <>Halaman <span className="text-white font-semibold">"{tabLabel}"</span> tidak tersedia untuk role Anda.</>
            : 'Halaman ini tidak tersedia untuk role Anda.'
          }
        </p>
        <p className="text-slate-500 text-xs leading-relaxed mb-8">
          Role aktif Anda:{' '}
          <span className="text-purple-400 font-bold">{role || 'Unknown'}</span>
          . Hubungi administrator jika Anda yakin ini keliru.
        </p>

        {/* Badge role */}
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-xs text-red-400 font-semibold mb-8 select-none">
          <ShieldOff size={12} />
          Tidak memiliki hak akses
        </div>

        {/* Tombol kembali */}
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/20 active:scale-95 hover:shadow-purple-500/30 hover:shadow-xl"
          >
            <ArrowLeft size={16} />
            Kembali ke Dashboard
          </button>
        )}
      </div>
    </div>
  );
};

export default Unauthorized;

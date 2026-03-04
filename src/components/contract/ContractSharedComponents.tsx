import agencyLogo from "@/assets/agency-logo.png";

// Decorative components
export const GradientOrbs = () => (
  <>
    <div className="absolute top-0 right-0 w-[350px] h-[350px] rounded-full bg-gradient-to-br from-pink-500/20 via-fuchsia-500/10 to-transparent blur-[80px]" />
    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-purple-500/15 via-pink-500/10 to-transparent blur-[80px]" />
  </>
);

export const FloatingShapes = () => (
  <>
    <div className="absolute top-8 right-16 w-12 h-12 border border-pink-500/20 rounded-full" />
    <div className="absolute bottom-20 left-8 w-8 h-8 border border-fuchsia-500/15 rounded-xl rotate-12" />
  </>
);

export const DotsPattern = ({ className = "" }: { className?: string }) => (
  <div className={`absolute opacity-20 ${className}`}>
    <div className="grid grid-cols-3 gap-1.5">
      {[...Array(9)].map((_, i) => (
        <div key={i} className="w-0.5 h-0.5 rounded-full bg-pink-400" />
      ))}
    </div>
  </div>
);

// Page wrapper component
export const PageWrapper = ({ children, pageNumber, totalPages = 1 }: { children: React.ReactNode; pageNumber: number; totalPages?: number }) => (
  <div
    className="w-[595px] h-[842px] relative overflow-hidden"
    style={{ backgroundColor: '#09090b' }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
    <GradientOrbs />
    <FloatingShapes />
    <DotsPattern className="top-12 right-4" />
    <DotsPattern className="bottom-24 left-4" />
    
    <div className="relative h-full flex flex-col p-5">
      {children}
      
      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-3">
        <div className="flex items-center gap-1.5">
          <img src={agencyLogo} alt="Aurine" className="w-4 h-4 object-contain opacity-50" />
          <span className="text-zinc-600 text-[9px]">aurine.pl</span>
        </div>
        <p className="text-[9px] text-zinc-600">
          {totalPages > 1 ? `Strona ${pageNumber} z ${totalPages}` : 'Aneks do umowy'}
        </p>
      </div>
    </div>
  </div>
);

// Section component
export const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-2">
    <p className="text-[9px] text-pink-400 font-semibold mb-1">{title}</p>
    {children}
  </div>
);

export const BulletList = ({ items }: { items: string[] }) => (
  <ul className="text-[7.5px] text-zinc-400 leading-relaxed space-y-0.5">
    {items.map((item, i) => (
      <li key={i} className="flex gap-1">
        <span className="text-pink-400/60">•</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

// Header component  
export const ContractHeader = ({ title, logoSrc }: { title: string; logoSrc?: string }) => (
  <div className="flex items-start justify-between mb-3">
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="absolute inset-0 bg-pink-500/30 blur-lg rounded-full" />
        <img src={logoSrc || agencyLogo} alt="Aurine" className="relative w-8 h-8 object-contain" />
      </div>
      <div>
        <p className="text-sm font-semibold bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent">
          Aurine
        </p>
        <p className="text-[8px] text-zinc-500">Marketing dla salonów beauty</p>
      </div>
    </div>
    <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-gradient-to-r from-pink-500/20 to-fuchsia-500/20 border border-pink-500/30 rounded-lg">
      <span className="text-white text-xs font-semibold">{title}</span>
    </div>
  </div>
);

// Parties grid
export const PartiesGrid = ({ 
  agencyName, agencyOwnerName, agencyAddress, agencyNip, agencyPhone, agencyEmail,
  clientName, clientOwnerName, clientAddress, clientNip, clientPhone, clientEmail 
}: {
  agencyName?: string; agencyOwnerName?: string; agencyAddress?: string; agencyNip?: string; agencyPhone?: string; agencyEmail?: string;
  clientName?: string; clientOwnerName?: string; clientAddress?: string; clientNip?: string; clientPhone?: string; clientEmail?: string;
}) => (
  <div className="grid grid-cols-2 gap-3 mb-3">
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/50 to-fuchsia-500/50 rounded-lg blur-sm opacity-30" />
      <div className="relative bg-zinc-900 border border-pink-500/30 rounded-lg p-2.5">
        <p className="text-[8px] text-pink-400 uppercase tracking-wider font-semibold mb-1.5">Wykonawca</p>
        <p className="text-[10px] font-bold text-white">{agencyName || "Agencja Marketingowa Aurine"}</p>
        {agencyOwnerName && <p className="text-[8px] text-zinc-400 mt-0.5">{agencyOwnerName}</p>}
        {agencyAddress && <p className="text-[8px] text-zinc-500 mt-0.5">{agencyAddress}</p>}
        <div className="mt-1 space-y-0.5 text-[8px] text-zinc-500">
          {agencyPhone && <p>Tel: {agencyPhone}</p>}
          {agencyEmail && <p>{agencyEmail}</p>}
          {agencyNip && <p>NIP: {agencyNip}</p>}
        </div>
      </div>
    </div>
    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-2.5">
      <p className="text-[8px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">Zleceniodawca</p>
      <p className="text-[10px] font-bold text-white">{clientName || "—"}</p>
      {clientOwnerName && <p className="text-[8px] text-zinc-400 mt-0.5">{clientOwnerName}</p>}
      {clientAddress && <p className="text-[8px] text-zinc-500 mt-0.5">{clientAddress}</p>}
      <div className="mt-1 space-y-0.5 text-[8px] text-zinc-500">
        {clientPhone && <p>Tel: {clientPhone}</p>}
        {clientEmail && <p>{clientEmail}</p>}
        {clientNip && <p>NIP: {clientNip}</p>}
      </div>
    </div>
  </div>
);

// Signatures block
export const SignaturesBlock = ({ executorName, clientName }: { executorName?: string; clientName?: string }) => (
  <div className="grid grid-cols-2 gap-8 mt-auto pt-4">
    <div className="text-center">
      <div className="h-12 border-b-2 border-zinc-700 mb-1"></div>
      <p className="text-[9px] text-zinc-500 font-medium">Wykonawca</p>
      <p className="text-[7px] text-zinc-600">{executorName || "Agencja Marketingowa Aurine"}</p>
    </div>
    <div className="text-center">
      <div className="h-12 border-b-2 border-zinc-700 mb-1"></div>
      <p className="text-[9px] text-zinc-500 font-medium">Zleceniodawca</p>
      <p className="text-[7px] text-zinc-600">{clientName || "—"}</p>
    </div>
  </div>
);

// Info pill (date, city, etc.)
export const InfoPill = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-2 px-2 py-1.5 bg-zinc-800/40 border border-zinc-700/50 rounded-lg">
    <div className="w-5 h-5 rounded-md bg-gradient-to-br from-pink-500/20 to-fuchsia-500/20 flex items-center justify-center">
      {icon}
    </div>
    <div>
      <p className="text-[8px] text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className="text-white font-medium text-[10px]">{value}</p>
    </div>
  </div>
);

export const formatContractDate = (dateStr: string) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("pl-PL", { day: "2-digit", month: "long", year: "numeric" });
};

export const formatContractAmount = (amount: string | number | null) => {
  if (!amount) return "0";
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toLocaleString("pl-PL", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

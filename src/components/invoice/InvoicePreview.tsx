import agencyLogo from "@/assets/agency-logo.png";

export interface InvoiceService {
  id: string;
  description: string;
  quantity: number;
  price: string;
}

interface InvoiceData {
  invoiceType: "advance" | "final" | "full";
  clientName: string;
  clientOwnerName: string;
  clientAddress: string;
  clientNIP: string;
  clientPhone?: string;
  clientEmail?: string;
  invoiceNumber: string;
  issueDate: string;
  services: InvoiceService[];
  amount: string;
  advanceAmount: string;
  paymentDue: string;
  bankName: string;
  bankAccount: string;
  agencyName: string;
  agencyOwner: string;
  agencyAddress: string;
  agencyNIP: string;
  agencyPhone?: string;
  agencyEmail?: string;
}

// SVG Icons
const CalendarIcon = () => (
  <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
    <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
    <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const RevolutIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
    <path d="M6 3v18h3v-7h2l4 7h3.5l-4.5-7.5c2.1-.8 3.5-2.8 3.5-5.5 0-3.3-2.7-5-6-5H6zm3 2.5h3c1.9 0 3 1 3 2.5s-1.1 2.5-3 2.5H9V5.5z"/>
  </svg>
);

const CreditCardIcon = () => (
  <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2"/>
    <path d="M2 10h20" strokeWidth="2"/>
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" strokeWidth="2"/>
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

interface InvoicePreviewProps {
  data: InvoiceData;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("pl-PL", { day: "2-digit", month: "long", year: "numeric" });
};

const formatAmount = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount || "0") : amount;
  return num.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const numberToWords = (num: number): string => {
  const ones = ["", "jeden", "dwa", "trzy", "cztery", "pięć", "sześć", "siedem", "osiem", "dziewięć"];
  const teens = ["dziesięć", "jedenaście", "dwanaście", "trzynaście", "czternaście", "piętnaście", "szesnaście", "siedemnaście", "osiemnaście", "dziewiętnaście"];
  const tens = ["", "", "dwadzieścia", "trzydzieści", "czterdzieści", "pięćdziesiąt", "sześćdziesiąt", "siedemdziesiąt", "osiemdziesiąt", "dziewięćdziesiąt"];
  const hundreds = ["", "sto", "dwieście", "trzysta", "czterysta", "pięćset", "sześćset", "siedemset", "osiemset", "dziewięćset"];

  if (num === 0) return "zero";
  if (num < 0) return "minus " + numberToWords(-num);
  
  let result = "";
  
  // Handle thousands
  if (num >= 1000) {
    const th = Math.floor(num / 1000);
    if (th === 1) {
      result += "tysiąc ";
    } else if (th >= 2 && th <= 4) {
      result += numberToWords(th) + " tysiące ";
    } else if (th >= 5 && th <= 21) {
      result += numberToWords(th) + " tysięcy ";
    } else {
      const lastDigit = th % 10;
      const lastTwoDigits = th % 100;
      if (lastTwoDigits >= 12 && lastTwoDigits <= 14) {
        result += numberToWords(th) + " tysięcy ";
      } else if (lastDigit >= 2 && lastDigit <= 4) {
        result += numberToWords(th) + " tysiące ";
      } else {
        result += numberToWords(th) + " tysięcy ";
      }
    }
    num = num % 1000;
  }
  
  // Handle hundreds
  const h = Math.floor(num / 100);
  if (h > 0) {
    result += hundreds[h] + " ";
    num = num % 100;
  }
  
  // Handle tens and ones
  if (num >= 10 && num <= 19) {
    result += teens[num - 10] + " ";
  } else {
    const t = Math.floor(num / 10);
    const o = num % 10;
    if (t > 0) result += tens[t] + " ";
    if (o > 0) result += ones[o] + " ";
  }

  return result.trim();
};

const getZlotyForm = (num: number): string => {
  const absNum = Math.abs(num);
  if (absNum === 1) return "złoty";
  const lastDigit = absNum % 10;
  const lastTwoDigits = absNum % 100;
  if (lastTwoDigits >= 12 && lastTwoDigits <= 14) return "złotych";
  if (lastDigit >= 2 && lastDigit <= 4) return "złote";
  return "złotych";
};

const getGroszyForm = (num: number): string => {
  if (num === 1) return "grosz";
  const lastDigit = num % 10;
  const lastTwoDigits = num % 100;
  if (lastTwoDigits >= 12 && lastTwoDigits <= 14) return "groszy";
  if (lastDigit >= 2 && lastDigit <= 4) return "grosze";
  return "groszy";
};

// Decorative components from WelcomePack style
const GradientOrbs = () => (
  <>
    <div className="absolute top-0 right-0 w-[350px] h-[350px] rounded-full bg-gradient-to-br from-pink-500/20 via-fuchsia-500/10 to-transparent blur-[80px]" />
    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-purple-500/15 via-pink-500/10 to-transparent blur-[80px]" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full bg-pink-500/5 blur-[60px]" />
  </>
);

const FloatingShapes = () => (
  <>
    <div className="absolute top-8 right-16 w-16 h-16 border border-pink-500/20 rounded-full" />
    <div className="absolute top-24 right-8 w-6 h-6 bg-pink-500/10 rounded-lg rotate-45" />
    <div className="absolute bottom-32 left-12 w-12 h-12 border border-fuchsia-500/15 rounded-xl rotate-12" />
    <div className="absolute bottom-20 right-24 w-4 h-4 bg-pink-400/20 rounded-full" />
  </>
);

const DecorativeLines = () => (
  <>
    <div className="absolute top-0 left-1/4 w-px h-24 bg-gradient-to-b from-pink-500/30 to-transparent" />
    <div className="absolute bottom-0 right-1/3 w-px h-20 bg-gradient-to-t from-fuchsia-500/20 to-transparent" />
  </>
);

const DotsPattern = ({ className = "" }: { className?: string }) => (
  <div className={`absolute opacity-20 ${className}`}>
    <div className="grid grid-cols-4 gap-2">
      {[...Array(16)].map((_, i) => (
        <div key={i} className="w-1 h-1 rounded-full bg-pink-400" />
      ))}
    </div>
  </div>
);

export const InvoicePreview = ({ data }: InvoicePreviewProps) => {
  // Parse services - may be string from database or array
  const services: InvoiceService[] = (() => {
    if (!data.services) return [];
    if (Array.isArray(data.services)) return data.services;
    if (typeof data.services === 'string') {
      try {
        return JSON.parse(data.services);
      } catch {
        return [];
      }
    }
    return [];
  })();
  
  const totalAmount = services.reduce((sum, s) => sum + (parseFloat(s.price || "0") * s.quantity), 0);
  const advanceAmount = parseFloat(data.advanceAmount || "0");
  
  // For final invoices: if advanceAmount is provided, we show the advance as a deduction line
  // The "to pay" amount is just the services total (which should already be the remaining amount)
  // We don't subtract advanceAmount again - the display line is informational only
  const finalAmount = totalAmount;
  
  const invoiceTitle = data.invoiceType === "advance" 
    ? "Faktura zaliczkowa" 
    : data.invoiceType === "final" 
      ? "Faktura końcowa" 
      : "Faktura";

  const zlote = Math.floor(finalAmount);
  const grosze = Math.round((finalAmount % 1) * 100);
  const zloteSlownie = numberToWords(zlote);
  const groszeSlownie = grosze > 0 ? numberToWords(grosze) : "";

  return (
    <div
      id="invoice-preview"
      className="w-[595px] min-h-[842px] relative overflow-hidden"
      style={{ backgroundColor: '#09090b' }}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
      <GradientOrbs />
      <FloatingShapes />
      <DecorativeLines />
      <DotsPattern className="top-16 right-6" />
      <DotsPattern className="bottom-40 left-6" />

      {/* Content */}
      <div className="relative h-full flex flex-col p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-pink-500/30 blur-xl rounded-full" />
              <img src={agencyLogo} alt="Aurine" className="relative w-10 h-10 object-contain" />
            </div>
            <div>
              <p className="text-base font-semibold bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent">
                {data.agencyName || "Aurine"}
              </p>
              <p className="text-[10px] text-zinc-500 tracking-wide">Marketing dla salonów beauty</p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-pink-500/20 to-fuchsia-500/20 border border-pink-500/30 rounded-lg">
              <span className="text-white text-sm font-semibold">{invoiceTitle}</span>
            </div>
            <p className="text-zinc-500 text-[11px] mt-2 font-mono">{data.invoiceNumber || "—"}</p>
          </div>
        </div>

        {/* Dates */}
        <div className="flex gap-4 mb-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/40 border border-zinc-700/50 rounded-lg">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-pink-500/20 to-fuchsia-500/20 flex items-center justify-center">
              <CalendarIcon />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Data wystawienia</p>
              <p className="text-white font-medium text-xs">{formatDate(data.issueDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/40 border border-zinc-700/50 rounded-lg">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <ClockIcon />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Termin płatności</p>
              <p className="text-white font-medium text-xs">{formatDate(data.paymentDue)}</p>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/50 to-fuchsia-500/50 rounded-lg blur-sm opacity-30" />
            <div className="relative bg-zinc-900 border border-pink-500/30 rounded-lg p-3">
              <p className="text-[10px] text-pink-400 uppercase tracking-wider font-semibold mb-2">Sprzedawca</p>
              <p className="text-sm font-bold text-white">{data.agencyName || "Aurine"}</p>
              {data.agencyOwner && <p className="text-xs text-zinc-400 mt-0.5">{data.agencyOwner}</p>}
              {data.agencyAddress && <p className="text-xs text-zinc-500 mt-1">{data.agencyAddress}</p>}
              {data.agencyNIP && <p className="text-xs text-zinc-500 mt-0.5">NIP: {data.agencyNIP}</p>}
              {data.agencyPhone && <p className="text-xs text-zinc-500 mt-0.5">Tel: {data.agencyPhone}</p>}
              {data.agencyEmail && <p className="text-xs text-zinc-500 mt-0.5">{data.agencyEmail}</p>}
              <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-pink-500/10 rounded">
                <span className="text-[10px] text-pink-400 font-medium">Zwolniony z VAT</span>
              </div>
            </div>
          </div>
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-2">Nabywca</p>
            <p className="text-sm font-bold text-white">{data.clientName || "—"}</p>
            {data.clientOwnerName && <p className="text-xs text-zinc-400 mt-0.5">{data.clientOwnerName}</p>}
            {data.clientAddress && <p className="text-xs text-zinc-500 mt-1">{data.clientAddress}</p>}
            {data.clientNIP && <p className="text-xs text-zinc-500 mt-0.5">NIP: {data.clientNIP}</p>}
            {data.clientPhone && <p className="text-xs text-zinc-500 mt-0.5">Tel: {data.clientPhone}</p>}
            {data.clientEmail && <p className="text-xs text-zinc-500 mt-0.5">{data.clientEmail}</p>}
          </div>
        </div>

        {/* Services Table */}
        <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg overflow-hidden mb-4">
          <div className="bg-gradient-to-r from-pink-500/20 to-fuchsia-500/20 px-3 py-2 border-b border-zinc-700/50">
            <div className="grid grid-cols-12 text-[10px] uppercase tracking-wider font-semibold text-pink-300">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Usługa</div>
              <div className="col-span-2 text-right">Ilość</div>
              <div className="col-span-2 text-right">Cena</div>
              <div className="col-span-2 text-right">Wartość</div>
            </div>
          </div>
          <div className="divide-y divide-zinc-700/30">
            {services.length > 0 ? services.map((service, index) => (
              <div key={service.id} className="grid grid-cols-12 px-3 py-2 text-xs hover:bg-zinc-700/10 transition-colors">
                <div className="col-span-1 text-zinc-600">{index + 1}</div>
                <div className="col-span-5 text-zinc-200">{service.description || "—"}</div>
                <div className="col-span-2 text-right text-zinc-500">{service.quantity}</div>
                <div className="col-span-2 text-right text-zinc-500">{formatAmount(service.price)} zł</div>
                <div className="col-span-2 text-right font-semibold text-white">
                  {formatAmount(parseFloat(service.price || "0") * service.quantity)} zł
                </div>
              </div>
            )) : (
              <div className="px-3 py-3 text-xs text-zinc-600 text-center">Brak usług</div>
            )}
            
            {/* For final invoices, we show a note about the advance that was paid, but don't subtract it from the total
                since the service amount should already be the remaining amount after advance */}
            {data.invoiceType === "final" && advanceAmount > 0 && (
              <div className="grid grid-cols-12 px-3 py-2 text-xs bg-zinc-700/10 border-t border-zinc-700/30">
                <div className="col-span-12 text-zinc-500 text-[10px] italic">
                  Wpłacono zaliczkę: {formatAmount(advanceAmount)} zł (rozliczona osobną fakturą)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="flex justify-end mb-3">
          <div className="w-56">
            <div className="flex justify-between py-1.5 text-xs border-b border-zinc-700/50">
              <span className="text-zinc-500">Netto</span>
              <span className="text-zinc-300">{formatAmount(finalAmount)} zł</span>
            </div>
            <div className="flex justify-between py-1.5 text-xs border-b border-zinc-700/50">
              <span className="text-zinc-500">VAT (zw.)</span>
              <span className="text-zinc-600">—</span>
            </div>
            <div className="relative mt-2 group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-fuchsia-500 rounded-lg blur-sm opacity-50" />
              <div className="relative flex justify-between items-center py-2 px-3 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white rounded-lg">
                <span className="text-xs font-medium">Do zapłaty</span>
                <span className="text-base font-bold">{formatAmount(finalAmount)} zł</span>
              </div>
            </div>
          </div>
        </div>

        {/* Amount in words */}
        <div className="text-xs mb-3 px-3 py-1.5 bg-zinc-800/30 rounded-md inline-block">
          <span className="text-zinc-500">Słownie: </span>
          <span className="text-zinc-300">
            {zloteSlownie} {getZlotyForm(zlote)}
            {grosze > 0 ? ` i ${groszeSlownie} ${getGroszyForm(grosze)}` : ""}
          </span>
        </div>

        {/* Payment info */}
        <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 mb-3">
          <p className="text-[10px] text-pink-400 uppercase tracking-wider font-semibold mb-2">Dane do przelewu</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-md border border-zinc-700/30">
              <div className="w-7 h-7 rounded-md bg-zinc-800 flex items-center justify-center">
                <RevolutIcon />
              </div>
              <div>
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Bank</p>
                <p className="text-white font-medium text-[11px]">{data.bankName || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-md border border-zinc-700/30">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-pink-500/20 to-fuchsia-500/20 flex items-center justify-center">
                <CreditCardIcon />
              </div>
              <div>
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Numer konta</p>
                <p className="text-white font-medium font-mono text-[10px]">{data.bankAccount || "—"}</p>
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 p-2 bg-zinc-800/50 rounded-md border border-zinc-700/30">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-pink-500/20 to-fuchsia-500/20 flex items-center justify-center">
              <DocumentIcon />
            </div>
            <div>
              <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Tytuł przelewu</p>
              <p className="text-white font-medium text-[11px]">
                {services.length > 0 ? services[0].description : "Usługa"} - {data.invoiceNumber || "FV/2025/01/001"}
              </p>
            </div>
          </div>
        </div>

        {/* VAT notice */}
        <p className="text-[10px] text-zinc-600 text-center mb-4">
          Zwolnienie z VAT na podstawie art. 113 ust. 1 ustawy o podatku od towarów i usług
        </p>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-10">
          <div className="text-center">
            <div className="h-10 border-b-2 border-zinc-700 mb-1"></div>
            <p className="text-[10px] text-zinc-500">Wystawca</p>
          </div>
          <div className="text-center">
            <div className="h-10 border-b-2 border-zinc-700 mb-1"></div>
            <p className="text-[10px] text-zinc-500">Odebrał</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-4">
          <div className="flex items-center gap-1.5">
            <img src={agencyLogo} alt="Aurine" className="w-4 h-4 object-contain opacity-50" />
            <span className="text-zinc-600 text-[10px]">aurine.pl</span>
          </div>
          <p className="text-[10px] text-zinc-600">Marketing dla salonów beauty</p>
        </div>
      </div>
    </div>
  );
};
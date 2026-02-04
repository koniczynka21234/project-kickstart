import { 
  Sparkles, TrendingUp, Target, CheckCircle2, Users, 
  Star, ArrowRight, BarChart3, Heart,
  MessageCircle, Phone, Mail, Globe, Zap,
  Award, Clock, Instagram, Facebook, Calendar,
  Flower2, Search, FileText, LineChart,
  XCircle, Eye, DollarSign, Megaphone,
  Scissors, Palette, UserCheck, Send, Play,
  Gift, Shield, Rocket, ThumbsUp, Coffee,
  MapPin, Sparkle, CheckCircle, AlertCircle, Quote,
  GraduationCap, BookOpen, Wand2, Layout, Image, PenTool
} from "lucide-react";
import agencyLogo from "@/assets/agency-logo.png";
import { declineSalonNameToGenitive, declineCityToGenitive, declineCityToLocative } from "@/lib/polishDeclension";

interface PresentationData {
  ownerName: string;
  salonName: string;
  city: string;
}

interface PresentationPreviewProps {
  data: PresentationData;
  currentSlide: number;
  includeAcademy?: boolean;
}

// Helper function to decline Polish first name to genitive case (dopełniacz) - "dla kogo?"
const declineNameToGenitive = (name: string): string => {
  if (!name) return "Ciebie";
  
  const nameTrimmed = name.trim();
  const nameLower = nameTrimmed.toLowerCase();
  
  // Common female names exceptions
  const femaleExceptions: Record<string, string> = {
    "anna": "Anny",
    "maria": "Marii",
    "zofia": "Zofii",
    "julia": "Julii",
    "maja": "Mai",
    "kaja": "Kai",
    "alicja": "Alicji",
    "emilia": "Emilii",
    "natalia": "Natalii",
    "oliwia": "Oliwii",
    "wiktoria": "Wiktorii",
    "aleksandra": "Aleksandry",
    "karolina": "Karoliny",
    "magdalena": "Magdaleny",
    "joanna": "Joanny",
    "monika": "Moniki",
    "agnieszka": "Agnieszki",
    "dorota": "Doroty",
    "barbara": "Barbary",
    "katarzyna": "Katarzyny",
    "małgorzata": "Małgorzaty",
    "krystyna": "Krystyny",
    "beata": "Beaty",
    "iwona": "Iwony",
    "renata": "Renaty",
    "paulina": "Pauliny",
    "sylwia": "Sylwii",
    "patrycja": "Patrycji",
    "justyna": "Justyny",
    "marta": "Marty",
    "ewelina": "Eweliny",
    "dominika": "Dominiki",
    "aneta": "Anety",
    "izabela": "Izabeli",
    "weronika": "Weroniki",
    "adrianna": "Adrianny",
    "angelika": "Angeliki",
    "kamila": "Kamili",
    "klaudia": "Klaudii",
    "sandra": "Sandry",
    "dagmara": "Dagmary",
    "ilona": "Ilony",
    "lucyna": "Lucyny",
    "edyta": "Edyty",
    "danuta": "Danuty",
    "grażyna": "Grażyny",
    "helena": "Heleny",
    "bożena": "Bożeny",
    "urszula": "Urszuli",
    "elżbieta": "Elżbiety",
    "teresa": "Teresy",
    "jolanta": "Jolanty",
    "ewa": "Ewy",
    "agata": "Agaty",
    "kinga": "Kingi",
    "celina": "Celiny",
    "liliana": "Liliany",
    "marlena": "Marleny",
    "łucja": "Łucji",
    "laura": "Laury",
    "hanna": "Hanny",
    "gabriela": "Gabrieli",
    "michalina": "Michaliny",
  };
  
  // Common male names exceptions  
  const maleExceptions: Record<string, string> = {
    "jan": "Jana",
    "adam": "Adama",
    "piotr": "Piotra",
    "paweł": "Pawła",
    "krzysztof": "Krzysztofa",
    "andrzej": "Andrzeja",
    "tomasz": "Tomasza",
    "michał": "Michała",
    "marcin": "Marcina",
    "marek": "Marka",
    "grzegorz": "Grzegorza",
    "jakub": "Jakuba",
    "łukasz": "Łukasza",
    "mateusz": "Mateusza",
    "wojciech": "Wojciecha",
    "robert": "Roberta",
    "rafał": "Rafała",
    "kamil": "Kamila",
    "sebastian": "Sebastiana",
    "przemysław": "Przemysława",
    "przemek": "Przemka",
    "bartosz": "Bartosza",
    "damian": "Damiana",
    "artur": "Artura",
    "daniel": "Daniela",
    "dawid": "Dawida",
    "dominik": "Dominika",
    "filip": "Filipa",
    "hubert": "Huberta",
    "kacper": "Kacpra",
    "konrad": "Konrada",
    "maciej": "Macieja",
    "patryk": "Patryka",
    "szymon": "Szymona",
    "wiktor": "Wiktora",
    "adrian": "Adriana",
    "bartłomiej": "Bartłomieja",
    "błażej": "Błażeja",
    "igor": "Igora",
    "karol": "Karola",
    "krystian": "Krystiana",
    "mariusz": "Mariusza",
    "norbert": "Norberta",
    "oskar": "Oskara",
    "radosław": "Radosława",
    "stanisław": "Stanisława",
    "tadeusz": "Tadeusza",
    "zbigniew": "Zbigniewa",
  };
  
  if (femaleExceptions[nameLower]) {
    return femaleExceptions[nameLower];
  }
  
  if (maleExceptions[nameLower]) {
    return maleExceptions[nameLower];
  }
  
  // Apply general rules
  // Female names ending in -a → -y (most common)
  if (nameLower.endsWith("a")) {
    // Names ending in -ia → -ii
    if (nameLower.endsWith("ia")) {
      return nameTrimmed.slice(0, -1) + "i";
    }
    // Names ending in -ja → -i
    if (nameLower.endsWith("ja")) {
      return nameTrimmed.slice(0, -2) + "i";
    }
    // Names ending in -ga, -ka → -gi, -ki
    if (nameLower.endsWith("ga")) {
      return nameTrimmed.slice(0, -1) + "i";
    }
    if (nameLower.endsWith("ka")) {
      return nameTrimmed.slice(0, -1) + "i";
    }
    // Default -a → -y
    return nameTrimmed.slice(0, -1) + "y";
  }
  
  // Male names (not ending in -a) typically add -a
  return nameTrimmed + "a";
};

// Helper function to convert Polish city names to locative case (miejscownik)
const getCityInLocative = (city: string): string => {
  if (!city) return "Twoim mieście";
  return declineCityToLocative(city);
};

export const PresentationPreview = ({ data, currentSlide, includeAcademy = true }: PresentationPreviewProps) => {
  const totalSlides = includeAcademy ? 7 : 6;

  // Common header component
  const Header = ({ subtitle }: { subtitle: string }) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <img src={agencyLogo} alt="Aurine" className="w-12 h-12 object-contain" />
        <div>
          <p className="text-pink-400 font-semibold text-sm">AURINE AGENCY</p>
          <p className="text-zinc-500 text-xs">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
          <Flower2 className="w-4 h-4 text-pink-400/60" />
        </div>
        <div className="w-8 h-8 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
          <Heart className="w-4 h-4 text-fuchsia-400/60" />
        </div>
        <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <Sparkle className="w-4 h-4 text-rose-400/60" />
        </div>
      </div>
    </div>
  );

  // Common footer component
  const Footer = ({ activeSlide }: { activeSlide: number }) => (
    <div className="flex items-center justify-between mt-auto pt-4">
      <div className="flex items-center gap-2">
        <img src={agencyLogo} alt="Aurine" className="w-6 h-6 object-contain opacity-60" />
        <span className="text-zinc-600 text-xs">aurine.pl</span>
      </div>
      <div className="flex items-center gap-1.5">
        {[...Array(totalSlides)].map((_, i) => (
          <div key={i} className={`h-2 rounded-full transition-all ${i === activeSlide ? 'w-8 bg-gradient-to-r from-pink-500 to-fuchsia-500' : 'w-2 bg-zinc-700/50'}`} />
        ))}
      </div>
      <span className="text-zinc-600 text-xs">Marketing dla branży beauty</span>
    </div>
  );

  // Phone mockup with Facebook Ads for slide 1
  const PhoneFacebookAds = () => (
    <div className="absolute top-1/2 right-[12%] -translate-y-1/2">
      {/* Phone frame */}
      <div className="relative w-[280px] h-[560px] bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-[40px] p-3 shadow-2xl shadow-pink-500/20 border border-zinc-700">
        {/* Phone notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20" />
        
        {/* Screen */}
        <div className="w-full h-full bg-gradient-to-b from-zinc-950 to-black rounded-[32px] overflow-hidden relative">
          {/* Status bar */}
          <div className="h-10 bg-black/50 flex items-center justify-between px-6 pt-2">
            <span className="text-white text-[10px]">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 border border-white/60 rounded-sm">
                <div className="w-3/4 h-full bg-white/60 rounded-sm" />
              </div>
            </div>
          </div>
          
          {/* Facebook header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center gap-3">
            <Facebook className="w-6 h-6 text-white" />
            <span className="text-white font-bold text-sm">Menedżer reklam</span>
          </div>
          
          {/* Ad preview card */}
          <div className="p-3 space-y-3">
            <div className="bg-zinc-900/80 rounded-xl p-3 border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                  <Flower2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white text-[10px] font-semibold">{data.salonName || "Twój Salon"}</p>
                  <p className="text-zinc-500 text-[8px]">Sponsorowane</p>
                </div>
              </div>
              
              {/* Ad image placeholder */}
              <div className="w-full h-32 bg-gradient-to-br from-pink-500/30 via-fuchsia-500/20 to-rose-500/30 rounded-lg flex items-center justify-center mb-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%2220%22%20r%3D%221%22%20fill%3D%22rgba(255%2C255%2C255%2C0.1)%22%2F%3E%3C%2Fsvg%3E')] opacity-50" />
                <div className="text-center z-10">
                  <Scissors className="w-8 h-8 text-pink-300 mx-auto mb-1" />
                  <p className="text-white text-xs font-medium">Zabieg marzeń</p>
                  <p className="text-pink-300 text-[10px]">-30% do końca tygodnia</p>
                </div>
              </div>
              
              <p className="text-white text-[9px] mb-2">✨ Umów wizytę już dziś i odkryj prawdziwe piękno!</p>
              
              <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-lg py-2 text-center">
                <span className="text-white text-[10px] font-bold">Zarezerwuj teraz</span>
              </div>
            </div>
            
            {/* Stats preview */}
            <div className="bg-zinc-900/60 rounded-xl p-3 border border-emerald-500/20">
              <p className="text-emerald-400 text-[9px] font-medium mb-2">📊 Wyniki kampanii</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center">
                  <p className="text-white text-sm font-bold">2,547</p>
                  <p className="text-zinc-500 text-[8px]">Kliknięcia</p>
                </div>
                <div className="text-center">
                  <p className="text-pink-400 text-sm font-bold">142</p>
                  <p className="text-zinc-500 text-[8px]">Rezerwacje</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating elements around phone */}
      <div className="absolute -top-6 -left-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/30 to-blue-600/20 border border-blue-500/40 flex items-center justify-center shadow-lg">
        <Facebook className="w-7 h-7 text-blue-400" />
      </div>
      <div className="absolute -bottom-4 -left-8 w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/30 to-rose-500/20 border border-pink-500/40 flex items-center justify-center shadow-lg">
        <Instagram className="w-6 h-6 text-pink-400" />
      </div>
      <div className="absolute top-20 -right-6 w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg">
        <TrendingUp className="w-5 h-5 text-emerald-400" />
      </div>
      <div className="absolute bottom-24 -right-8 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 border border-amber-500/40 flex items-center justify-center shadow-lg">
        <Star className="w-6 h-6 text-amber-400" />
      </div>
      
      {/* Social media badges */}
      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
        <div className="px-3 py-1.5 bg-gradient-to-r from-blue-600/25 to-blue-500/15 rounded-lg border border-blue-500/35 flex items-center gap-1.5 backdrop-blur-sm">
          <Facebook className="w-4 h-4 text-blue-400" />
          <span className="text-blue-300 text-xs font-medium">Facebook</span>
        </div>
        <div className="px-3 py-1.5 bg-gradient-to-r from-pink-600/25 to-fuchsia-500/15 rounded-lg border border-pink-500/35 flex items-center gap-1.5 backdrop-blur-sm">
          <Instagram className="w-4 h-4 text-pink-400" />
          <span className="text-pink-300 text-xs font-medium">Instagram</span>
        </div>
      </div>
    </div>
  );

  // Centered beauty graphics cluster component for other slides
  const CenteredBeautyGraphics = () => (
    <div className="absolute top-1/2 right-[15%] -translate-y-1/2 w-[400px] h-[400px]">
      {/* Central large icon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-3xl bg-gradient-to-br from-pink-500/25 to-rose-500/15 border border-pink-500/30 flex items-center justify-center shadow-xl shadow-pink-500/10">
        <Flower2 className="w-14 h-14 text-pink-400" />
      </div>
      
      {/* Surrounding icons - evenly distributed */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/10 border border-fuchsia-500/25 flex items-center justify-center">
        <Heart className="w-8 h-8 text-fuchsia-400" />
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/25 flex items-center justify-center">
        <Star className="w-8 h-8 text-amber-400" />
      </div>
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/10 border border-rose-500/25 flex items-center justify-center">
        <Scissors className="w-8 h-8 text-rose-400" />
      </div>
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10 border border-purple-500/25 flex items-center justify-center">
        <Palette className="w-8 h-8 text-purple-400" />
      </div>
      
      {/* Diagonal corners */}
      <div className="absolute top-12 left-8 w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/15 to-rose-500/10 border border-pink-500/20 flex items-center justify-center">
        <Sparkle className="w-6 h-6 text-pink-400/80" />
      </div>
      <div className="absolute top-12 right-8 w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/15 to-pink-500/10 border border-rose-500/20 flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-rose-400/80" />
      </div>
      <div className="absolute bottom-12 left-8 w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500/15 to-purple-500/10 border border-fuchsia-500/20 flex items-center justify-center">
        <Award className="w-6 h-6 text-fuchsia-400/80" />
      </div>
      <div className="absolute bottom-12 right-8 w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/15 to-emerald-500/10 border border-teal-500/20 flex items-center justify-center">
        <ThumbsUp className="w-6 h-6 text-teal-400/80" />
      </div>
      
      {/* Social media badges centered below */}
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex gap-3">
        <div className="px-4 py-2 bg-gradient-to-r from-blue-600/20 to-blue-500/10 rounded-xl border border-blue-500/30 flex items-center gap-2 backdrop-blur-sm">
          <Facebook className="w-5 h-5 text-blue-400" />
          <span className="text-blue-300 text-sm font-medium">Facebook Ads</span>
        </div>
        <div className="px-4 py-2 bg-gradient-to-r from-pink-600/20 to-fuchsia-500/10 rounded-xl border border-pink-500/30 flex items-center gap-2 backdrop-blur-sm">
          <Instagram className="w-5 h-5 text-pink-400" />
          <span className="text-pink-300 text-sm font-medium">Instagram Ads</span>
        </div>
      </div>
    </div>
  );

  // Slide 1: Welcome - warm, personal introduction with phone mockup
  const Slide1 = () => (
    <div className="w-full h-full bg-gradient-to-br from-zinc-950 via-black to-zinc-950 relative overflow-hidden">
      {/* Rich background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-blue-500/15 via-pink-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-rose-500/15 via-pink-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-blue-600/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Phone with Facebook Ads mockup */}
      <PhoneFacebookAds />

      <div className="relative z-10 h-full flex flex-col px-16 py-10">
        <Header subtitle="Prezentacja dla Twojego salonu" />

        {/* Main content */}
        <div className="flex-1 flex flex-col justify-center max-w-[55%]">
          {/* Warm greeting */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500/15 to-fuchsia-500/10 rounded-full border border-pink-500/25 mb-6 w-fit">
            <Coffee className="w-4 h-4 text-pink-400" />
            <span className="text-pink-300 text-sm font-medium">Cześć {data.ownerName || "Droga Właścicielko"}!</span>
            <Heart className="w-4 h-4 text-pink-400" />
          </div>

          {/* Main headline - warm tone */}
          <h1 className="text-5xl font-black text-white leading-[1.2] mb-6">
            Facebook Ads dla<br />
            <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent">
              Twojego salonu w {getCityInLocative(data.city)}
            </span>
          </h1>

          <p className="text-lg text-zinc-300 leading-relaxed mb-8 max-w-xl">
            Codziennie dbasz o to, żeby Twoje klientki wychodziły szczęśliwe. 
            Zabiegi, grafik, zamówienia, media społecznościowe... 
            <span className="text-pink-300 font-medium"> A co z pozyskiwaniem nowych klientek?</span>
          </p>

          {/* Personal info card */}
          <div className="bg-gradient-to-br from-zinc-900/95 to-zinc-900/80 backdrop-blur rounded-2xl p-6 border border-pink-500/25 shadow-2xl shadow-pink-500/10 max-w-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/30 to-rose-500/20 border border-pink-500/40 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <p className="text-zinc-400 text-xs">Prezentacja przygotowana dla</p>
                <p className="text-2xl font-bold text-white">{declineNameToGenitive(data.ownerName)}</p>
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-pink-500/40 via-fuchsia-500/30 to-transparent mb-3" />
            <div className="flex items-center gap-4">
              <div>
                <p className="text-pink-400 font-semibold text-lg">{data.salonName || "Twój Salon"}</p>
                <p className="text-zinc-400 text-sm flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-pink-400/70" />
                  {data.city || "Twoje miasto"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Footer activeSlide={0} />
      </div>
    </div>
  );

  // Slide 2: Understanding challenges - empathetic, with graphics
  const Slide2 = () => (
    <div className="w-full h-full bg-gradient-to-br from-zinc-950 via-black to-zinc-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-br from-pink-500/15 via-transparent to-rose-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* Centered graphics cluster for challenges */}
      <div className="absolute top-1/2 right-[15%] -translate-y-1/2 w-[400px] h-[400px]">
        {/* Central large icon - showing frustration/challenge */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-3xl bg-gradient-to-br from-rose-500/25 to-pink-500/15 border border-rose-500/30 flex items-center justify-center shadow-xl shadow-rose-500/10">
          <Instagram className="w-14 h-14 text-rose-400" />
        </div>
        
        {/* Surrounding icons - evenly distributed */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-700/40 to-zinc-800/20 border border-zinc-600/25 flex items-center justify-center">
          <TrendingUp className="w-8 h-8 text-zinc-400 rotate-180" />
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/25 flex items-center justify-center">
          <Clock className="w-8 h-8 text-amber-400" />
        </div>
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/10 border border-pink-500/25 flex items-center justify-center">
          <Eye className="w-8 h-8 text-pink-400" />
        </div>
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/10 border border-fuchsia-500/25 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-fuchsia-400" />
        </div>
        
        {/* Diagonal corners */}
        <div className="absolute top-12 left-8 w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/15 to-pink-500/10 border border-rose-500/20 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-rose-400/80" />
        </div>
        <div className="absolute top-12 right-8 w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-600/15 to-zinc-700/10 border border-zinc-600/20 flex items-center justify-center">
          <Megaphone className="w-6 h-6 text-zinc-400/80" />
        </div>
        <div className="absolute bottom-12 left-8 w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/15 to-fuchsia-500/10 border border-pink-500/20 flex items-center justify-center">
          <Flower2 className="w-6 h-6 text-pink-400/80" />
        </div>
        <div className="absolute bottom-12 right-8 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-amber-400/80" />
        </div>
        
        {/* Stats badges centered below */}
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex gap-3">
          <div className="px-4 py-2 bg-gradient-to-r from-rose-600/20 to-red-500/10 rounded-xl border border-rose-500/30 flex items-center gap-2 backdrop-blur-sm">
            <TrendingUp className="w-5 h-5 text-rose-400 rotate-180" />
            <span className="text-rose-300 text-sm font-medium">-80% zasięgów</span>
          </div>
          <div className="px-4 py-2 bg-gradient-to-r from-zinc-600/20 to-zinc-500/10 rounded-xl border border-zinc-500/30 flex items-center gap-2 backdrop-blur-sm">
            <Eye className="w-5 h-5 text-zinc-400" />
            <span className="text-zinc-300 text-sm font-medium">5-10% widzi</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 h-full flex flex-col px-16 py-10">
        <Header subtitle="Rozumiemy Twoje wyzwania" />

        {/* Title */}
        <div className="mb-6">
          <h2 className="text-4xl font-black text-white mb-3">
            Czy to brzmi <span className="text-pink-400">znajomo</span>?
          </h2>
          <p className="text-lg text-zinc-300">
            Wiele właścicielek salonów w mniejszych miastach zmaga się z tymi samymi problemami...
          </p>
        </div>

        {/* Problems - left side */}
        <div className="flex-1 max-w-[55%] grid grid-cols-1 gap-3">
          <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/70 rounded-2xl px-5 py-4 border border-pink-500/25">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/30 to-rose-500/20 border border-pink-500/40 flex items-center justify-center flex-shrink-0">
                <Instagram className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1.5">Post <span className="text-pink-400">≠</span> reklama</h3>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Wrzucasz piękne zdjęcia zabiegów, ale algorytm pokazuje je tylko <span className="text-pink-400 font-semibold">5-10%</span> Twoich obserwujących. 
                  Cała reszta nawet nie wie, że coś publikujesz.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/70 rounded-2xl px-5 py-4 border border-pink-500/25">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/30 to-rose-500/20 border border-pink-500/40 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1.5">Organiczne zasięgi to przeszłość</h3>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Kiedyś wystarczyło regularnie postować. Dziś zasięgi organiczne <span className="text-pink-400 font-semibold">spadły o 80%</span>. 
                  Bez płatnej promocji trudno dotrzeć do nowych osób.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/70 rounded-2xl px-5 py-4 border border-pink-500/25">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/30 to-rose-500/20 border border-pink-500/40 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1.5">Brak czasu i wiedzy technicznej</h3>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Między zabiegami, zamówieniami i grafikiem nie ma czasu na naukę Menedżera reklam. 
                  A kliknięcie <span className="text-pink-400 font-semibold">"Promuj post"</span> to często przepalone pieniądze.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Hopeful message */}
        <div className="mt-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 rounded-2xl p-4 border border-emerald-500/25 max-w-[55%]">
          <p className="text-base text-zinc-200 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>
              W {getCityInLocative(data.city)} wciąż <span className="text-emerald-400 font-semibold">niewiele salonów</span> korzysta 
              z reklam na Facebooku. To idealna okazja, żeby się wyróżnić i <span className="text-white font-semibold">przyciągnąć nowe klientki, zanim zrobi to konkurencja</span>.
            </span>
          </p>
        </div>

        <Footer activeSlide={1} />
      </div>
    </div>
  );

  // Slide 3: How we help - the solution with testimonials
  const Slide3 = () => (
    <div className="w-full h-full bg-gradient-to-br from-zinc-950 via-black to-zinc-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-1/4 w-[700px] h-[700px] bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[800px] h-[800px] bg-gradient-to-tl from-pink-500/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="relative z-10 h-full flex flex-col px-16 py-10">
        <Header subtitle="Jak możemy Ci pomóc" />

        {/* Title */}
        <div className="mb-5">
          <h2 className="text-4xl font-black text-white mb-2">
            Reklamy, które <span className="text-pink-400">naprawdę działają</span>
          </h2>
          <p className="text-lg text-zinc-300">
            Zajmujemy się Twoimi reklamami od A do Z. Ty możesz skupić się na dbaniu o klientki
          </p>
        </div>

        {/* Main content - 3 columns */}
        <div className="flex-1 grid grid-cols-3 gap-5">
          {/* Column 1: Benefits */}
          <div className="space-y-3">
            {[
              { 
                icon: Target, 
                title: "Precyzyjne dotarcie", 
                desc: "Reklamy trafiają do kobiet 25-45 lat, zainteresowanych urodą, w promieniu 15 km od Ciebie",
                color: "from-pink-500/30 to-rose-500/20",
                borderColor: "border-pink-500/30"
              },
              { 
                icon: Eye, 
                title: "Tysiące wyświetleń", 
                desc: "Zamiast 50 osób, Twoją reklamę zobaczy nawet kilka tysięcy potencjalnych klientek",
                color: "from-blue-500/30 to-indigo-500/20",
                borderColor: "border-blue-500/30"
              },
              { 
                icon: Sparkles, 
                title: "Piękne kreacje", 
                desc: "Projektujemy grafiki i teksty zgodne z estetyką Twojego salonu",
                color: "from-fuchsia-500/30 to-purple-500/20",
                borderColor: "border-fuchsia-500/30"
              },
              { 
                icon: BarChart3, 
                title: "Przejrzyste raporty", 
                desc: "Co miesiąc jasny raport: zasięgi, kliknięcia, koszty. Zero zagadek",
                color: "from-emerald-500/30 to-teal-500/20",
                borderColor: "border-emerald-500/30"
              },
            ].map((item, idx) => (
              <div key={idx} className={`bg-gradient-to-br from-zinc-900/90 to-zinc-900/70 rounded-xl p-4 border ${item.borderColor}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center border border-white/10 flex-shrink-0`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-bold mb-0.5">{item.title}</p>
                    <p className="text-zinc-400 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Column 2: Phone mockup with successful ad */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-56 h-[380px] bg-zinc-900 rounded-[36px] p-1.5 shadow-2xl shadow-pink-500/15 border border-zinc-700">
                <div className="w-full h-full bg-black rounded-[30px] overflow-hidden relative">
                  <div className="bg-gradient-to-r from-pink-600/20 to-fuchsia-600/20 px-3 py-2 flex items-center justify-between border-b border-pink-500/20">
                    <Instagram className="w-4 h-4 text-pink-400" />
                    <span className="text-xs font-semibold text-white truncate max-w-[100px]">{data.salonName || "beauty studio"}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                  </div>
                  
                  <div className="px-3 py-1.5 flex items-center justify-between bg-zinc-900/50">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                        <Flower2 className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-xs text-white font-medium">{data.salonName || "beauty studio"}</span>
                    </div>
                    <span className="text-[10px] text-pink-400 font-medium">Sponsorowane</span>
                  </div>
                  
                  <div className="aspect-square bg-gradient-to-br from-pink-900/50 via-zinc-900 to-fuchsia-900/40 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(236,72,153,0.3),transparent_60%)]" />
                    <div className="text-center p-4 relative z-10">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/40">
                        <Sparkles className="w-7 h-7 text-white" />
                      </div>
                      <p className="text-pink-300 font-bold text-base mb-1">-20% na pierwszy zabieg</p>
                      <p className="text-zinc-400 text-xs">Zarezerwuj online</p>
                    </div>
                  </div>
                  
                  <div className="p-3 space-y-1.5">
                    <div className="flex items-center gap-3">
                      <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                      <MessageCircle className="w-5 h-5 text-zinc-500" />
                      <Send className="w-5 h-5 text-zinc-500" />
                    </div>
                    <p className="text-xs text-white font-semibold">2,847 polubień</p>
                  </div>
                </div>
              </div>

              {/* Floating positive stats */}
              <div className="absolute -left-20 top-10 bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 backdrop-blur rounded-xl p-3 border border-emerald-500/30">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-6 h-6 text-emerald-400" />
                  <div>
                    <p className="text-[10px] text-zinc-400">Nowe klientki</p>
                    <p className="text-lg font-bold text-emerald-400">+24</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-16 top-28 bg-gradient-to-br from-blue-500/15 to-blue-500/5 backdrop-blur rounded-xl p-3 border border-blue-500/30">
                <div className="flex items-center gap-2">
                  <Eye className="w-6 h-6 text-blue-400" />
                  <div>
                    <p className="text-[10px] text-zinc-400">Zasięg</p>
                    <p className="text-lg font-bold text-white">12,400</p>
                  </div>
                </div>
              </div>
              <div className="absolute -left-16 bottom-16 bg-gradient-to-br from-pink-500/15 to-pink-500/5 backdrop-blur rounded-xl p-3 border border-pink-500/30">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-pink-400" />
                  <div>
                    <p className="text-[10px] text-zinc-400">CTR</p>
                    <p className="text-lg font-bold text-pink-400">4.2%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Testimonials */}
          <div className="space-y-3">
            <p className="text-sm text-pink-400 font-semibold mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 fill-pink-400" />
              Co mówią nasze klientki
            </p>
            
            {[
              {
                name: "Magda",
                salon: "Studio Urody Magda",
                city: "Nowy Sącz",
                text: "Po 2 miesiącach współpracy mam pełny grafik! Polecam każdej właścicielce salonu.",
                avatar: "M"
              },
              {
                name: "Karolina",
                salon: "Beauty by Karo",
                city: "Tarnów",
                text: "Wreszcie ktoś, kto rozumie branżę beauty. Reklamy są piękne i skuteczne!",
                avatar: "K"
              },
              {
                name: "Anna",
                salon: "Salon Piękności Anna",
                city: "Gorlice",
                text: "Bałam się płatnych reklam, ale ekipa Aurine wszystko wytłumaczyła. Teraz co tydzień mam nowe klientki.",
                avatar: "A"
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-gradient-to-br from-zinc-900/95 to-zinc-900/80 rounded-xl p-4 border border-pink-500/15">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {testimonial.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-zinc-300 text-xs leading-relaxed mb-2 italic">"{testimonial.text}"</p>
                    <div>
                      <p className="text-white text-xs font-semibold">{testimonial.name}</p>
                      <p className="text-zinc-500 text-[10px]">{testimonial.salon}, {testimonial.city}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Footer activeSlide={2} />
      </div>
    </div>
  );

  // Slide 4: Cooperation process with visuals
  const Slide4 = () => (
    <div className="w-full h-full bg-gradient-to-br from-zinc-950 via-black to-zinc-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-gradient-to-br from-pink-500/10 via-transparent to-fuchsia-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 right-20 w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
        <Flower2 className="w-8 h-8 text-pink-400/50" />
      </div>
      <div className="absolute bottom-32 right-28 w-12 h-12 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
        <Heart className="w-6 h-6 text-fuchsia-400/50" />
      </div>

      <div className="relative z-10 h-full flex flex-col px-16 py-10">
        <Header subtitle="Jak wygląda współpraca" />

        {/* Title */}
        <div className="mb-6">
          <h2 className="text-4xl font-black text-white mb-2">
            Prosty i <span className="text-pink-400">przejrzysty</span> proces
          </h2>
          <p className="text-lg text-zinc-300">Bez skomplikowanych umów i niezrozumiałych terminów</p>
        </div>

        {/* Process steps - horizontal */}
        <div className="flex-1 flex items-center">
          <div className="w-full grid grid-cols-4 gap-4 relative">
            {/* Connection line */}
            <div className="absolute top-14 left-[8%] right-[8%] h-0.5 bg-gradient-to-r from-pink-500/40 via-fuchsia-500/40 to-pink-500/40" />

            {[
              { 
                num: "01", 
                icon: Coffee, 
                title: "Rozmowa", 
                desc: "Poznajemy Twój salon, klientki i cele. Bez zobowiązań.", 
                details: ["Analiza profilu", "Określenie grupy", "Ustalenie budżetu"],
                color: "from-pink-500/30 to-rose-500/20"
              },
              { 
                num: "02", 
                icon: FileText, 
                title: "Strategia", 
                desc: "Przygotowujemy plan dopasowany do Twojego salonu.", 
                details: ["Kreacje reklamowe", "Teksty i grafiki", "Harmonogram"],
                color: "from-fuchsia-500/30 to-purple-500/20"
              },
              { 
                num: "03", 
                icon: Rocket, 
                title: "Start", 
                desc: "Uruchamiamy kampanie. Ty nie musisz nic robić.", 
                details: ["Konfiguracja", "Targetowanie", "Optymalizacja"],
                color: "from-blue-500/30 to-indigo-500/20"
              },
              { 
                num: "04", 
                icon: LineChart, 
                title: "Wyniki", 
                desc: "Co miesiąc raport z wynikami i rekomendacjami.", 
                details: ["Zasięgi", "Koszty", "Kolejne kroki"],
                color: "from-emerald-500/30 to-teal-500/20"
              },
            ].map((step, idx) => (
              <div key={idx} className="relative">
                {/* Step icon circle */}
                <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${step.color} border border-white/20 flex items-center justify-center relative z-10`}>
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                
                {/* Card */}
                <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/70 rounded-xl p-4 border border-zinc-700/50 h-[calc(100%-72px)]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-pink-500 bg-pink-500/15 px-2 py-0.5 rounded-full">{step.num}</span>
                    <h3 className="text-base font-bold text-white">{step.title}</h3>
                  </div>
                  <p className="text-xs text-zinc-300 mb-3 leading-relaxed">{step.desc}</p>
                  <div className="space-y-1.5">
                    {step.details.map((detail, didx) => (
                      <div key={didx} className="flex items-center gap-2 text-xs text-zinc-400">
                        <CheckCircle className="w-3.5 h-3.5 text-pink-400" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom - no contracts message */}
        <div className="mt-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 rounded-xl p-4 border border-emerald-500/25">
          <p className="text-base text-center text-zinc-200 flex items-center justify-center gap-3">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span>
              <span className="text-emerald-400 font-bold">Bez umów na rok.</span> Współpracujemy miesiąc do miesiąca. 
              <span className="text-white font-medium"> Możesz zrezygnować kiedy chcesz.</span>
            </span>
          </p>
        </div>

        <Footer activeSlide={3} />
      </div>
    </div>
  );

  // Slide 5: Aurine Academy - styled like other slides with phone mockup
  const Slide5 = () => (
    <div className="w-full h-full bg-gradient-to-br from-zinc-950 via-black to-zinc-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-1/4 w-[700px] h-[700px] bg-gradient-to-br from-fuchsia-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[800px] h-[800px] bg-gradient-to-tl from-pink-500/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="relative z-10 h-full flex flex-col px-16 py-10">
        <Header subtitle="Bonus w cenie współpracy" />

        {/* Title */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-500/10 rounded-full border border-amber-500/30 mb-3">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-amber-300 font-bold text-xs tracking-wide">JEDYNE TAKIE ROZWIĄZANIE W POLSCE</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-2">
            Aurine <span className="text-pink-400">Academy</span>
          </h2>
          <p className="text-lg text-zinc-300">
            Autorska aplikacja mobilna dla właścicielek salonów — <span className="text-white font-semibold">tylko dla naszych klientek</span>
          </p>
        </div>

        {/* Main content - 3 columns like Slide 3 */}
        <div className="flex-1 grid grid-cols-3 gap-5">
          {/* Column 1: Features */}
          <div className="space-y-3">
            {[
              { 
                icon: GraduationCap, 
                title: "13 kursów video", 
                desc: "Marketing organiczny, content, sprzedaż, budowanie relacji z klientkami — od podstaw do eksperta",
                color: "from-pink-500/30 to-rose-500/20",
                borderColor: "border-pink-500/30"
              },
              { 
                icon: Wand2, 
                title: "Narzędzia AI", 
                desc: "Generator strategii, kalendarz postów, szablony grafik — AI pracuje za Ciebie",
                color: "from-fuchsia-500/30 to-purple-500/20",
                borderColor: "border-fuchsia-500/30"
              },
              { 
                icon: FileText, 
                title: "Dokumenty online", 
                desc: "Faktury, raporty, umowa — wszystko w jednym miejscu, dostępne 24/7",
                color: "from-blue-500/30 to-indigo-500/20",
                borderColor: "border-blue-500/30"
              },
              { 
                icon: Eye, 
                title: "Status kampanii", 
                desc: "Podgląd na żywo czy kampania działa, kto jest Twoim opiekunem, jakie są wyniki",
                color: "from-emerald-500/30 to-teal-500/20",
                borderColor: "border-emerald-500/30"
              },
            ].map((item, idx) => (
              <div key={idx} className={`bg-gradient-to-br from-zinc-900/90 to-zinc-900/70 rounded-xl p-4 border ${item.borderColor}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center border border-white/10 flex-shrink-0`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-bold mb-0.5">{item.title}</p>
                    <p className="text-zinc-400 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Column 2: Phone mockup */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-56 h-[380px] bg-zinc-900 rounded-[36px] p-1.5 shadow-2xl shadow-fuchsia-500/20 border border-zinc-700">
                <div className="w-full h-full bg-black rounded-[30px] overflow-hidden relative">
                  {/* App header */}
                  <div className="bg-gradient-to-r from-pink-600/30 to-fuchsia-600/20 px-3 py-2.5 flex items-center justify-between border-b border-pink-500/20">
                    <div className="flex items-center gap-2">
                      <img src={agencyLogo} alt="Aurine" className="w-5 h-5 object-contain" />
                      <span className="text-xs font-bold text-white">Aurine Academy</span>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-[8px] font-bold">
                      {data.ownerName?.charAt(0) || "A"}
                    </div>
                  </div>
                  
                  {/* Dashboard content */}
                  <div className="p-3 space-y-2.5">
                    {/* Campaign status */}
                    <div className="bg-gradient-to-r from-emerald-500/15 to-teal-500/10 rounded-xl p-2.5 border border-emerald-500/25">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-emerald-400 text-[10px] font-semibold">Kampania aktywna</span>
                        </div>
                        <span className="text-zinc-500 text-[9px]">od 12.01</span>
                      </div>
                    </div>

                    {/* Courses section */}
                    <div>
                      <p className="text-zinc-500 text-[9px] mb-1.5 px-1">Twoje kursy</p>
                      <div className="space-y-1.5">
                        {[
                          { name: "Marketing organiczny", progress: 75 },
                          { name: "Tworzenie contentu", progress: 45 },
                          { name: "Sprzedaż usług", progress: 20 },
                        ].map((course, idx) => (
                          <div key={idx} className="bg-zinc-900/80 rounded-lg px-2.5 py-2 border border-zinc-800">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-white text-[9px] font-medium">{course.name}</span>
                              <span className="text-pink-400 text-[8px]">{course.progress}%</span>
                            </div>
                            <div className="w-full h-1 bg-zinc-800 rounded-full">
                              <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full" style={{ width: `${course.progress}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Tools section */}
                    <div className="bg-gradient-to-br from-fuchsia-500/15 to-purple-500/10 rounded-xl p-2.5 border border-fuchsia-500/25">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Wand2 className="w-3 h-3 text-fuchsia-400" />
                        <span className="text-white text-[9px] font-semibold">Narzędzia AI</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { icon: Sparkles, label: "Strategia" },
                          { icon: Calendar, label: "Kalendarz" },
                          { icon: Image, label: "Grafiki" },
                        ].map((tool, idx) => (
                          <div key={idx} className="bg-black/40 rounded-lg p-1.5 text-center border border-fuchsia-500/20">
                            <tool.icon className="w-3.5 h-3.5 text-fuchsia-300 mx-auto mb-0.5" />
                            <span className="text-zinc-400 text-[7px]">{tool.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating badges around phone */}
              <div className="absolute -top-4 -left-6 px-3 py-1.5 bg-gradient-to-r from-pink-500/30 to-rose-500/20 rounded-xl border border-pink-500/40 flex items-center gap-1.5 shadow-lg">
                <Play className="w-4 h-4 text-pink-400" />
                <span className="text-pink-300 text-xs font-medium">75 lekcji HD</span>
              </div>
              <div className="absolute -bottom-3 -left-8 px-3 py-1.5 bg-gradient-to-r from-fuchsia-500/30 to-purple-500/20 rounded-xl border border-fuchsia-500/40 flex items-center gap-1.5 shadow-lg">
                <Layout className="w-4 h-4 text-fuchsia-400" />
                <span className="text-fuchsia-300 text-xs font-medium">Szablony</span>
              </div>
              <div className="absolute top-16 -right-6 px-3 py-1.5 bg-gradient-to-r from-emerald-500/30 to-teal-500/20 rounded-xl border border-emerald-500/40 flex items-center gap-1.5 shadow-lg">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 text-xs font-medium">24/7</span>
              </div>
            </div>
          </div>

          {/* Column 3: Why unique */}
          <div className="flex flex-col justify-center space-y-4">
            <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/70 rounded-2xl p-5 border border-pink-500/25">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/30 to-rose-500/20 border border-pink-500/40 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Dlaczego to unikalne?</h3>
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                Przeszukaj cały rynek agencji marketingowych dla branży beauty w Polsce. 
                <span className="text-pink-400 font-semibold"> Żadna inna nie oferuje własnej aplikacji</span> z kursami, 
                narzędziami AI i dostępem do dokumentów.
              </p>
              <p className="text-zinc-400 text-sm">
                To nasza autorska platforma — pracowaliśmy nad nią ponad rok. 
                <span className="text-white font-medium"> Teraz jest Twoja, w cenie współpracy.</span>
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-pink-500/15 to-rose-500/10 rounded-xl p-3 border border-pink-500/20 text-center">
                <p className="text-2xl font-black text-pink-400">13</p>
                <p className="text-zinc-400 text-xs">kursów video</p>
              </div>
              <div className="bg-gradient-to-br from-fuchsia-500/15 to-purple-500/10 rounded-xl p-3 border border-fuchsia-500/20 text-center">
                <p className="text-2xl font-black text-fuchsia-400">75</p>
                <p className="text-zinc-400 text-xs">lekcji HD</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/15 to-indigo-500/10 rounded-xl p-3 border border-blue-500/20 text-center">
                <p className="text-2xl font-black text-blue-400">4</p>
                <p className="text-zinc-400 text-xs">narzędzia AI</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500/15 to-teal-500/10 rounded-xl p-3 border border-emerald-500/20 text-center">
                <p className="text-2xl font-black text-emerald-400">∞</p>
                <p className="text-zinc-400 text-xs">szablonów</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom - included message */}
        <div className="mt-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 rounded-2xl p-4 border border-emerald-500/25">
          <p className="text-base text-center text-zinc-200 flex items-center justify-center gap-3">
            <Gift className="w-5 h-5 text-emerald-400" />
            <span>
              <span className="text-emerald-400 font-bold">W cenie współpracy.</span> Bez dodatkowych opłat. 
              <span className="text-white font-medium"> Dostajesz dostęp od pierwszego dnia.</span>
            </span>
          </p>
        </div>

        <Footer activeSlide={4} />
      </div>
    </div>
  );

  // Slide 6: Special offer - irresistible with more graphics
  const Slide6 = () => (
    <div className="w-full h-full bg-gradient-to-br from-zinc-950 via-black to-zinc-950 relative overflow-hidden">
      {/* Rich celebratory background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-br from-pink-500/20 via-fuchsia-500/15 to-rose-500/20 rounded-full blur-3xl" />
        <div className="absolute top-10 right-20 w-[300px] h-[300px] bg-gradient-to-br from-amber-500/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* Celebratory decorations */}
      <Sparkle className="absolute top-20 left-24 w-8 h-8 text-pink-400/40" />
      <Star className="absolute top-28 right-32 w-6 h-6 text-amber-400/40 fill-amber-400/40" />
      <Sparkle className="absolute bottom-36 left-36 w-6 h-6 text-fuchsia-400/40" />
      <Star className="absolute bottom-28 right-24 w-8 h-8 text-pink-400/40 fill-pink-400/40" />
      <Gift className="absolute top-1/3 right-16 w-10 h-10 text-amber-400/30" />
      <Heart className="absolute bottom-1/3 left-20 w-8 h-8 text-pink-400/30" />

      <div className="relative z-10 h-full flex flex-col px-16 py-10">
        <Header subtitle="Specjalna oferta" />

        {/* Title */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/10 rounded-full border border-amber-500/30 mb-3">
            <Gift className="w-4 h-4 text-amber-400" />
            <span className="text-amber-300 text-sm font-medium">Porozmawiajmy</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <h2 className="text-4xl font-black text-white mb-2">
            Specjalnie dla <span className="bg-gradient-to-r from-pink-400 to-fuchsia-400 bg-clip-text text-transparent">{data.salonName ? declineSalonNameToGenitive(data.salonName) : "Twojego salonu"}</span>
          </h2>
          <p className="text-lg text-zinc-300">
            Chcemy, żebyś mogła sprawdzić jak działamy. <span className="text-pink-300">Bez żadnego ryzyka</span>
          </p>
        </div>

        {/* Offers - 2 or 3 depending on Academy toggle */}
        <div className="flex-1 flex gap-5 items-center justify-center">
          {/* Free audit */}
          <div className={`${includeAcademy ? 'w-[320px]' : 'w-[380px]'} bg-gradient-to-br from-zinc-900/95 to-zinc-900/80 rounded-2xl p-5 border-2 border-pink-500/30 shadow-2xl shadow-pink-500/10 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-pink-500/20 to-transparent rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/30 to-fuchsia-500/20 border border-pink-500/40 flex items-center justify-center">
                  <Search className="w-6 h-6 text-pink-400" />
                </div>
                <span className="px-2.5 py-1 bg-pink-500/20 rounded-full text-pink-400 text-xs font-bold">GRATIS</span>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2">Darmowy audyt profilu</h3>
              <p className="text-zinc-300 text-xs leading-relaxed mb-3">
                Przeanalizujemy Twój Instagram i Facebook, pokażemy co poprawić. <span className="text-pink-300">Bez zobowiązań.</span>
              </p>
              
              <div className="space-y-1.5">
                {["Analiza profilu i postów", "Wskazówki do poprawy", "Rekomendacje hashtagów"].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                    <CheckCircle className="w-3.5 h-3.5 text-pink-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Free trial week */}
          <div className={`${includeAcademy ? 'w-[320px]' : 'w-[380px]'} bg-gradient-to-br from-amber-500/10 via-zinc-900/95 to-zinc-900/80 rounded-2xl p-5 border-2 border-amber-500/40 shadow-2xl shadow-amber-500/10 relative`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-500/25 to-transparent rounded-full blur-2xl" />
            
            {/* Special badge */}
            <div className="absolute -top-3 right-4 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-black text-[10px] font-bold shadow-lg flex items-center gap-1 z-20">
              <Star className="w-3 h-3 fill-black" />
              <span>2 SALONY Z MIASTA</span>
            </div>
            
            <div className="relative z-10 mt-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 border border-amber-500/40 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-amber-400" />
                </div>
                <span className="px-2.5 py-1 bg-amber-500/20 rounded-full text-amber-400 text-xs font-bold">GRATIS</span>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2">Darmowy tydzień próbny</h3>
              <p className="text-zinc-300 text-xs leading-relaxed mb-3">
                Dla <span className="text-amber-400 font-semibold">2 pierwszych salonów z {data.city ? declineCityToGenitive(data.city) : "miasta"}</span> - kampania za darmo.
              </p>
              
              <div className="space-y-1.5">
                {["Pełna konfiguracja kampanii", "7 dni aktywnej promocji", "Raport z wynikami"].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                    <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Aurine Academy bonus - only show when Academy is enabled */}
          {includeAcademy && (
            <div className="w-[320px] bg-gradient-to-br from-rose-500/10 via-zinc-900/95 to-zinc-900/80 rounded-2xl p-5 border-2 border-rose-500/30 shadow-2xl shadow-rose-500/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-rose-500/20 to-transparent rounded-full blur-2xl" />
              
              {/* Bonus badge */}
              <div className="absolute top-3 right-3 px-3 py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full text-white text-[10px] font-bold shadow-lg flex items-center gap-1 z-20">
                <Sparkles className="w-3 h-3" />
                <span>W CENIE</span>
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/30 to-pink-500/20 border border-rose-500/40 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-rose-400" />
                  </div>
                  <span className="px-2.5 py-1 bg-rose-500/20 rounded-full text-rose-400 text-xs font-bold">BONUS</span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2">Aurine Academy</h3>
                <p className="text-zinc-300 text-xs leading-relaxed mb-3">
                  Aplikacja mobilna z <span className="text-rose-400 font-semibold">13 kursami i 75 lekcjami</span> o marketingu dla salonów beauty.
                </p>
                
                <div className="space-y-1.5">
                  {["Kursy o marketingu organicznym", "Generator strategii AI", "Kalendarz postów i szablony"].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                      <CheckCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom message */}
        <div className="mt-4 bg-gradient-to-r from-pink-500/10 via-fuchsia-500/10 to-pink-500/10 rounded-xl p-4 border border-pink-500/25 text-center">
          <p className="text-base text-zinc-200">
            <Heart className="w-4 h-4 text-pink-400 inline mr-2" />
            <span className="text-white font-semibold">Nie masz nic do stracenia.</span> Sprawdź, jak możemy pomóc Twojemu salonowi!
          </p>
        </div>

        <Footer activeSlide={includeAcademy ? 5 : 4} />
      </div>
    </div>
  );

  // Slide 7: Contact & CTA - warm and inviting
  const Slide7 = () => (
    <div className="w-full h-full bg-gradient-to-br from-zinc-950 via-black to-zinc-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-gradient-to-br from-pink-500/20 via-fuchsia-500/15 to-rose-500/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* Decorative beauty elements */}
      <div className="absolute top-16 left-20 w-20 h-20 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
        <Flower2 className="w-10 h-10 text-pink-400/50" />
      </div>
      <div className="absolute bottom-24 left-28 w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
        <Facebook className="w-7 h-7 text-blue-400/50" />
      </div>
      <div className="absolute top-28 right-24 w-16 h-16 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
        <Heart className="w-8 h-8 text-rose-400/50" />
      </div>
      <div className="absolute bottom-32 right-32 w-18 h-18 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
        <Sparkle className="w-8 h-8 text-amber-400/50" />
      </div>
      <div className="absolute top-1/2 right-16 w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
        <Palette className="w-6 h-6 text-pink-400/50" />
      </div>
      <div className="absolute top-1/3 left-32 w-10 h-10 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
        <Star className="w-5 h-5 text-fuchsia-400/50 fill-fuchsia-400/50" />
      </div>
      <div className="absolute bottom-1/3 left-16 w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        <Scissors className="w-6 h-6 text-amber-400/50" />
      </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-16 py-10">
        {/* Logo */}
        <img src={agencyLogo} alt="Aurine" className="w-20 h-20 object-contain mb-4" />
        
        {/* Main headline - warm */}
        <h2 className="text-4xl font-black text-white text-center mb-3">
          Porozmawiajmy o <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent">Twoim salonie</span>
        </h2>
        
        <p className="text-lg text-zinc-300 text-center max-w-2xl mb-8">
          Chętnie opowiemy więcej o tym, jak możemy pomóc {data.salonName || "Twojemu salonowi"}. 
          Napisz lub zadzwoń. <span className="text-pink-300">Odpowiemy na wszystkie pytania!</span>
        </p>

        {/* Contact cards */}
        <div className="flex gap-4 mb-8">
          <div className="bg-gradient-to-br from-zinc-900/95 to-zinc-900/80 rounded-xl p-4 border border-pink-500/25 flex items-center gap-3 min-w-[200px]">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500/30 to-rose-500/20 border border-pink-500/40 flex items-center justify-center">
              <Mail className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs mb-0.5">Email</p>
              <p className="text-white font-semibold text-sm">kontakt@aurine.pl</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-zinc-900/95 to-zinc-900/80 rounded-xl p-4 border border-blue-500/25 flex items-center gap-3 min-w-[200px]">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/20 border border-blue-500/40 flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs mb-0.5">Telefon / WhatsApp</p>
              <p className="text-white font-semibold text-sm">+48 731 856 524</p>
            </div>
          </div>


          <div className="bg-gradient-to-br from-zinc-900/95 to-zinc-900/80 rounded-xl p-4 border border-fuchsia-500/25 flex items-center gap-3 min-w-[200px]">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-fuchsia-500/30 to-purple-500/20 border border-fuchsia-500/40 flex items-center justify-center">
              <Globe className="w-5 h-5 text-fuchsia-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs mb-0.5">Strona</p>
              <p className="text-white font-semibold text-sm">aurine.pl</p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="bg-gradient-to-r from-pink-500 via-fuchsia-500 to-rose-500 rounded-xl p-0.5 mb-8">
          <div className="bg-gradient-to-r from-pink-500 via-fuchsia-500 to-rose-500 rounded-[10px] px-10 py-4 flex items-center gap-3">
            <span className="text-white font-bold text-lg">Umów się na darmową rozmowę</span>
            <ArrowRight className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Bottom reminder */}
        <div className="flex items-center gap-5 text-zinc-400 text-sm">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-400" />
            <span>Darmowy tydzień próbny</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-zinc-600" />
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-pink-400" />
            <span>Darmowy audyt profilu</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-zinc-600" />
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Bez umów na rok</span>
          </div>
        </div>

        {/* Footer positioned at bottom */}
        <div className="absolute bottom-6 left-16 right-16">
          <Footer activeSlide={includeAcademy ? 6 : 5} />
        </div>
      </div>
    </div>
  );

  // Build slides array based on whether Academy is included
  const slides = includeAcademy 
    ? [Slide1, Slide2, Slide3, Slide4, Slide5, Slide6, Slide7]
    : [Slide1, Slide2, Slide3, Slide4, Slide6, Slide7]; // Skip Slide5 (Academy)
  const CurrentSlideComponent = slides[currentSlide - 1] || Slide1;

  return (
    <div 
      id="presentation-preview" 
      className="w-[1600px] h-[900px] overflow-hidden bg-black"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <CurrentSlideComponent />
    </div>
  );
};

import agencyLogo from "@/assets/agency-logo.png";

interface ContractData {
  clientName: string;
  clientOwnerName: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;
  clientNip: string;
  signDate: string;
  signCity: string;
  contractValue: string;
  paymentType: "split50" | "split30" | "full";
  agencyName: string;
  agencyOwnerName: string;
  agencyAddress: string;
  agencyPhone: string;
  agencyEmail: string;
  agencyNip: string;
}

interface ContractPreviewProps {
  data: ContractData;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("pl-PL", { day: "2-digit", month: "long", year: "numeric" });
};

const formatAmount = (amount: string) => {
  if (!amount) return "0";
  const num = parseFloat(amount);
  return num.toLocaleString("pl-PL", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

// Decorative components
const GradientOrbs = () => (
  <>
    <div className="absolute top-0 right-0 w-[350px] h-[350px] rounded-full bg-gradient-to-br from-pink-500/20 via-fuchsia-500/10 to-transparent blur-[80px]" />
    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-purple-500/15 via-pink-500/10 to-transparent blur-[80px]" />
  </>
);

const FloatingShapes = () => (
  <>
    <div className="absolute top-8 right-16 w-12 h-12 border border-pink-500/20 rounded-full" />
    <div className="absolute bottom-20 left-8 w-8 h-8 border border-fuchsia-500/15 rounded-xl rotate-12" />
  </>
);

const DotsPattern = ({ className = "" }: { className?: string }) => (
  <div className={`absolute opacity-20 ${className}`}>
    <div className="grid grid-cols-3 gap-1.5">
      {[...Array(9)].map((_, i) => (
        <div key={i} className="w-0.5 h-0.5 rounded-full bg-pink-400" />
      ))}
    </div>
  </div>
);

// Page wrapper component
const PageWrapper = ({ children, pageNumber }: { children: React.ReactNode; pageNumber: number }) => (
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
        <p className="text-[9px] text-zinc-600">Strona {pageNumber} z 2</p>
      </div>
    </div>
  </div>
);

// Section component
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-2">
    <p className="text-[9px] text-pink-400 font-semibold mb-1">{title}</p>
    {children}
  </div>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="text-[7.5px] text-zinc-400 leading-relaxed space-y-0.5">
    {items.map((item, i) => (
      <li key={i} className="flex gap-1">
        <span className="text-pink-400/60">•</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export const ContractPreview = ({ data }: ContractPreviewProps) => {
  return (
    <div id="contract-preview" className="flex flex-col gap-4">
      {/* PAGE 1 */}
      <PageWrapper pageNumber={1}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-pink-500/30 blur-lg rounded-full" />
              <img src={agencyLogo} alt="Aurine" className="relative w-8 h-8 object-contain" />
            </div>
            <div>
              <p className="text-sm font-semibold bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent">
                Aurine
              </p>
              <p className="text-[8px] text-zinc-500">Marketing dla salonów beauty</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-gradient-to-r from-pink-500/20 to-fuchsia-500/20 border border-pink-500/30 rounded-lg">
            <span className="text-white text-xs font-semibold">Umowa o świadczenie usług marketingowych</span>
          </div>
        </div>

        {/* Date and City */}
        <div className="flex gap-3 mb-3">
          <div className="flex items-center gap-2 px-2 py-1.5 bg-zinc-800/40 border border-zinc-700/50 rounded-lg">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-pink-500/20 to-fuchsia-500/20 flex items-center justify-center">
              <svg className="w-3 h-3 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <p className="text-[8px] text-zinc-500 uppercase tracking-wider">Data zawarcia</p>
              <p className="text-white font-medium text-[10px]">{formatDate(data.signDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 bg-zinc-800/40 border border-zinc-700/50 rounded-lg">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-pink-500/20 to-fuchsia-500/20 flex items-center justify-center">
              <svg className="w-3 h-3 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeWidth="2"/>
                <circle cx="12" cy="10" r="3" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <p className="text-[8px] text-zinc-500 uppercase tracking-wider">Miejscowość</p>
              <p className="text-white font-medium text-[10px]">{data.signCity || "—"}</p>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/50 to-fuchsia-500/50 rounded-lg blur-sm opacity-30" />
            <div className="relative bg-zinc-900 border border-pink-500/30 rounded-lg p-2.5">
              <p className="text-[8px] text-pink-400 uppercase tracking-wider font-semibold mb-1.5">Wykonawca</p>
              <p className="text-[10px] font-bold text-white">{data.agencyName || "Agencja Marketingowa Aurine"}</p>
              {data.agencyOwnerName && <p className="text-[8px] text-zinc-400 mt-0.5">{data.agencyOwnerName}</p>}
              {data.agencyAddress && <p className="text-[8px] text-zinc-500 mt-0.5">{data.agencyAddress}</p>}
              <div className="mt-1 space-y-0.5 text-[8px] text-zinc-500">
                {data.agencyPhone && <p>Tel: {data.agencyPhone}</p>}
                <p>{data.agencyEmail || "kontakt@aurine.pl"}</p>
                {data.agencyNip && <p>NIP: {data.agencyNip}</p>}
              </div>
            </div>
          </div>
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-2.5">
            <p className="text-[8px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">Zleceniodawca</p>
            <p className="text-[10px] font-bold text-white">{data.clientName || "—"}</p>
            {data.clientOwnerName && <p className="text-[8px] text-zinc-400 mt-0.5">{data.clientOwnerName}</p>}
            {data.clientAddress && <p className="text-[8px] text-zinc-500 mt-0.5">{data.clientAddress}</p>}
            <div className="mt-1 space-y-0.5 text-[8px] text-zinc-500">
              {data.clientPhone && <p>Tel: {data.clientPhone}</p>}
              {data.clientEmail && <p>{data.clientEmail}</p>}
              {data.clientNip && <p>NIP: {data.clientNip}</p>}
            </div>
          </div>
        </div>

        {/* Contract Value */}
        <div className="relative mb-3 group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-fuchsia-500 rounded-lg blur-sm opacity-40" />
          <div className="relative flex justify-between items-center py-2 px-3 bg-gradient-to-r from-pink-500/20 to-fuchsia-500/20 border border-pink-500/30 rounded-lg">
            <div>
              <span className="text-[9px] text-pink-300 uppercase tracking-wider font-semibold">Wynagrodzenie miesięczne</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-white">{formatAmount(data.contractValue)} zł</span>
              <span className="text-[8px] text-pink-300 ml-1">brutto/miesiąc</span>
            </div>
          </div>
        </div>

        {/* Intro text */}
        <p className="text-[7.5px] text-zinc-500 mb-2 italic">
          Strony oświadczają, że niniejsza umowa została zawarta w celu określenia zasad współpracy w zakresie świadczenia usług marketingowych przez Wykonawcę na rzecz Zleceniodawcy, w tym w szczególności świadczenia usług promocyjnych, reklamowych oraz doradztwa marketingowego.
        </p>

        {/* §1 Przedmiot umowy */}
        <Section title="§1 Przedmiot umowy">
          <p className="text-[7.5px] text-zinc-400 mb-1">Przedmiotem umowy jest świadczenie przez Wykonawcę usług marketingowych online, w szczególności:</p>
          <BulletList items={[
            "tworzenie, konfiguracja i prowadzenie kampanii reklamowych w systemie Facebook Ads",
            "przygotowanie i publikacja materiałów reklamowych (grafiki, treści, wideo)",
            "bieżąca optymalizacja i monitorowanie wyników kampanii",
            "sporządzanie raportów z prowadzonych działań marketingowych",
            "doradztwo w zakresie działań reklamowych i komunikacji marketingowej"
          ]} />
          <p className="text-[7.5px] text-zinc-500 mt-1 italic">
            Usługi świadczone będą w oparciu o informacje, materiały i dostęp do kont reklamowych udostępnione przez Zleceniodawcę.
          </p>
        </Section>

        {/* §2 Obowiązki Wykonawcy */}
        <Section title="§2 Obowiązki Wykonawcy">
          <p className="text-[7.5px] text-zinc-400 mb-1">Wykonawca zobowiązuje się do:</p>
          <BulletList items={[
            "prowadzenia kampanii reklamowych zgodnie z celami ustalonymi ze Zleceniodawcą",
            "przygotowywania propozycji kreacji reklamowych (grafik, treści, wideo)",
            "bieżącej optymalizacji ustawień kampanii w celu zwiększenia skuteczności",
            "przekazywania raportu z wyników kampanii raz w miesiącu, do 7. dnia roboczego następnego miesiąca",
            "udzielania konsultacji i rekomendacji dotyczących działań marketingowych online",
            "zachowania w poufności wszelkich informacji uzyskanych od Zleceniodawcy"
          ]} />
          <div className="bg-zinc-700/30 border border-zinc-600/30 rounded p-1.5 mt-1">
            <p className="text-[7.5px] text-zinc-300">
              <strong>Ważne:</strong> Wykonawca realizuje działania marketingowe z należytą starannością, zgodnie z aktualną wiedzą i praktyką rynkową, przy czym <strong>nie gwarantuje osiągnięcia określonych wyników finansowych, sprzedażowych czy frekwencyjnych</strong>, ponieważ zależą one od czynników zewnętrznych, niezależnych od Wykonawcy.
            </p>
          </div>
        </Section>

        {/* §3 Obowiązki Zleceniodawcy */}
        <Section title="§3 Obowiązki Zleceniodawcy">
          <p className="text-[7.5px] text-zinc-400 mb-1">Zleceniodawca zobowiązuje się do:</p>
          <BulletList items={[
            "udostępnienia dostępu do fanpage na Facebooku oraz konta reklamowego w Meta Ads Manager",
            "przekazania niezbędnych materiałów (zdjęcia, opisy usług, logo, informacje o promocjach)",
            "akceptacji lub odrzucenia propozycji kreacji w terminie 3 dni roboczych (brak odpowiedzi = akceptacja)",
            "przekazywania informacji o zmianach w ofercie lub działalności mających wpływ na kampanie",
            "terminowego uiszczania ustalonego wynagrodzenia"
          ]} />
          <p className="text-[7.5px] text-zinc-500 mt-1 italic">
            Zleceniodawca ponosi odpowiedzialność za zgodność z prawem oraz prawdziwość dostarczonych materiałów i treści.
          </p>
        </Section>
      </PageWrapper>

      {/* PAGE 2 */}
      <PageWrapper pageNumber={2}>
        {/* Mini Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img src={agencyLogo} alt="Aurine" className="w-6 h-6 object-contain opacity-70" />
            <span className="text-xs text-zinc-400 font-medium">Umowa o świadczenie usług marketingowych</span>
          </div>
          <span className="text-[8px] text-zinc-500">{formatDate(data.signDate)}</span>
        </div>

        {/* §4 Wynagrodzenie */}
        <Section title="§4 Wynagrodzenie">
          {data.paymentType === "full" ? (
            <BulletList items={[
              `Za świadczenie usług Zleceniodawca zapłaci Wykonawcy wynagrodzenie w wysokości ${formatAmount(data.contractValue)} zł brutto miesięcznie`,
              "Wynagrodzenie płatne z góry w całości (100%) w terminie 3 dni od otrzymania umowy",
              "Po otrzymaniu płatności Wykonawca wystawi rachunek na pełną kwotę wynagrodzenia",
              "W przypadku opóźnienia w płatności Wykonawca ma prawo wstrzymać świadczenie usług",
              "Budżet reklamowy Meta Ads finansowany jest w całości przez Zleceniodawcę"
            ]} />
          ) : data.paymentType === "split30" ? (
            <BulletList items={[
              `Za świadczenie usług Zleceniodawca zapłaci Wykonawcy wynagrodzenie w wysokości ${formatAmount(data.contractValue)} zł brutto miesięcznie`,
              "Zaliczka 30% wynagrodzenia płatna w terminie 3 dni od otrzymania umowy",
              "Pozostała część (70%) płatna w terminie 7 dni od zakończenia miesiąca",
              "W przypadku opóźnienia w płatności Wykonawca ma prawo wstrzymać świadczenie usług",
              "Budżet reklamowy Meta Ads finansowany jest w całości przez Zleceniodawcę"
            ]} />
          ) : (
            <BulletList items={[
              `Za świadczenie usług Zleceniodawca zapłaci Wykonawcy wynagrodzenie w wysokości ${formatAmount(data.contractValue)} zł brutto miesięcznie`,
              "Zaliczka 50% wynagrodzenia płatna w terminie 3 dni od otrzymania umowy",
              "Pozostała część (50%) płatna w terminie 7 dni od zakończenia miesiąca",
              "W przypadku opóźnienia w płatności Wykonawca ma prawo wstrzymać świadczenie usług",
              "Budżet reklamowy Meta Ads finansowany jest w całości przez Zleceniodawcę"
            ]} />
          )}
          <p className="text-[7.5px] text-zinc-500 mt-1 italic">
            Wykonawca nie ponosi odpowiedzialności za brak efektów kampanii wynikający z niedostatecznego budżetu.
          </p>
        </Section>

        {/* §5 Prawa autorskie */}
        <Section title="§5 Prawa autorskie">
          <BulletList items={[
            "Wszelkie materiały reklamowe przygotowane przez Wykonawcę (grafiki, treści, wideo) podlegają ochronie prawnoautorskiej",
            "Z chwilą uregulowania pełnego wynagrodzenia Wykonawca udziela Zleceniodawcy niewyłącznej, bezterminowej licencji na korzystanie z materiałów",
            "Zleceniodawca nie ma prawa do odsprzedaży, sublicencjonowania ani wykorzystywania materiałów do celów niezwiązanych z jego działalnością",
            "Wykonawca zachowuje prawo do wykorzystywania materiałów w celach marketingowych własnej agencji (np. jako element portfolio)"
          ]} />
        </Section>

        {/* §6 Okres obowiązywania */}
        <Section title="§6 Okres obowiązywania">
          <BulletList items={[
            data.paymentType === "full" 
              ? "Umowa zostaje zawarta i obowiązuje od dnia dokonania przez Zleceniodawcę wpłaty pełnego wynagrodzenia"
              : "Umowa zostaje zawarta i obowiązuje od dnia dokonania przez Zleceniodawcę wpłaty zaliczki",
            "Po upływie pierwszego miesiąca umowa może zostać przedłużona za zgodą obu stron (aneks lub potwierdzenie mailowe)",
            "W przypadku rażącego naruszenia postanowień umowy przez drugą stronę, rozwiązanie może nastąpić ze skutkiem natychmiastowym"
          ]} />
        </Section>

        {/* §7 Rozwiązanie umowy */}
        <Section title="§7 Rozwiązanie umowy">
          <p className="text-[7.5px] text-zinc-400 mb-1">Wykonawca ma prawo rozwiązać umowę ze skutkiem natychmiastowym, jeżeli:</p>
          <BulletList items={[
            "Zleceniodawca opóźnia się z płatnością wynagrodzenia o więcej niż 14 dni",
            "Zleceniodawca nie przekazuje materiałów lub informacji niezbędnych do prowadzenia kampanii",
            "Zleceniodawca narusza obowiązki określone w §3, uniemożliwiając prawidłowe wykonanie umowy"
          ]} />
          <p className="text-[7.5px] text-zinc-400 mt-1 mb-1">Zleceniodawca ma prawo rozwiązać umowę ze skutkiem natychmiastowym, jeżeli Wykonawca rażąco narusza obowiązki określone w §2.</p>
          <p className="text-[7.5px] text-zinc-500 italic">
            Rozwiązanie umowy wymaga formy pisemnej lub elektronicznej (e-mail na adres wskazany w umowie).
          </p>
        </Section>

        {/* §8 Dane osobowe */}
        <Section title="§8 Ochrona danych osobowych">
          <div className="bg-pink-500/10 border border-pink-500/20 rounded p-1.5 mb-1">
            <p className="text-[7.5px] text-pink-300">
              <strong>RODO:</strong> Strony zobowiązują się do przetwarzania danych osobowych zgodnie z przepisami Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO). Dane osobowe będą przetwarzane wyłącznie w zakresie niezbędnym do realizacji niniejszej umowy.
            </p>
          </div>
        </Section>

        {/* §9 Postanowienia końcowe */}
        <Section title="§9 Postanowienia końcowe">
          <BulletList items={[
            "W sprawach nieuregulowanych niniejszą umową zastosowanie mają przepisy Kodeksu cywilnego",
            "Umowa została sporządzona i przekazana w formie elektronicznej (plik PDF) drogą mailową",
            "Strony zgodnie przyjmują, że forma elektroniczna jest wystarczająca do ważności umowy",
            "Podpisanie umowy nie jest wymagane, jeżeli Zleceniodawca przystąpi do jej realizacji (wpłata zaliczki)"
          ]} />
        </Section>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-auto pt-4">
          <div className="text-center">
            <div className="h-12 border-b-2 border-zinc-700 mb-1"></div>
            <p className="text-[9px] text-zinc-500 font-medium">Zleceniodawca</p>
            <p className="text-[7px] text-zinc-600">{data.clientName || "—"}</p>
          </div>
          <div className="text-center">
            <div className="h-12 border-b-2 border-zinc-700 mb-1"></div>
            <p className="text-[9px] text-zinc-500 font-medium">Wykonawca</p>
            <p className="text-[7px] text-zinc-600">{data.agencyName || "Agencja Marketingowa Aurine"}</p>
          </div>
        </div>
      </PageWrapper>
    </div>
  );
};

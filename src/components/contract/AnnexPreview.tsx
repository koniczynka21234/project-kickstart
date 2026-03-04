import {
  PageWrapper,
  ContractHeader,
  PartiesGrid,
  Section,
  BulletList,
  SignaturesBlock,
  InfoPill,
  formatContractDate,
  formatContractAmount,
} from "./ContractSharedComponents";

interface AnnexData {
  clientName: string;
  clientOwnerName: string;
  clientAddress: string;
  clientNip: string;
  agencyName: string;
  agencyOwnerName: string;
  agencyAddress: string;
  agencyNip: string;
  originalContractDate: string;
  newStartDate: string;
  newEndDate: string;
  durationMonths: number;
  contractAmount: number | null;
  signDate: string;
  signCity: string;
}

interface AnnexPreviewProps {
  data: AnnexData;
}

const CalendarIcon = () => (
  <svg className="w-3 h-3 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
    <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
  </svg>
);

const LocationIcon = () => (
  <svg className="w-3 h-3 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeWidth="2"/>
    <circle cx="12" cy="10" r="3" strokeWidth="2"/>
  </svg>
);

export const AnnexPreview = ({ data }: AnnexPreviewProps) => {
  const monthWord = data.durationMonths === 1 ? 'miesiąca' : 'miesięcy';

  return (
    <div id="annex-preview">
      <PageWrapper pageNumber={1} totalPages={1}>
        {/* Header — same as contract */}
        <ContractHeader title="Aneks do umowy" />

        {/* Date & City pills */}
        <div className="flex flex-wrap gap-2 mb-3">
          <InfoPill icon={<CalendarIcon />} label="Data aneksu" value={formatContractDate(data.signDate)} />
          <InfoPill icon={<LocationIcon />} label="Miejscowość" value={data.signCity || "—"} />
          {data.originalContractDate && (
            <InfoPill icon={<CalendarIcon />} label="Data umowy głównej" value={formatContractDate(data.originalContractDate)} />
          )}
        </div>

        {/* Parties — same layout as contract */}
        <PartiesGrid
          agencyName={data.agencyName}
          agencyOwnerName={data.agencyOwnerName}
          agencyAddress={data.agencyAddress}
          agencyNip={data.agencyNip}
          clientName={data.clientName}
          clientOwnerName={data.clientOwnerName}
          clientAddress={data.clientAddress}
          clientNip={data.clientNip}
        />

        {/* Intro text */}
        <p className="text-[7.5px] text-zinc-500 mb-2 italic">
          Niniejszy aneks stanowi integralną część umowy o świadczenie usług marketingowych
          {data.originalContractDate ? ` z dnia ${formatContractDate(data.originalContractDate)}` : ''} zawartej
          pomiędzy powyższymi stronami i wchodzi w życie z dniem {formatContractDate(data.newStartDate)}.
        </p>

        {/* §1 Przedłużenie umowy */}
        <Section title="§1 Przedłużenie umowy">
          <BulletList items={[
            `Strony postanawiają przedłużyć obowiązywanie umowy o świadczenie usług marketingowych na kolejny okres ${data.durationMonths} ${monthWord}`,
            `Nowy okres obowiązywania umowy rozpoczyna się dnia ${formatContractDate(data.newStartDate)} i trwa do dnia ${formatContractDate(data.newEndDate)}`,
            "Warunki współpracy określone w umowie głównej pozostają bez zmian, chyba że niniejszy aneks stanowi inaczej",
          ]} />
        </Section>

        <div className="h-2" />

        {/* §2 Wynagrodzenie — with highlight box like contract */}
        {data.contractAmount && (
          <>
            <Section title="§2 Wynagrodzenie">
              <div className="relative mb-1.5 group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-fuchsia-500 rounded-lg blur-sm opacity-40" />
                <div className="relative flex justify-between items-center py-2 px-3 bg-gradient-to-r from-pink-500/20 to-fuchsia-500/20 border border-pink-500/30 rounded-lg">
                  <div>
                    <span className="text-[9px] text-pink-300 uppercase tracking-wider font-semibold">Wynagrodzenie miesięczne</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-white">{formatContractAmount(data.contractAmount)} zł</span>
                    <span className="text-[8px] text-pink-300 ml-1">brutto/miesiąc</span>
                  </div>
                </div>
              </div>
              <BulletList items={[
                `Strony ustalają nową wysokość miesięcznego wynagrodzenia na kwotę ${formatContractAmount(data.contractAmount)} zł brutto`,
                "Nowa kwota wynagrodzenia obowiązuje od dnia wejścia w życie niniejszego aneksu",
                "Warunki płatności (termin, forma) nie ulegają zmianie",
                "Budżet reklamowy Meta Ads finansowany jest w całości przez Zleceniodawcę",
              ]} />
            </Section>
            <div className="h-2" />
          </>
        )}

        {/* §3 Zakres usług */}
        <Section title={data.contractAmount ? "§3 Zakres usług" : "§2 Zakres usług"}>
          <BulletList items={[
            "Zakres usług świadczonych przez Wykonawcę pozostaje zgodny z postanowieniami umowy głównej",
            "Wykonawca kontynuuje prowadzenie kampanii reklamowych, przygotowanie kreacji i raportowanie",
            "Wykonawca realizuje usługi z należytą starannością, bez gwarancji konkretnych wyników finansowych",
          ]} />
        </Section>

        <div className="h-2" />

        {/* §4 Postanowienia końcowe */}
        <Section title={data.contractAmount ? "§4 Postanowienia końcowe" : "§3 Postanowienia końcowe"}>
          <BulletList items={[
            "Pozostałe postanowienia umowy pozostają bez zmian i zachowują swoją moc obowiązującą",
            "Aneks został sporządzony i przekazany w formie elektronicznej (plik PDF) drogą mailową",
            "Strony zgodnie przyjmują, że forma elektroniczna jest wystarczająca do ważności aneksu",
            "W sprawach nieuregulowanych niniejszym aneksem zastosowanie mają postanowienia umowy głównej oraz przepisy Kodeksu cywilnego",
          ]} />
        </Section>

        <div className="h-2" />

        {/* RODO notice — same as contract */}
        <div className="bg-pink-500/10 border border-pink-500/20 rounded p-1.5">
          <p className="text-[7.5px] text-pink-300">
            <strong>RODO:</strong> Przetwarzanie danych osobowych odbywa się na zasadach określonych w umowie głównej, zgodnie z przepisami Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679.
          </p>
        </div>

        {/* Signatures — same as contract */}
        <SignaturesBlock
          executorName={data.agencyOwnerName || data.agencyName}
          clientName={data.clientOwnerName || data.clientName}
        />
      </PageWrapper>
    </div>
  );
};

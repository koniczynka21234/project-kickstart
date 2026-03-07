export interface AuditFinding {
  id: string;
  label: string;
  type: "positive" | "issue";
  description: string;
  recommendation?: string;
}

export interface AuditSubSectionDef {
  id: string;
  name: string;
  findings: AuditFinding[];
}

export interface AuditCategoryDef {
  id: string;
  name: string;
  description: string;
  enabledByDefault: boolean;
  subSections: AuditSubSectionDef[];
}

export interface EnrichedFinding extends AuditFinding {
  subSectionName: string;
}

export interface AuditSlideData {
  type: 'intro' | 'category-overview' | 'findings' | 'competition' | 'recommendations' | 'summary';
  categoryId?: string;
  categoryName?: string;
  findings?: EnrichedFinding[];
  positiveCount?: number;
  issueCount?: number;
}

export const AUDIT_CATEGORIES: AuditCategoryDef[] = [
  {
    id: "facebook",
    name: "Profil Facebook",
    description: "Profil na Facebooku to czesto pierwsze miejsce, w ktorym klientki szukaja informacji o salonie. Niekompletny profil moze zniechecic nawet zanim ktos zadzwoni.",
    enabledByDefault: true,
    subSections: [
      {
        id: "fb_profile",
        name: "Ustawienia profilu",
        findings: [
          // Pozytywne
          { id: "fb_profile_ok", label: "Profil kompletny i profesjonalny", type: "positive", description: "Profil Facebook jest kompletny: zdjecie profilowe, cover, opis, godziny i przycisk CTA sa poprawnie ustawione. Buduje to zaufanie od pierwszego wejrzenia." },
          { id: "fb_cover_pro", label: "Profesjonalne zdjęcie w tle", type: "positive", description: "Zdjęcie w tle jest wysokiej jakości, aktualne i dobrze skadrowane. Prezentuje salon lub efekty pracy w atrakcyjny sposób." },
          { id: "fb_photo_pro", label: "Profesjonalne zdjęcie profilowe / logo", type: "positive", description: "Zdjęcie profilowe to czytelne, rozpoznawalne logo lub portret. Wyglada profesjonalnie nawet w małym rozmiarze w komentarzach i wiadomościach." },
          { id: "fb_about_complete", label: "Kompletna i rozbudowana sekcja O nas", type: "positive", description: "Sekcja O nas zawiera pełny opis salonu: specjalizacje, lata doświadczenia, unikalne cechy i dane kontaktowe. Buduje to zaufanie i pozycję eksperta." },
          { id: "fb_cta_set", label: "Przycisk CTA poprawnie ustawiony", type: "positive", description: "Przycisk akcji (np. Zarezerwuj, Zadzwoń) jest aktywny i kieruje do właściwego miejsca, co ułatwia klientkom szybki kontakt." },
          { id: "fb_hours_correct", label: "Aktualne godziny otwarcia", type: "positive", description: "Godziny otwarcia są ustawione i odpowiadają rzeczywistości. Klientki zawsze wiedzą kiedy salon jest otwarty." },
          { id: "fb_category_correct", label: "Prawidłowa kategoria profilu", type: "positive", description: "Profil ma ustawioną właściwą kategorię branży beauty, co zwiększa widoczność w wyszukiwarce Facebooka." },
          { id: "fb_messenger_active", label: "Aktywny Messenger z szybką odpowiedzią", type: "positive", description: "Wiadomości na Messengerze są włączone i salon odpowiada szybko. Odznaka 'Bardzo szybko odpowiada' buduje zaufanie." },
          
          // Błędy
          { id: "fb_cover_none", label: "Brak zdjecia w tle", type: "issue", description: "Sekcja zdjecia w tle jest calkowicie pusta. Profil wyglada na niekompletny i porzucony, a klientka widzi szary prostokat zamiast wizerunku salonu.", recommendation: "Dodaj profesjonalne zdjecie wnetrza salonu lub najlepszy efekt pracy. Wymiary: 820x312 px. To pierwsza rzecz, ktora widzi odwiedzajacy." },
          { id: "fb_cover_old_promo", label: "Stara promocja w zdjęciu w tle", type: "issue", description: "Zdjecie w tle reklamuje promocje lub oferte, ktora juz sie skonczyla. Klientka widzi nieaktualną informacje i moze pomyslec, ze salon nie dba o swoj profil.", recommendation: "Usun stara promocje i wstaw aktualne zdjecie: swiezy efekt pracy, wnetrze salonu lub sezonowa grafike. Aktualizuj co 2-3 miesiace." },
          { id: "fb_cover_old_decor", label: "Poprzedni wystroj salonu w tle", type: "issue", description: "Zdjecie w tle pokazuje stary wystroj salonu, ktory juz nie istnieje. Klientka oczekuje czegos innego niz zobaczy na zywo, co dezorientuje i obniza zaufanie.", recommendation: "Zrob nowe zdjecie aktualnego wnetrza salonu w dobrym swietle. Pokaz jak salon wyglada TERAZ." },
          { id: "fb_cover_old_team", label: "Nieaktualny zespol w zdjęciu w tle", type: "issue", description: "Na zdjeciu w tle widac osoby, ktore juz nie pracuja w salonie. Klientka moze umawiać sie do konkretnej osoby i bedzie rozczarowana.", recommendation: "Zaktualizuj zdjecie zespolu lub uzyj zdjecia efektow pracy zamiast grupowego. Aktualizuj po kazdej zmianie w zespole." },
          { id: "fb_cover_blurry", label: "Rozmazane zdjecie w tle", type: "issue", description: "Zdjecie w tle jest rozmazane i pikselowe, wyglada jak przyblizone zdjecie z telefonu. Pierwsze wrazenie jest nieprofesjonalne.", recommendation: "Wymien na zdjecie w wysokiej rozdzielczosci (min. 820x312 px). Zrob zdjecie w dobrym swietle, nie przyblizaj cyfrowo." },
          { id: "fb_cover_bad_crop", label: "Źle skadrowane zdjecie w tle", type: "issue", description: "Zdjecie w tle jest obciete w niefortunny sposob: ucieta glowa, polowa tekstu niewidoczna, wazne elementy poza kadrem.", recommendation: "Dopasuj zdjecie do wymiarow 820x312 px. Sprawdz jak wyglada na telefonie, bo kadr moze sie roznic od desktopu." },
          { id: "fb_cover_dark", label: "Ciemne zdjecie w tle", type: "issue", description: "Zdjecie w tle jest ciemne, wnętrze salonu lub efekt pracy jest ledwo widoczny. Nie przyciaga uwagi i nie buduje wizerunku.", recommendation: "Zrob zdjecie w jasnym swietle lub podkrecec jasnosc w edycji. Cover photo musi byc jasny i czytelny." },
          { id: "fb_cover_canva_stock", label: "Generyczna grafika z Canva w tle", type: "issue", description: "Zdjecie w tle to gotowy szablon z Canva z generycznymi zdjeciami. Wyglada jak u kazdego innego salonu, brak autentycznosci.", recommendation: "Zamien na wlasne zdjecie: efekt pracy, wnetrze salonu, zespol. Autentycznosc buduje wiecej zaufania niz stockowe grafiki." },
          { id: "fb_cover_text_overload", label: "Za duzo tekstu na zdjeciu w tle", type: "issue", description: "Zdjecie w tle jest zaladowane tekstem: cennik, adres, telefon, social media. Na telefonie nic nie jest czytelne.", recommendation: "Cover to zdjecie, nie ulotka. Max. 3-4 slowa. Informacje kontaktowe podaj w sekcji O nas." },
          { id: "fb_photo_none", label: "Brak zdjecia profilowego", type: "issue", description: "Profil nie ma ustawionego zdjecia profilowego i wyswietla sie domyslna ikona Facebooka. Calkowity brak rozpoznawalnosci marki.", recommendation: "Dodaj profesjonalne logo salonu lub estetyczne zdjecie. Zdjecie profilowe to Twoja wizytowka w komentarzach i wiadomosciach." },
          { id: "fb_photo_selfie", label: "Selfie jako zdjecie profilowe", type: "issue", description: "Zdjecie profilowe to selfie, nieformalne, czesto w zlym swietle. Nie buduje profesjonalnego wizerunku salonu beauty.", recommendation: "Zamien selfie na profesjonalne logo lub dedykowane zdjecie portretowe. Avatar powinien byc rozpoznawalny i spojny z marka." },
          { id: "fb_photo_private", label: "Prywatne zdjecie jako profilowe", type: "issue", description: "Zdjecie profilowe to zdjecie prywatne, z wakacji, imprezy lub z rodzina. Nie pasuje do profesjonalnej wizytowki salonu.", recommendation: "Uzyj profesjonalnego logo lub portretu w kontekscie salonowym. Profil firmowy to nie prywatny, musi budowac zaufanie." },
          { id: "fb_photo_random", label: "Przypadkowy kadr jako profilowe", type: "issue", description: "Zdjecie profilowe to przypadkowy kadr, np. zdjecie efektu pracy, grupowe zdjecie lub kadr z daleka. Nie pelni roli rozpoznawalnego avatara.", recommendation: "Avatar musi byc czytelny w rozmiarze 40x40 px. Logo lub portret z bliska, nic wiecej." },
          { id: "fb_photo_blurry", label: "Rozmazane zdjecie profilowe", type: "issue", description: "Zdjecie profilowe jest rozmazane, ciemne lub nieczytelne w malym rozmiarze. Nie da sie rozpoznac marki w feedzie.", recommendation: "Wymien na ostre, kontrastowe logo lub zdjecie. Sprawdz jak wyglada w rozmiarze 40x40 px, musi byc czytelne." },
          { id: "fb_photo_generator", label: "Logo z darmowego generatora", type: "issue", description: "Zdjecie profilowe to logo wygenerowane w darmowym generatorze. Wyglada tanio, generycznie i amatorsko. Klientki to widzą.", recommendation: "Zainwestuj w proste, ale profesjonalne logo. Nawet minimalistyczny monogram wyglada lepiej niz generator z internetu." },
          { id: "fb_about_empty", label: "Calkowicie pusta sekcja O nas", type: "issue", description: "Sekcja O nas jest kompletnie pusta, zero informacji o salonie, uslugach, specjalizacji. Klientka nie wie czym sie salon zajmuje.", recommendation: "Uzupelnij opis: specjalizacje, liste uslug, adres, godziny otwarcia. Napisz minimum 3-4 zdania o tym co wyroznia salon." },
          { id: "fb_about_address_only", label: "W sekcji O nas tylko adres i telefon", type: "issue", description: "Sekcja O nas zawiera wylacznie dane kontaktowe, zero opisu uslug, specjalizacji, lat doswiadczenia. Klientka nie wie co wyroznia salon.", recommendation: "Dodaj opis: czym sie specjalizujesz, ile lat doswiadczenia, jakie uslugi oferujesz. Dane kontaktowe to za malo." },
          { id: "fb_about_generic", label: "Ogolnikowy opis 'Salon beauty. Zapraszamy'", type: "issue", description: "Opis brzmi jak u kazdego salonu: 'Salon fryzjerski. Zapraszamy.' Zero konkretow, zero wyroznikow. Mogloby byc o dowolnym salonie.", recommendation: "Napisz co KONKRETNIE wyroznia TEN salon: specjalizacje, unikalne uslugi, lata doswiadczenia, szkolenia. Dodaj slowa kluczowe lokalne." },
          { id: "fb_about_outdated", label: "Nieaktualne informacje w sekcji O nas", type: "issue", description: "Sekcja O nas zawiera nieaktualne informacje: stary adres, nieaktualne godziny, uslugi ktore salon juz nie oferuje.", recommendation: "Zaktualizuj wszystkie dane do aktualnego stanu. Sprawdzaj regularnie, szczegolnie po zmianach w ofercie." },
          { id: "fb_no_cta", label: "Brak przycisku CTA na profilu", type: "issue", description: "Na profilu brakuje przycisku akcji (np. Zarezerwuj, Zadzwon). Klientki nie maja latwego sposobu na kontakt.", recommendation: "Dodaj przycisk CTA, najlepiej Zarezerwuj z linkiem do systemu rezerwacji lub Zadzwon z numerem telefonu." },
          { id: "fb_cta_wrong", label: "Przycisk CTA kieruje w zle miejsce", type: "issue", description: "Przycisk CTA jest ustawiony, ale kieruje na nieaktualny link, strone w budowie lub ogolna strone. Nie konwertuje.", recommendation: "Sprawdz dokad kieruje przycisk. Najlepiej link do rezerwacji online lub bezposredni numer telefonu." },
          { id: "fb_no_hours", label: "Brak godzin otwarcia na profilu", type: "issue", description: "Godziny otwarcia nie sa ustawione. Klientki nie wiedza kiedy salon jest otwarty i moga przyjechac na zamkniete drzwi.", recommendation: "Dodaj aktualne godziny otwarcia. Aktualizuj przy swietach i zmianach grafiku." },
          { id: "fb_hours_outdated", label: "Nieaktualne godziny otwarcia", type: "issue", description: "Godziny otwarcia sa ustawione, ale nie odpowiadaja rzeczywistosci. Klientki moga przyjechac na zamkniety salon.", recommendation: "Zaktualizuj godziny do aktualnego grafiku. Sprawdzaj regularnie, szczegolnie po zmianach i swietach." },
          { id: "fb_wrong_category", label: "Nieprawidlowa kategoria profilu", type: "issue", description: "Profil ma ustawiona ogolna kategorie (np. 'Firma') zamiast branzy beauty, co obniza widocznosc w wyszukiwarce.", recommendation: "Zmien kategorie na odpowiednia: Salon fryzjerski, Salon kosmetyczny, Studio urody. Dodaj podkategorie uslug." },
          { id: "fb_no_messenger", label: "Wylaczone wiadomosci na Messengerze", type: "issue", description: "Klientki nie moga napisac do salonu przez Messengera. Glowny kanal komunikacji na Facebooku jest zablokowany.", recommendation: "Wlacz wiadomosci w ustawieniach strony. Ustaw automatyczna odpowiedz powitalna z informacja o czasie odpowiedzi." },
          { id: "fb_slow_response", label: "Dlugi czas odpowiedzi na wiadomosci", type: "issue", description: "Salon odpowiada na wiadomosci po wielu godzinach lub dniach. Facebook pokazuje wskaznik 'Zwykle odpowiada w ciagu...' i dlugi czas zniecheca.", recommendation: "Odpowiadaj w ciagu 1-2 godzin. Ustaw automatyczna odpowiedz na godziny poza praca. Cel: odznaka 'Bardzo szybko odpowiada'." },
        ]
      },
      {
        id: "fb_posts",
        name: "Opisy postow",
        findings: [
          // Pozytywne
          { id: "fb_posts_engaging", label: "Angażujące opisy z CTA", type: "positive", description: "Posty zawieraja rozbudowane, angazujace opisy z wyraznym wezwaniem do dzialania. To zwieksza interakcje i zasiegi." },
          { id: "fb_posts_storytelling", label: "Storytelling i emocje w opisach", type: "positive", description: "Opisy opowiadają historie klientek, budują emocje i angażują czytelniczki. To wyróżnia profil na tle szablonowej konkurencji." },
          { id: "fb_posts_hooks", label: "Mocne hooki w pierwszym zdaniu", type: "positive", description: "Posty zaczynają się od pytań, zaskakujących faktów lub emocji, które zatrzymują scrollowanie i zachęcają do przeczytania całości." },
          { id: "fb_posts_formatted", label: "Czytelne formatowanie postów", type: "positive", description: "Opisy są dobrze sformatowane: krótkie akapity, emoji jako separatory, czytelna struktura. Łatwo się je czyta na telefonie." },
          { id: "fb_posts_variety", label: "Różnorodne formaty treści", type: "positive", description: "Profil publikuje mix treści: efekty pracy, porady, kulisy, ankiety, pytania. Nie tylko promocje. To buduje społeczność." },
          // Błędy
          { id: "fb_posts_empty", label: "Posty bez zadnego opisu", type: "issue", description: "Posty sa publikowane bez jakiegokolwiek tekstu, samo zdjecie bez kontekstu. Algorytm nie wie jak je promowac, klientka nie wie co widzi.", recommendation: "Pisz opisy minimum 3-5 zdan. Uzyj formuly: hook, historia, CTA. Kazdy post to okazja do komunikacji." },
          { id: "fb_posts_emoji_only", label: "Same emoji zamiast opisu", type: "issue", description: "Pod postami sa tylko emoji (💇‍♀️✨💕) bez zadnego tekstu. Wyglada to nieprofesjonalnie i nie daje wartosci klientkom.", recommendation: "Emoji to dodatek, nie zamiast opisu. Napisz historie, opisz efekt, dodaj kontekst. Emoji uzywaj jako separatorow." },
          { id: "fb_posts_one_word", label: "Opisy jednowyrazowe: 'Efekt', 'Zapraszamy'", type: "issue", description: "Opisy to pojedyncze slowa: 'Nowy kolor', 'Zapraszamy', 'Efekt'. Zero wartosci, zero kontekstu, zero personalizacji.", recommendation: "Rozbuduj opisy: opowiedz historie klientki, opisz efekt, dodaj tip. Zamien 'Zapraszamy' na 'Napisz KOLOR w komentarzu'." },
          { id: "fb_posts_copy_paste", label: "Kopiuj-wklej te same opisy pod kazdym postem", type: "issue", description: "Kazdy post ma ten sam schemat opisu, te same frazy, te same zdania. Wyglada jak automat, nie jak osobista komunikacja.", recommendation: "Urozmaicaj formaty: pytanie, historia klientki, porada, kulisy, ankieta. Kazdy post powinien miec unikalny charakter." },
          { id: "fb_posts_dry", label: "Suche opisy bez emocji i historii", type: "issue", description: "Opisy sa dluzsze, ale suche i pozbawione emocji. Czysto informacyjne, brzmia jak z katalogu uslug.", recommendation: "Dodaj storytelling: opowiedz historie metamorfozy, emocje klientki, kulisy pracy. Uzyj formuly AIDA." },
          { id: "fb_posts_no_cta", label: "Posty bez wezwania do dzialania", type: "issue", description: "Posty nie koncza sie CTA. Klientki ogladaja i scrolluja dalej, nie wiedza co maja zrobic po przeczytaniu.", recommendation: "Kazdy post konczy sie CTA: Napisz w komentarzu, Wyslij wiadomosc, Zadzwon. Bez CTA = brak konwersji." },
          { id: "fb_posts_no_hook", label: "Brak hooka w pierwszym zdaniu", type: "issue", description: "Pierwsze zdanie posta nie przyciaga uwagi. W feedzie widac tylko 2-3 linijki, a hook musi zatrzymac scrollowanie.", recommendation: "Zacznij od pytania, zaskakujacego faktu lub emocji: 'Czy wiesz, ze 70% kobiet zle dobiera kolor?'" },
          { id: "fb_posts_wall_of_text", label: "Sciany tekstu bez akapitow", type: "issue", description: "Opisy to ciagle bloki tekstu bez akapitow, emoji i separatorow. Na telefonie sa nieczytelne i zniechęcajace.", recommendation: "Formatuj: krotkie akapity, emoji jako separatory, bold na kluczowe zdania. Czytelnosc = zaangazowanie." },
          { id: "fb_posts_only_promos", label: "Same posty promocyjne i oferty", type: "issue", description: "Profil publikuje wylacznie promocje i oferty cenowe. Klientki nie chca feedu pelnego reklam i tracisz zaangazowanie.", recommendation: "Zasada 80/20: 80% tresci wartosciowych (porady, efekty, kulisy), 20% promocji. Ludzie obserwuja dla wartosci, nie reklam." },
          { id: "fb_posts_no_questions", label: "Posty nie zadaja pytan obserwujacym", type: "issue", description: "Posty sa jednostronne: salon mowi, ale nie pyta. Zero interakcji, zero komentarzy, zero zaangazowania.", recommendation: "Koncz posty pytaniem: 'Ktory kolor wolisz?', 'Zgadzacie sie?', 'A Ty jaki masz ulubiony?'. Pytania = komentarze = zasiegi." },
        ]
      },
      {
        id: "fb_photos",
        name: "Zdjecia i grafiki",
        findings: [
          // Pozytywne
          { id: "fb_photos_quality", label: "Zdjęcia wysokiej jakości", type: "positive", description: "Zdjecia na profilu sa dobrze oswietlone, ostre i profesjonalnie wygladajace. To buduje zaufanie do jakosci uslug." },
          { id: "fb_photos_ba_present", label: "Regularne zdjęcia before/after", type: "positive", description: "Profil regularnie prezentuje efekty pracy w formacie before/after, czyli najskuteczniejszym formacie w branży beauty." },
          { id: "fb_photos_clean_bg", label: "Czyste, neutralne tło na zdjęciach", type: "positive", description: "Zdjęcia mają czyste, zadbane tło bez bałaganu. Klientka skupia się na efekcie pracy, nie na otoczeniu." },
          { id: "fb_photos_diverse", label: "Różnorodne typy zdjęć", type: "positive", description: "Profil pokazuje mix treści wizualnych: efekty pracy, wnętrze salonu, zespół, kulisy. Buduje pełny obraz marki." },
          { id: "fb_photos_natural", label: "Własne, autentyczne zdjęcia", type: "positive", description: "Profil używa wyłącznie własnych zdjęć efektów pracy. Autentyczność buduje większe zaufanie niż stockowe grafiki." },
          { id: "fb_photos_dark", label: "Ciemne zdjecia ze zlym oswietleniem", type: "issue", description: "Zdjecia sa ciemne, robione w zlym oswietleniu. Efekty pracy sa ledwo widoczne, a klientka nie oceni jakosci uslug.", recommendation: "Uzywaj ring light lub fotografuj przy oknie. Koszt ring light to ok. 80-150 zl, inwestycja ktora sie szybko zwraca." },
          { id: "fb_photos_blurry", label: "Rozmazane, nieostrze zdjecia", type: "issue", description: "Zdjecia sa nieostrze, robione w ruchu lub z brudnym obiektywem. Wyglada to nieprofesjonalnie i odstrasza klientki.", recommendation: "Czysc obiektyw telefonu, ustabilizuj reke lub uzyj statywu. Rob zdjecia w dobrym swietle, telefon lepiej ostrzy." },
          { id: "fb_photos_messy_bg", label: "Balagan w tle zdjec", type: "issue", description: "Na zdjeciach widac balagan, nieuporzadkowane stanowisko, produkty, inne osoby. Tlo odciaga uwage od efektu pracy.", recommendation: "Przygotuj czyste, neutralne tlo. Zrob 'kat foto' w salonie: dobre tlo, oswietlenie, kilka rekwizytow." },
          { id: "fb_photos_bad_angle", label: "Zle kadry i niefortunny kat zdjecia", type: "issue", description: "Zdjecia sa robione z niewlasciwego kata, efekt pracy nie jest widoczny, proporcje sa znieksztalcone.", recommendation: "Fotografuj z poziomu oczu lub lekko z gory. Unikaj zdjec z dolu. Kadruj na efekt, nie na calą postac." },
          { id: "fb_photos_quick_snap", label: "Zdjecia robione na szybko", type: "issue", description: "Zdjecia sa robione pospiesznie: zle skadrowane, przypadkowy kat, bez dbania o detale. Wyglada to amatorsko.", recommendation: "Przygotuj stanowisko: neutralne tlo, ring light, czysty kadr. Rob 3-5 zdjec i wybieraj najlepsze." },
          { id: "fb_photos_no_ba", label: "Brak zdjec before/after", type: "issue", description: "Profil nie prezentuje efektow pracy w formacie before/after, czyli najskuteczniejszym formacie w branzy beauty.", recommendation: "Rob zdjecia before/after kazdej metamorfozy (za zgoda klientki). Te same warunki oswietlenia. Min. 2-3x/tydzien." },
          { id: "fb_photos_only_effects", label: "Same efekty pracy bez roznorodnosci", type: "issue", description: "Na profilu sa wylacznie zdjecia efektow pracy. Brakuje zdjec salonu, zespolu, kulis, przez co profil jest monotonny.", recommendation: "Mix tresci: 40% efekty pracy, 25% edukacja, 20% kulisy, 15% oferty. Pokaz salon, siebie, zespol." },
          { id: "fb_photos_stock", label: "Zdjecia z internetu zamiast wlasnych", type: "issue", description: "Profil uzywa zdjec stockowych lub zdjec z internetu zamiast wlasnych efektow pracy. Klientki to widzą i traca zaufanie.", recommendation: "Nigdy nie uzywaj stockow! Klientki chca widziec TWOJE efekty pracy. Nawet przecietne wlasne zdjecie jest lepsze niz idealne stockowe." },
          { id: "fb_photos_mirror_selfie", label: "Zdjecia efektow robione w lustrze", type: "issue", description: "Efekty pracy sa fotografowane przez lustro: odbicia, brudne lustra, znieksztalcony obraz. Amatorskie wrazenie.", recommendation: "Fotografuj bezposrednio, nie przez lustro. Ustaw klientke w dobrym swietle, czysty kadr, neutralne tlo." },
          { id: "fb_photos_filter_overuse", label: "Przesadzone filtry na zdjeciach", type: "issue", description: "Zdjecia maja nalozone mocne filtry, przez co kolor wlosow wyglada inaczej niz w rzeczywistosci. Klientka oczekuje czegos innego.", recommendation: "Minimalne filtry! Klientki chca widziec PRAWDZIWY efekt. Lekka korekcja jasnosci i kontrastu, nic wiecej." },
        ]
      },
      {
        id: "fb_engagement",
        name: "Zaangazowanie i interakcje",
        findings: [
          // Pozytywne
          { id: "fb_engage_active", label: "Aktywne odpowiadanie na komentarze", type: "positive", description: "Salon odpowiada na komentarze szybko i personalnie. Buduje relacje i zacheca do interakcji." },
          { id: "fb_engage_high_likes", label: "Wysoka liczba reakcji na posty", type: "positive", description: "Posty zbierają dużo reakcji (polubień, serc). Algorytm promuje takie treści i pokazuje je większej liczbie osób." },
          { id: "fb_engage_comments_active", label: "Aktywne komentarze pod postami", type: "positive", description: "Pod postami toczą się rozmowy z klientkami: komentarze, pytania, komplementy. To sygnał wysokiego zaangażowania dla algorytmu." },
          { id: "fb_engage_shares", label: "Posty udostępniane przez klientki", type: "positive", description: "Klientki udostępniają posty na swoich profilach. To najlepsza darmowa reklama i rekomendacja." },
          { id: "fb_engage_reviews_positive", label: "Pozytywne opinie na Facebooku", type: "positive", description: "Profil ma pozytywne opinie od klientek z odpowiedziami salonu. Buduje to zaufanie nowych odwiedzających." },
          { id: "fb_engage_no_reply_comments", label: "Komentarze bez odpowiedzi", type: "issue", description: "Pod postami sa komentarze od klientek, ale salon na nie nie odpowiada. To niszczy relacje i zniecheca do interakcji.", recommendation: "Odpowiadaj na KAZDY komentarz w ciagu kilku godzin. Nawet 'Dziekujemy! ❤️' jest lepsze niz cisza." },
          { id: "fb_engage_zero_comments", label: "Posty bez zadnych komentarzy", type: "issue", description: "Posty nie generuja komentarzy, zero interakcji pod tresciami. Algorytm widzi brak zaangazowania i obcina zasiegi.", recommendation: "Zadawaj pytania w postach, uzywaj CTA 'Napisz w komentarzu'. Odpowiadaj na kazdy komentarz, buduj nawyk interakcji." },
          { id: "fb_engage_zero_likes", label: "Minimalna liczba reakcji na posty", type: "issue", description: "Posty zbieraja 2-5 reakcji. To sygnalizuje niskie zaangazowanie i obniza zasiegi organiczne.", recommendation: "Popraw jakosc tresci: lepsze zdjecia, angazujace opisy, CTA. Udostepniaj posty na stories. Zaangażuj zespol." },
          { id: "fb_engage_no_share", label: "Posty nie sa udostepniane", type: "issue", description: "Klientki nie udostepniaja postow. Tresci nie sa na tyle wartosciowe lub zabawne, zeby je polecic dalej.", recommendation: "Twórz tresci warte udostepniania: metamorfozy wow, porady, memy branżowe. Dodaj CTA 'Oznacz przyjaciolke'." },
          { id: "fb_engage_negative_reviews", label: "Negatywne opinie bez reakcji", type: "issue", description: "Na profilu sa negatywne opinie lub komentarze, na ktore salon nie reaguje. Inne klientki to widzą.", recommendation: "Odpowiadaj na negatywne opinie SZYBKO i profesjonalnie. Przepros, wyjasn, zaproponuj rozwiazanie, nigdy nie atakuj." },
        ]
      }
    ]
  },
  {
    id: "instagram",
    name: "Profil Instagram",
    description: "Instagram to platforma wizualna. Profil ma doslownie 3 sekundy, zeby przekonac nowa osobe do obserwowania. Bio, highlights i link decyduja o konwersji.",
    enabledByDefault: true,
    subSections: [
      {
        id: "ig_profile",
        name: "Ustawienia profilu",
        findings: [
          // Pozytywne
          { id: "ig_profile_ok", label: "Kompletny, profesjonalny profil", type: "positive", description: "Profil Instagram jest kompletny: profesjonalne zdjecie, bio z CTA, link do rezerwacji i uporzadkowane highlights." },
          { id: "ig_bio_pro", label: "Konkretne, dobrze napisane bio", type: "positive", description: "Bio zawiera specjalizację, lokalizację i CTA. Nowa osoba od razu wie czym salon się zajmuje i jak się umówić." },
          { id: "ig_link_active", label: "Aktywny link do rezerwacji w bio", type: "positive", description: "Link w bio kieruje bezpośrednio do systemu rezerwacji lub Linktree z opcjami kontaktu. Łatwy dostęp 24/7." },
          { id: "ig_highlights_pro", label: "Uporządkowane highlights ze spójnymi okładkami", type: "positive", description: "Highlights są uporządkowane tematycznie ze spójnymi okładkami w kolorach marki: Cennik, Efekty, Opinie, Salon." },
          { id: "ig_photo_matching", label: "Spójne zdjęcie profilowe z innymi platformami", type: "positive", description: "Zdjęcie profilowe jest takie samo jak na FB i Google. Klientka od razu rozpoznaje markę na każdej platformie." },
          { id: "ig_business_account", label: "Konto firmowe z przyciskami kontaktowymi", type: "positive", description: "Profil jest ustawiony jako konto firmowe z aktywnymi przyciskami Zadzwoń, Email i Jak dojechać." },
          
          // Błędy
          { id: "ig_bio_none", label: "Calkowicie puste bio", type: "issue", description: "Bio jest kompletnie puste. Nowa osoba nie ma pojecia czym zajmuje sie salon, gdzie sie znajduje ani jak sie umowic.", recommendation: "Struktura bio: 1) Specjalizacja, 2) Lokalizacja, 3) CTA z emoji. Max 150 znakow. Jasno i konkretnie." },
          { id: "ig_bio_name_only", label: "W bio tylko nazwa salonu", type: "issue", description: "Bio zawiera wylacznie nazwe salonu, brak lokalizacji, specjalizacji, CTA. Nowa osoba nie zostanie, bo nie wie co tu znajdzie.", recommendation: "Dodaj: co robi salon, gdzie sie znajduje, jak sie umowic. Np. 'Koloryzacja & Stylizacja ✂️ Nowy Sącz 📍 Link poniżej ⬇️'" },
          { id: "ig_bio_generic", label: "Bio generyczne 'Salon beauty. Zapraszamy ❤️'", type: "issue", description: "Bio brzmi jak u kazdego salonu: 'Salon beauty 💇‍♀️ Zapraszamy ❤️'. Zero wyroznikow, zero konkretow, mogloby byc o dowolnym salonie.", recommendation: "Dodaj konkrety: specjalizacja, lokalizacja, unikalna oferta. Np. 'Koloryzacja | Keratyna | Nowy Sacz | Umow sie ⬇️'." },
          { id: "ig_bio_no_location", label: "Brak lokalizacji w bio", type: "issue", description: "W bio nie ma informacji o lokalizacji salonu. Klientka nie wie czy salon jest w jej miescie i scrolluje dalej.", recommendation: "Dodaj miasto lub dzielnice w bio. Lokalizacja to kluczowy filtr dla klientek szukajacych salonu w okolicy." },
          { id: "ig_bio_no_specialty", label: "Brak specjalizacji w bio", type: "issue", description: "Bio nie mowi czym salon sie specjalizuje. 'Salon beauty' to za malo, klientka szuka koloryzacji, keratyny, stylizacji.", recommendation: "Wymien 2-3 glowne specjalizacje w bio. Klientki szukaja konkretnych uslug, nie ogolnikow." },
          { id: "ig_bio_essay", label: "Za dlugie bio bez struktury", type: "issue", description: "Bio to dlugi tekst ciagly bez struktury. Na telefonie jest nieczytelne i trudne do przeskanowania wzrokiem.", recommendation: "Bio musi byc zwiezle i skanowalne. Uzyj emoji jako separatorow, krotkich fraz. Max 150 znakow." },
          
          // Link i CTA
          { id: "ig_no_link", label: "Brak linku do rezerwacji w bio", type: "issue", description: "W bio brakuje linku do rezerwacji lub kontaktu. Klientki nie maja jak latwo umowic wizyte.", recommendation: "Dodaj link do rezerwacji online (Booksy, Moment, etc.) lub Linktree z opcjami kontaktu." },
          { id: "ig_link_broken", label: "Niedziałajacy link w bio", type: "issue", description: "Link w bio prowadzi do strony 404, nieaktualnej oferty lub nie laduje sie na telefonie. Klientka odpada.", recommendation: "Sprawdz link na telefonie. Upewnij sie ze kieruje do rezerwacji lub aktualnej strony. Testuj co tydzien." },
          { id: "ig_link_homepage", label: "Link kieruje na strone glowna zamiast rezerwacji", type: "issue", description: "Link w bio kieruje na ogolna strone www salonu zamiast bezposrednio do rezerwacji. Klientka musi klikac dalej i czesc odpada.", recommendation: "Link w bio powinien prowadzic bezposrednio do rezerwacji lub Linktree z przyciskiem 'Umow wizyte' na gorze." },
          
          // Highlights
          { id: "ig_highlights_missing", label: "Zero highlights na profilu", type: "issue", description: "Profil nie ma zadnych highlights. Tracisz szanse na zaprezentowanie oferty, efektow i opinii nowym obserwujacym.", recommendation: "Stworz highlights: Cennik, Efekty, Opinie, Salon, FAQ. To Twoja 'strona glowna' na Instagramie." },
          { id: "ig_highlights_no_covers", label: "Highlights bez spojnych okladek", type: "issue", description: "Highlights sa, ale bez okladek, losowe screeny ze stories. Nie buduja profesjonalnego wizerunku.", recommendation: "Zaprojektuj spojne okladki w kolorach marki. Prosty styl: ikona + kolor tla. Spojnosc > kreatywnosc." },
          { id: "ig_highlights_random_names", label: "Highlights z niezrozumialymi nazwami", type: "issue", description: "Highlights maja niezrozumiale nazwy: emoji, skroty, prywatne oznaczenia. Nowa osoba nie wie co kliknac.", recommendation: "Nazwij highlights jasno: Cennik, Efekty, Opinie, FAQ, Rezerwacja. Klientka musi wiedziec co znajdzie w srodku." },
          { id: "ig_highlights_outdated", label: "Nieaktualne cenniki i oferty w highlights", type: "issue", description: "Highlights zawieraja stare cenniki, nieaktualne oferty lub informacje sprzed miesiecy. Klientka widzi ceny ktore juz nie obowiazuja.", recommendation: "Aktualizuj highlights co miesiac. Usun stare oferty, dodaj aktualne cenniki i efekty pracy." },
          { id: "ig_highlights_empty_inside", label: "Highlights z 1-2 stories w srodku", type: "issue", description: "Highlights sa stworzone, ale maja w sobie tylko 1-2 stare stories. Wyglada to na porzucone i niedokonczone.", recommendation: "Kazdy highlight powinien miec min. 5-10 stories. Regularnie dodawaj nowe tresci do istniejacych highlights." },
          
          // Zdjecie profilowe
          { id: "ig_photo_blurry", label: "Rozmazane zdjecie profilowe", type: "issue", description: "Zdjecie profilowe jest rozmazane, ciemne lub nieczytelne w malym rozmiarze. Nie da sie rozpoznac marki w feedzie.", recommendation: "Uzyj prostego, kontrastowego logo lub zdjecia twarzy. Musi byc rozpoznawalne w rozmiarze 40x40 px w feedzie." },
          { id: "ig_photo_effect", label: "Zdjecie efektu pracy jako profilowe", type: "issue", description: "Zdjecie profilowe to zdjecie efektu pracy. W malym rozmiarze jest nieczytelne i nie pelni roli avatara.", recommendation: "Avatar to logo lub portret, NIE efekt pracy. Efekty pracy pokaz w postach i highlights." },
          { id: "ig_photo_group", label: "Grupowe zdjecie jako profilowe", type: "issue", description: "Zdjecie profilowe to grupowe zdjecie. W malym rozmiarze nie da sie nikogo rozpoznac. Nie buduje osobistej marki.", recommendation: "Uzyj zdjecia jednej osoby (wlascicielki) lub logo salonu. Grupowe zdjecia sa dobre na posty, nie na avatar." },
          { id: "ig_photo_different_fb", label: "Inne zdjecie profilowe niz na Facebooku", type: "issue", description: "Zdjecie profilowe na IG jest inne niz na FB. Klientka moze nie rozpoznac, ze to ten sam salon.", recommendation: "Uzyj tego samego zdjecia/logo na wszystkich platformach. Spojnosc = rozpoznawalnosc." },
          
          // Konto
          { id: "ig_not_business", label: "Konto osobiste zamiast firmowego", type: "issue", description: "Profil jest ustawiony jako konto osobiste, co oznacza brak dostepu do statystyk, przyciskow kontaktowych i promocji.", recommendation: "Przejdz na konto firmowe lub twórcy w ustawieniach. Zyskasz statystyki, CTA i mozliwosc promowania postow." },
          { id: "ig_no_contact_buttons", label: "Brak przyciskow kontaktowych na profilu", type: "issue", description: "Profil firmowy nie ma wlaczonych przyciskow kontaktowych (Zadzwon, Email, Jak dojechac). Klientki musza szukac kontaktu same.", recommendation: "Dodaj przyciski kontaktowe w ustawieniach profilu firmowego. Telefon + email + adres, latwy kontakt jednym kliknieciem." },
          { id: "ig_handle_confusing", label: "Nazwa uzytkownika trudna do zapamiętania", type: "issue", description: "Nazwa uzytkownika jest skomplikowana: cyfry, podkreslniki, skroty. Klientki nie zapamietaja i nie znajda profilu.", recommendation: "Uprość nazwe: nazwaslonu lub imie.salon.miasto. Bez cyfer i losowych znakow. Latwa do zapamiętania i znalezienia." },
        ]
      },
      {
        id: "ig_feed",
        name: "Spojnosc feedu",
        findings: [
          // Pozytywne
          { id: "ig_feed_consistent", label: "Spójny wizualnie feed", type: "positive", description: "Feed ma spojna palete kolorow i styl. Profil wyglada profesjonalnie na pierwszy rzut oka." },
          { id: "ig_feed_regular", label: "Regularne publikacje min. 3x/tydzień", type: "positive", description: "Posty pojawiają się regularnie minimum 3 razy w tygodniu. Algorytm nagradza konsekwencję wyższymi zasięgami." },
          { id: "ig_feed_mix", label: "Mix formatów: zdjęcia, karuzele, reelsy", type: "positive", description: "Feed zawiera różne formaty treści: zdjęcia, karuzele edukacyjne, reelsy. Każdy format przyciąga inną grupę." },
          { id: "ig_feed_bright", label: "Jasne, dobrze oświetlone zdjęcia", type: "positive", description: "Zdjęcia w feedzie są jasne i atrakcyjne. Dobre oświetlenie przyciąga uwagę i buduje profesjonalny wizerunek." },
          // Błędy
          { id: "ig_feed_chaotic", label: "Chaotyczny feed z roznymi filtrami i stylami", type: "issue", description: "Feed jest wizualnie niespojny: rozne filtry, kolory, style zdjec. Profil nie buduje profesjonalnego wizerunku.", recommendation: "Wybierz 2-3 kolory przewodnie i jeden preset na zdjecia. Planuj feed wizualnie (aplikacja Preview lub Later)." },
          { id: "ig_feed_dark", label: "Ciemne zdjecia dominuja w feedzie", type: "issue", description: "Wiekszosc zdjec w feedzie jest ciemna. Zle oswietlenie sprawia ze efekty pracy sa ledwo widoczne.", recommendation: "Inwestuj w oswietlenie (ring light). Edytuj zdjecia: podkrecaj jasnosc, kontrast, cieplo. Spojny preset pomoze." },
          { id: "ig_feed_only_photos", label: "Tylko jeden format tresci w feedzie", type: "issue", description: "Feed zawiera wylacznie jeden typ tresci (np. same zdjecia efektow). Brakuje karuzeli, grafik, reelsow.", recommendation: "Zaplanuj mix: zdjecia efektow, karuzele edukacyjne, reelsy, grafiki z tipami. Kazdy format przyciaga inna grupe." },
          { id: "ig_feed_dead", label: "Brak postow od wielu tygodni", type: "issue", description: "Ostatni post byl opublikowany wiele tygodni temu. Profil wyglada na porzucony. Nowe osoby nie zaobserwuja 'martwego' profilu.", recommendation: "Wroc do regularnych publikacji natychmiast. Zacznij od 2-3 postow/tydzien i zwieksz do 4-5." },
          { id: "ig_feed_rare", label: "Rzadkie posty, 1 na tydzien lub mniej", type: "issue", description: "Posty pojawiaja sie sporadycznie, za rzadko, zeby budowac relacje i byc widocznym w algorytmie.", recommendation: "Publikuj minimum 3-4x w tygodniu. Konsekwencja jest wazniejsza niz perfekcja, lepiej regularnie niz idealnie." },
          { id: "ig_feed_grid_ugly", label: "Brzydka siatka feedu z gory", type: "issue", description: "Patrzac na feed z lotu ptaka (siatka 3 kolumny), zdjecia nie tworza estetycznej calosci. Kolory i kadry gryzą sie.", recommendation: "Planuj feed w siatce: naprzemian zdjecia, grafiki, reelsy. Uzywaj aplikacji Preview zeby widziec efekt przed publikacja." },
          { id: "ig_feed_reposts_only", label: "Feed pelny repostow z TikToka", type: "issue", description: "Feed jest pelny repostow z TikToka z widocznym znakiem wodnym. Wyglada to na leniwe kopiowanie zamiast tworzenia dedykowanych tresci.", recommendation: "Twórz tresci dedykowane na Instagram lub usuwaj znak wodny TikToka. Instagram karze zasiegi postow z logiem TikToka." },
        ]
      },
      {
        id: "ig_stories",
        name: "Stories",
        findings: [
          // Pozytywne
          { id: "ig_stories_regular", label: "Regularne publikowanie stories", type: "positive", description: "Stories sa publikowane regularnie. To buduje relacje z obserwujacymi i utrzymuje widocznosc w algorytmie." },
          { id: "ig_stories_interactive", label: "Interaktywne stories z ankietami i quizami", type: "positive", description: "Stories wykorzystują ankiety, pytania i quizy. Angażują obserwujących i budują relację." },
          { id: "ig_stories_face", label: "Właścicielka pokazuje się w stories", type: "positive", description: "W stories pojawia się twarz właścicielki/stylistki. Klientki widzą kto stoi za marką. Buduje to osobistą relację." },
          { id: "ig_stories_variety", label: "Różnorodne stories: kulisy, efekty, relacje", type: "positive", description: "Stories pokazują kulisy pracy, efekty, relacje z klientkami. Autentyczność buduje silniejsze połączenie z marką." },
          // Błędy
          { id: "ig_stories_none", label: "Zero stories na profilu", type: "issue", description: "Stories nie sa w ogole publikowane. To najsilniejszy kanal do budowania relacji z klientkami i pomijanie go to stracona szansa.", recommendation: "Zacznij od minimum 2-3 stories dziennie. Pokaz kulisy pracy, proces, efekty, poranki w salonie." },
          { id: "ig_stories_rare", label: "Stories kilka razy w miesiacu", type: "issue", description: "Stories pojawiaja sie sporadycznie, kilka w miesiacu. To za malo, zeby budowac relacje i byc w swiadomosci klientek.", recommendation: "Publikuj stories CODZIENNIE. Min. 3-5 dziennie. Stories znikaja po 24h, to format na ilosc, nie jakosc." },
          { id: "ig_stories_no_interact", label: "Brak ankiet, pytan i quizow", type: "issue", description: "Stories nie wykorzystuja elementow interaktywnych: zero ankiet, pytan, quizow. Obniza zaangazowanie i zasiegi.", recommendation: "Dodaj min. 1 interaktywny element dziennie: ankieta, quiz, pytanie, suwak. Algorytm nagradza interakcje." },
          { id: "ig_stories_only_reposts", label: "Stories to tylko reposty wlasnych postow", type: "issue", description: "Stories sa uzywane tylko do udostepniania wlasnych postow. Brak oryginalnych tresci, kulis, interakcji.", recommendation: "Stories to miejsce na autentycznosc: kulisy, relacje na zywo, pytania, ankiety. Reposty postow to max 20% stories." },
          { id: "ig_stories_no_face", label: "Wlascicielka nigdy nie pojawia sie w stories", type: "issue", description: "W stories nigdy nie pojawia sie twarz wlascicielki/stylistki. Klientki nie widzą kto stoi za marką. Brak osobistej relacji.", recommendation: "Pokaz siebie! Klientki kupuja od ludzi, nie od logo. Mow do kamery, pokazuj kulisy, dziel sie historiami." },
          { id: "ig_stories_blurry_dark", label: "Ciemne, slabej jakosci stories", type: "issue", description: "Stories sa ciemne, rozmazane, nagrywane w zlych warunkach. Wyglada to amatorsko i zniecheca do ogladania.", recommendation: "Nagrywaj w dobrym swietle, czysc obiektyw. Stories nie musza byc idealne, ale musza byc CZYTELNE." },
          { id: "ig_stories_too_many_text", label: "Stories z ogromna iloscia tekstu", type: "issue", description: "Stories sa zaladowane tekstem, wygladaja jak ulotka. Nikt nie czyta dlugich tekstow na stories, scrolluja dalej.", recommendation: "Stories to format wizualny. Max 2-3 krotkie zdania. Jesli masz duzo do napisania, uzyj karuzeli na feedzie." },
          { id: "ig_stories_no_music", label: "Stories bez muzyki i dzwieku", type: "issue", description: "Stories sa wrzucane bez muzyki: ciche, nudne, bez energii. Muzyka dodaje emocji i zatrzymuje uwage.", recommendation: "Dodawaj trendowa muzyke do stories. Nawet do zdjec, muzyka sprawia ze stories sa bardziej angazujace." },
          { id: "ig_stories_screenshot_only", label: "Stories to screenshoty postow lub grafik", type: "issue", description: "Stories sa zrzutami ekranu z postow, stron lub grafik. Niska jakosc, obciete kadry, nieczytelne.", recommendation: "Twórz dedykowane tresci na stories. Uzyj szablonow w Canva jesli potrzebujesz grafik." },
        ]
      }
    ]
  },
  {
    id: "content",
    name: "Analiza tresci",
    description: "Tresci to fundament obecnosci online. Dobre zdjecia, angazujace opisy i regularnosc to trzy filary, ktore decyduja o zasiegach i konwersji.",
    enabledByDefault: true,
    subSections: [
      {
        id: "content_copy",
        name: "Copywriting i opisy",
        findings: [
          // Pozytywne
          { id: "content_copy_good", label: "Angażujące, storytellingowe opisy", type: "positive", description: "Opisy postow opowiadaja historie, buduja emocje i prowadza do dzialania. To wyroznia profil na tle konkurencji." },
          { id: "content_copy_cta_present", label: "Wyraźne CTA w każdym poście", type: "positive", description: "Każdy post kończy się wezwaniem do działania. Klientki wiedzą co zrobić: napisać, zadzwonić, zarezerwować." },
          { id: "content_copy_personal", label: "Spersonalizowane, unikalne opisy", type: "positive", description: "Każdy post ma unikalny, spersonalizowany opis. Opowiada inną historię, używa różnych formatów. Żadne kopiuj-wklej." },
          { id: "content_copy_structured", label: "Dobrze sformatowane teksty", type: "positive", description: "Opisy są czytelnie sformatowane: krótkie akapity, emoji separatory, hook na początku. Łatwe do czytania na telefonie." },
          // Błędy
          { id: "content_copy_missing", label: "Posty calkowicie bez opisow", type: "issue", description: "Posty sa publikowane bez jakiegokolwiek opisu, samo zdjecie. Algorytm nie wie jak klasyfikowac tresci i nie promuje ich.", recommendation: "KAZDY post musi miec opis. Min. 3-5 zdan. Bez opisu post jest niewidoczny dla algorytmu i bezwartosciowy dla klientek." },
          { id: "content_copy_minimal", label: "Minimalne opisy, 1-2 slowa lub emoji", type: "issue", description: "Opisy to pojedyncze slowa lub emotikony: 'Efekt', '💇‍♀️✨', 'Zapraszamy'. Zero wartosci, zero personalizacji.", recommendation: "Rozbuduj opisy: opowiedz o procesie, uzytych produktach, efekcie. Min. 3-5 zdan. Uzyj emocji i storytellingu." },
          { id: "content_copy_template", label: "Szablonowe, kopiowane opisy", type: "issue", description: "Kazdy post ma identyczny schemat opisu, te same frazy, ten sam uklad. Wyglada jak automat, nie jak czlowiek.", recommendation: "Personalizuj kazdy opis. Opowiedz cos nowego: historie klientki, wyzwanie, proces. Kazdy post to unikalna historia." },
          { id: "content_copy_weak", label: "Suche opisy bez emocji", type: "issue", description: "Opisy sa dluzsze, ale czysto informacyjne, brzmia jak z katalogu uslug, zero emocji i osobowosci.", recommendation: "Uzywaj formuly AIDA: Attention (hook), Interest (historia), Desire (efekt), Action (CTA). Pisz jak do przyjaciolki." },
          { id: "content_copy_no_structure", label: "Sciany tekstu bez formatowania", type: "issue", description: "Teksty to dlugie bloki tekstu bez akapitow, emoji i formatowania. Na telefonie sa nieczytelne i nikt ich nie czyta.", recommendation: "Formatuj: krotkie akapity (2-3 zdania), emoji jako separatory, kluczowe zdania na poczatku. Czytelnosc = zaangazowanie." },
          { id: "content_copy_no_cta", label: "Posty bez wezwania do dzialania", type: "issue", description: "Posty nie maja CTA. Klientki nie wiedza co zrobic po przeczytaniu. Ogladaja i scrolluja dalej.", recommendation: "Kazdy post konczy sie CTA: 'Napisz KOLOR', 'Link w bio', 'Umow sie na konsultacje'. Bez CTA = brak konwersji." },
          { id: "content_copy_errors", label: "Bledy ortograficzne i gramatyczne w postach", type: "issue", description: "Posty zawieraja bledy ortograficzne i gramatyczne, co obniza postrzeganie profesjonalizmu salonu.", recommendation: "Sprawdzaj teksty przed publikacja. Uzyj narzedzi jak LanguageTool lub poproś kogoś o korekte." },
          { id: "content_copy_ai_generic", label: "Widocznie pisane przez AI bez personalizacji", type: "issue", description: "Opisy brzmia jak wygenerowane przez ChatGPT: generyczne frazy, sztuczny ton, brak autentycznosci. Klientki to czuja.", recommendation: "AI moze pomoc, ale MUSISZ personalizowac: dodaj wlasne emocje, imie klientki, konkretne szczegoly. Autentycznosc > perfekcja." },
        ]
      },
      {
        id: "content_photos",
        name: "Jakosc zdjec i wideo",
        findings: [
          // Pozytywne
          { id: "content_photos_pro", label: "Profesjonalna jakość zdjęć", type: "positive", description: "Zdjecia sa dobrze oswietlone, ostre, z neutralnym tlem. Buduja zaufanie do jakosci uslug." },
          { id: "content_photos_ba_quality", label: "Spójne before/after w tych samych warunkach", type: "positive", description: "Zdjęcia before/after są robione w identycznych warunkach: to samo światło, kąt i dystans. Wiarygodny dowód jakości." },
          { id: "content_photos_video_present", label: "Regularne treści wideo", type: "positive", description: "Profil zawiera regularne treści wideo: reelsy, metamorfozy, timelapse. Wideo generuje 2-3x więcej zasięgów." },
          { id: "content_photos_setup", label: "Profesjonalne stanowisko do zdjęć", type: "positive", description: "Salon ma przygotowane stanowisko foto z dobrym oświetleniem i neutralnym tłem. Każde zdjęcie wygląda profesjonalnie." },
          // Błędy
          { id: "content_photos_dark", label: "Ciemne zdjecia ze zlym oswietleniem", type: "issue", description: "Zdjecia sa ciemne i zle oswietlone. Efekty pracy sa ledwo widoczne. W branzy beauty zdjecie = dowod jakosci.", recommendation: "Ring light (ok. 100 zl), neutralne tlo, ten sam kat. Rob 3-5 zdjec i wybieraj najlepsze." },
          { id: "content_photos_blurry", label: "Rozmazane, nieostrze zdjecia", type: "issue", description: "Zdjecia sa nieostrze, robione w ruchu lub z brudnym obiektywem. Profesjonalny efekt na rozmazanym zdjeciu jest stracony.", recommendation: "Czysc obiektyw telefonu, ustabilizuj reke lub uzyj statywu. Rob zdjecia w dobrym swietle, telefon lepiej ostrzy." },
          { id: "content_photos_bad_bg", label: "Balagan w tle zdjec", type: "issue", description: "Na zdjeciach widac balagan: produkty, reczniki, inne klientki, nieuporzadkowane stanowisko. Tlo odciaga uwage od efektu.", recommendation: "Przygotuj czyste, neutralne tlo. Zrob 'kat foto' w salonie: dobre tlo, oswietlenie, kilka rekwizytow." },
          { id: "content_photos_bad_angle", label: "Zle kadry i katy zdjec", type: "issue", description: "Zdjecia sa robione z niewlasciwego kata. Efekt pracy nie jest widoczny, proporcje sa znieksztalcone.", recommendation: "Fotografuj z poziomu oczu lub lekko z gory. Unikaj zdjec z dolu. Kadruj na efekt, nie na calą postac." },
          { id: "content_photos_no_video", label: "Calkowity brak tresci wideo", type: "issue", description: "Profil nie zawiera zadnych tresci wideo. Reels i wideo maja 2-3x wyzsze zasiegi niz zdjecia statyczne.", recommendation: "Zacznij od prostych formatow: metamorfoza 10 sek., POV klientki, timelapse procesu. Nie potrzebujesz profesjonalnego sprzetu." },
          { id: "content_photos_no_ba", label: "Brak zdjec before/after", type: "issue", description: "Profil nie pokazuje transformacji w formacie before/after, czyli najskuteczniejszym formacie w branzy beauty.", recommendation: "Fotografuj kazda metamorfoze: before i after w tych samych warunkach. To Twoj najsilniejszy dowod jakosci." },
          { id: "content_photos_inconsistent_ba", label: "Niespojne zdjecia before/after", type: "issue", description: "Zdjecia before i after sa robione w roznych warunkach: inne oswietlenie, inny kat, inny dystans. Efekt nie jest wiarygodny.", recommendation: "Before i after w TYCH SAMYCH warunkach: to samo swiatlo, ten sam kat, ten sam dystans. Wtedy efekt mowi sam za siebie." },
          { id: "content_photos_only_close_ups", label: "Same zblizenia bez kontekstu", type: "issue", description: "Zdjecia sa samymi zblizeniami efektow, brak zdjec twarzy, calej sylwetki, kontekstu. Klientka nie widzi pelnego efektu.", recommendation: "Dodaj zdjecia calosciowe: twarz + wlosy, cala sylwetka, detale. Roznorodnosc kadrów pokazuje efekt lepiej." },
          { id: "content_photos_collage_overuse", label: "Naduzywanie kolazy zamiast pojedynczych zdjec", type: "issue", description: "Wiekszosc postow to kolaze 4-6 zdjec w jednym. Na telefonie sa male, nieczytelne, nie robia wrazenia.", recommendation: "Publikuj pojedyncze, duze zdjecia lub karuzele (swipe). Kolaz to relikt, karuzela jest lepsza pod kazdy wzgledem." },
        ]
      },
      {
        id: "content_hashtags",
        name: "Strategia hashtagow",
        findings: [
          // Pozytywne
          { id: "content_hashtags_good", label: "Strategiczny dobór hashtagów", type: "positive", description: "Hashtagi sa dobrane strategicznie: mix popularnych, niszowych i lokalnych. Zwieksza to widocznosc postow." },
          { id: "content_hashtags_local", label: "Hashtagi lokalne z miastem", type: "positive", description: "Hashtagi zawierają nazwę miasta i regionu. Profil jest widoczny dla lokalnych klientek szukających salonu." },
          { id: "content_hashtags_rotated", label: "Rotacja zestawów hashtagów", type: "positive", description: "Hashtagi są rotowane między postami. Różne zestawy unikają efektu spam i docierają do szerszej grupy." },
          // Błędy
          { id: "content_hashtags_none", label: "Calkowity brak hashtagow", type: "issue", description: "Posty nie maja hashtagow. Sa niewidoczne w wyszukiwarce Instagram i Explore. Stracona szansa na nowe osoby.", recommendation: "Dodaj hashtagi do KAZDEGO posta. Przygotuj 3-4 zestawy hashtagow i rotuj je miedzy postami." },
          { id: "content_hashtags_random", label: "Losowe, przypadkowe hashtagi", type: "issue", description: "Hashtagi sa przypadkowe, nie pasuja do tresci posta. Np. #love #instagood pod zdjeciem metamorfozy.", recommendation: "Uzyj 15-20 hashtagow: 5 popularnych branżowych, 5 niszowych, 5 lokalnych. Dopasowuj do tresci konkretnego posta." },
          { id: "content_hashtags_same", label: "Te same hashtagi pod kazdym postem", type: "issue", description: "Pod kazdym postem sa identyczne hashtagi. Algorytm to rozpoznaje i moze traktowac jako spam.", recommendation: "Przygotuj 3-5 zestawow hashtagow i rotuj je. Dopasowuj hashtagi do konkretnej tresci posta." },
          { id: "content_hashtags_too_popular", label: "Tylko mega popularne hashtagi", type: "issue", description: "Uzywane sa tylko super popularne hashtagi (#beauty, #hair) z milionami postow. Twoj post ginie w tlumie w sekundy.", recommendation: "Miksuj: popularne (100k-1M), niszowe (10k-100k), lokalne (miasto + branza). Niszowe daja realna widocznosc." },
          { id: "content_hashtags_no_local", label: "Brak hashtagow lokalnych", type: "issue", description: "Hashtagi nie zawieraja nazwy miasta ani regionu. Profil nie jest widoczny dla lokalnych klientek szukajacych salonu.", recommendation: "Dodaj hashtagi z miastem: #fryzjerNowySacz, #salonKrakow, #beautyWarszawa. To dociera do klientek z okolicy." },
          { id: "content_hashtags_in_comments", label: "Hashtagi w komentarzu zamiast w opisie", type: "issue", description: "Hashtagi sa dodawane w pierwszym komentarzu. Instagram zmienil algorytm i teraz hashtagi w opisie dzialaja lepiej.", recommendation: "Dodawaj hashtagi na koncu opisu, nie w komentarzu. Algorytm IG lepiej indeksuje hashtagi z tresci posta." },
          { id: "content_hashtags_banned", label: "Uzywanie zbanowanych hashtagow", type: "issue", description: "Uzywane sa hashtagi, ktore Instagram zbanowal lub ograniczyl. To moze obnizac zasiegi calego konta.", recommendation: "Sprawdz kazdy hashtag w wyszukiwarce IG. Jesli nie pokazuje najnowszych postow, jest zbanowany. Usun go." },
        ]
      },
      {
        id: "content_frequency",
        name: "Regularnosc publikacji",
        findings: [
          // Pozytywne
          { id: "content_freq_regular", label: "Regularne publikacje 3-4x na tydzień", type: "positive", description: "Posty sa publikowane regularnie, minimum 3-4 razy w tygodniu. Algorytm nagradza konsekwencje." },
          { id: "content_freq_planned", label: "Zaplanowany kalendarz treści", type: "positive", description: "Salon ma plan publikacji. Treści są zaplanowane z wyprzedzeniem, co eliminuje przerwy i stres." },
          { id: "content_freq_good_times", label: "Publikacje o optymalnych godzinach", type: "positive", description: "Posty są publikowane w godzinach największej aktywności grupy docelowej (11-13 i 18-21). Maksymalne zasięgi." },
          // Błędy
          { id: "content_freq_dead", label: "Brak postow od wielu tygodni", type: "issue", description: "Ostatni post byl opublikowany wiele tygodni temu. Profil wyglada na porzucony, nikt nie zaobserwuje martwego konta.", recommendation: "Wroc do regularnych publikacji NATYCHMIAST. Zacznij od 2-3 postow/tydzien i zwieksz do 4-5. Plan tresci to klucz." },
          { id: "content_freq_irregular", label: "Seria postow, potem tygodnie ciszy", type: "issue", description: "Publikacje sa nieregularne: tydzien po 5 postow, potem 2 tygodnie ciszy. Algorytm karze za takie przerwy.", recommendation: "Ustal plan publikacji: min. 3 posty/tydzien + codzienne stories. Zaplanuj tresci na caly miesiac z gory." },
          { id: "content_freq_rare", label: "Jeden post na tydzien lub rzadziej", type: "issue", description: "Posty pojawiaja sie raz na tydzien lub rzadziej. Profil traci widocznosc, algorytm przestaje go promowac.", recommendation: "Zwieksz czestotliwosc do min. 3-4x/tydzien. Przygotuj kalendarz tresci, planowanie eliminuje stres." },
          { id: "content_freq_no_schedule", label: "Brak planu publikacji", type: "issue", description: "Tresci sa publikowane 'kiedy przyjdzie ochota', brak systemu i planowania. To prowadzi do nieregularnosci.", recommendation: "Zaplanuj tresci na tydzien lub miesiac z gory. Ustal dni i godziny publikacji. Regularnosc > perfekcja." },
          { id: "content_freq_wrong_times", label: "Publikacje o zlych godzinach", type: "issue", description: "Posty sa publikowane o godzinach kiedy grupa docelowa nie jest aktywna, np. rano w poniedzialek lub poznym wieczorem.", recommendation: "Najlepsze godziny: 11-13 i 18-21. Sprawdz statystyki konta (Insights), tam zobaczysz kiedy Twoi obserwujacy sa aktywni." },
          { id: "content_freq_flood", label: "Za duzo postow jednego dnia", type: "issue", description: "Salon publikuje 3-5 postow jednego dnia, potem cisza. Zalewanie feedu nie buduje zasiegow, irytuje obserwujacych.", recommendation: "Max 1-2 posty dziennie. Rozloz tresci rownomiernie. Lepiej codziennie 1 post niz 5 jednego dnia." },
        ]
      }
    ]
  },
  {
    id: "stories_reels",
    name: "Stories & Reels",
    description: "Reels to najsilniejszy format na Instagramie pod katem zasiegow. Stories buduja relacje. Razem tworza fundament strategii contentowej.",
    enabledByDefault: true,
    subSections: [
      {
        id: "sr_reels",
        name: "Formaty Reels",
        findings: [
          // Pozytywne
          { id: "sr_reels_active", label: "Aktywne publikowanie Reels", type: "positive", description: "Reelsy sa publikowane regularnie z dobra jakoscia. To najlepszy sposob na zdobywanie nowych obserwujacych organicznie." },
          { id: "sr_reels_edited", label: "Dobrze zmontowane reelsy z hookiem", type: "positive", description: "Reelsy mają dynamiczny montaż, hook w pierwszych 3 sekundach i trendową muzykę. Zatrzymują uwagę widzów." },
          { id: "sr_reels_subtitles", label: "Reelsy z napisami", type: "positive", description: "Reelsy mają napisy. Większość osób ogląda bez dźwięku, napisy zapewniają że treść dotrze do wszystkich." },
          { id: "sr_reels_trending", label: "Wykorzystanie trendowych dźwięków", type: "positive", description: "Reelsy korzystają z trendowych dźwięków i formatów. Algorytm promuje treści z popularnymi audio." },
          { id: "sr_reels_diverse", label: "Różnorodne formaty reelsów", type: "positive", description: "Reelsy są w różnych formatach: metamorfozy, POV, timelapse, tutorial, Q&A. Różnorodność utrzymuje zainteresowanie." },
          // Błędy
          { id: "sr_reels_none", label: "Zero Reels na profilu", type: "issue", description: "Profil nie ma w ogole reelsow. To rezygnacja z formatu, ktory generuje 2-3x wiecej zasiegow niz zwykle posty.", recommendation: "Zacznij od prostych formatow: metamorfoza 10 sek., POV klientki, timelapse procesu. Codziennie trendowa muzyka." },
          { id: "sr_reels_rare", label: "Sporadyczne Reels, 1-2 w miesiacu", type: "issue", description: "Reelsy pojawiaja sie za rzadko. Algorytm nie promuje profilu w Explore jesli reelsy sa sporadyczne.", recommendation: "Publikuj min. 3-4 reelsy tygodniowo. Regularnosc jest kluczowa, algorytm nagradza konsekwentnych tworcow." },
          { id: "sr_reels_dark", label: "Ciemne Reels ze zlym oswietleniem", type: "issue", description: "Reelsy sa ciemne i zle oswietlone. Efekty pracy sa ledwo widoczne. Klientka scrolluje dalej.", recommendation: "Ring light lub naturalne swiatlo z okna. Jasne, dobrze oswietlone reelsy maja wyzszy wskaznik ogladania." },
          { id: "sr_reels_no_edit", label: "Reels bez montazu, surowe nagrania", type: "issue", description: "Reelsy sa publikowane bez zadnego montazu: dlugie, monotonne ujecia bez ciec. Pierwsze 3 sekundy decyduja.", recommendation: "Hook w pierwszych 3 sek., dynamiczny montaz (szybkie ciecia), trendowa muzyka, napisy. Max 15-30 sek." },
          { id: "sr_reels_no_trends", label: "Brak wykorzystania trendow w Reels", type: "issue", description: "Reelsy nie wykorzystuja trendowych dzwiekow i formatow. Trendy pomagaja algorytmowi promowac tresci.", recommendation: "Codziennie sprawdzaj zakladke Reels, szukaj trendowych dzwiekow i dopasuj je do swojej branzy." },
          { id: "sr_reels_too_long", label: "Za dlugie Reels ponad 60 sekund", type: "issue", description: "Reelsy sa za dlugie. Widzowie odpadaja po kilku sekundach. Krotsze reelsy maja wyzszy wskaznik ogladania.", recommendation: "Skroc reelsy do 15-30 sek. Jesli historia jest dluzsza, podziel na serię. Tempo = retencja." },
          { id: "sr_reels_no_text", label: "Reels bez napisow i tekstu", type: "issue", description: "Reelsy nie maja napisow. Wiekszosc osob oglada bez dzwieku. Bez napisow tracisz polowe widzow.", recommendation: "Dodaj napisy do KAZDEGO reelsa. Mozesz uzyc automatycznych napisow w IG lub dodac je w CapCut." },
          { id: "sr_reels_no_hook", label: "Brak hooka w pierwszych 3 sekundach", type: "issue", description: "Reelsy zaczynaja sie nudno, brak zaskoczenia, pytania czy wow efektu. Widzowie scrolluja w pierwszych sekundach.", recommendation: "Pierwsze 3 sekundy decyduja! Zacznij od efektu koncowego, zaskakujacego zdania lub dynamicznej metamorfozy." },
          { id: "sr_reels_shaky", label: "Trzesace sie, niestabilne nagrania", type: "issue", description: "Reelsy sa nagrane trzesaca sie reka. Wyglada to amatorsko i jest mezczace dla oka.", recommendation: "Uzyj statywu lub stabilizatora. Nawet tani statyw za 40 zl robi ogromna roznice w jakosci nagran." },
          { id: "sr_reels_no_cta", label: "Reels bez wezwania do dzialania", type: "issue", description: "Reelsy nie koncza sie CTA. Widz ogladal, ale nie wie co zrobic dalej. Zero konwersji z zasiegow.", recommendation: "Koncz reelsa CTA: 'Napisz mi', 'Link w bio', 'Zaobserwuj po wiecej'. Napisy na ekranie + glos." },
          { id: "sr_reels_tiktok_watermark", label: "Reels z widocznym znakiem wodnym TikToka", type: "issue", description: "Reelsy maja widoczne logo TikToka. Instagram karze takie tresci obnizonymi zasiegami.", recommendation: "Nagrywaj osobno na IG i TikTok, lub usun znak wodny przed wrzuceniem. Instagram promuje oryginalne tresci." },
          { id: "sr_reels_same_format", label: "Wszystkie Reels w tym samym formacie", type: "issue", description: "Kazdy reels wyglada tak samo: ten sam kat, ta sama muzyka, ten sam montaz. Monotonnosc zniecheca widzow.", recommendation: "Rotuj formaty: metamorfoza, POV, timelapse, tutorial, Q&A, trending audio. Roznorodnosc utrzymuje zainteresowanie." },
        ]
      },
      {
        id: "sr_interaction",
        name: "Interakcje w stories",
        findings: [
          // Pozytywne
          { id: "sr_interact_good", label: "Aktywne interakcje w stories", type: "positive", description: "Stories wykorzystuja ankiety, pytania, quizy. To buduje zaangazowanie i relacje z obserwujacymi." },
          { id: "sr_interact_dialogue", label: "Dwustronna komunikacja z obserwującymi", type: "positive", description: "Salon odpowiada na wiadomości do stories i prowadzi dialog z klientkami. Buduje to lojalność i zaufanie." },
          { id: "sr_interact_link_sticker", label: "Naklejka z linkiem do rezerwacji", type: "positive", description: "Stories zawierają naklejkę z linkiem do rezerwacji. Jeden klik = umówiona wizyta." },
          { id: "sr_interact_countdown", label: "Odliczania do wydarzeń i promocji", type: "positive", description: "Stories wykorzystują odliczania do premier usług, promocji i wydarzeń. Buduje to oczekiwanie i zaangażowanie." },
          // Błędy
          { id: "sr_interact_none", label: "Zero elementow interaktywnych w stories", type: "issue", description: "Stories nie maja zadnych ankiet, pytan ani quizow. Interaktywne stories zwiekszaja engagement nawet o 40%.", recommendation: "Dodaj min. 1 interaktywny element dziennie. Pomysly: 'Blond czy braz?', 'Jaki kolor na wiosne?', 'Pytania do mnie!'" },
          { id: "sr_interact_passive", label: "Stories jednostronne bez dialogu z obserwujacymi", type: "issue", description: "Stories sa jednostronne. Salon publikuje, ale nie zadaje pytan, nie zaczepka obserwujacych. Brak dialogu = slabe relacje.", recommendation: "Zadawaj pytania, rob ankiety, uzywaj 'zadaj mi pytanie'. Odpowiadaj na kazda wiadomosc, nawet krotko." },
          { id: "sr_interact_no_reply", label: "Brak odpowiedzi na wiadomosci do stories", type: "issue", description: "Wiadomosci od obserwujacych w odpowiedzi na stories pozostaja bez odpowiedzi. To niszczy relacje i zniecheca.", recommendation: "Odpowiadaj na KAZDA wiadomosc, nawet krotko. To buduje lojalnosc. Ustaw quick replies na najczestsze pytania." },
          { id: "sr_interact_no_countdown", label: "Brak odliczan do wydarzen i promocji", type: "issue", description: "Stories nie wykorzystuja naklejki 'Odliczanie' do promocji, wydarzen, premier uslug. Stracona szansa na budowanie oczekiwania.", recommendation: "Uzywaj odliczan do: premier uslug, promocji, powrotow po urlopie. Klientki moga ustawic przypomnienie." },
          { id: "sr_interact_no_link_sticker", label: "Brak naklejki z linkiem w stories", type: "issue", description: "Stories nie wykorzystuja naklejki z linkiem do rezerwacji. Klientka musi sama szukac linka w bio.", recommendation: "Dodawaj naklejke z linkiem do rezerwacji w stories z efektami pracy. Jeden klik = rezerwacja." },
        ]
      }
    ]
  },
  {
    id: "branding",
    name: "Spojnosc wizerunkowa",
    description: "Spojny wizerunek = profesjonalizm. Klientka widzac posty na IG, FB i stronie powinna od razu rozpoznac marke salonu.",
    enabledByDefault: false,
    subSections: [
      {
        id: "brand_visual",
        name: "Identyfikacja wizualna",
        findings: [
          // Pozytywne
          { id: "brand_visual_ok", label: "Spójna identyfikacja wizualna", type: "positive", description: "Logo, kolory i styl grafik sa spojne na wszystkich platformach. Marka jest rozpoznawalna." },
          { id: "brand_logo_pro", label: "Profesjonalne, czytelne logo", type: "positive", description: "Logo jest proste, czytelne nawet w małym rozmiarze i spójne z branżą beauty. Buduje rozpoznawalność marki." },
          { id: "brand_colors_consistent", label: "Spójna paleta kolorów marki", type: "positive", description: "Salon konsekwentnie używa 2-3 kolorów marki na wszystkich grafikach, postach i materiałach. Buduje to rozpoznawalność." },
          { id: "brand_templates_used", label: "Spójne szablony grafik", type: "positive", description: "Grafiki są tworzone z użyciem spójnych szablonów: te same czcionki, kolory, styl. Feed wygląda profesjonalnie." },
          { id: "brand_watermark", label: "Znak wodny na zdjęciach efektów", type: "positive", description: "Zdjęcia efektów pracy mają delikatny znak wodny z logo/nazwą. Chroni treści i buduje rozpoznawalność." },
          // Błędy
          { id: "brand_no_logo", label: "Brak profesjonalnego logo", type: "issue", description: "Salon nie ma profesjonalnego logo. Uzywa tekstu, losowego symbolu lub w ogole nic. Brak rozpoznawalnosci.", recommendation: "Zainwestuj w proste, czytelne logo. Nie musi byc drogie, wazne zeby bylo spojne i rozpoznawalne." },
          { id: "brand_logo_unreadable", label: "Logo nieczytelne w malym rozmiarze", type: "issue", description: "Logo ma za duzo detali i jest nieczytelne jako zdjecie profilowe (40x40 px). Traci swoja funkcje identyfikacyjna.", recommendation: "Uprość logo: mniej detali, wiekszy kontrast. Moze potrzebujesz uproszczonej wersji na social media." },
          { id: "brand_logo_different", label: "Rozne logo na roznych platformach", type: "issue", description: "Na Facebooku jest inne logo niz na Instagramie i stronie. Klientka nie wie czy to ten sam salon.", recommendation: "Uzyj tego samego logo (lub wariantu) wszedzie. Spojnosc buduje rozpoznawalnosc i zaufanie." },
          { id: "brand_colors_messy", label: "Niespojna paleta kolorow na grafikach", type: "issue", description: "Rozne kolory na roznych platformach i grafikach, brak spojnej identyfikacji wizualnej. Profil wyglada chaotycznie.", recommendation: "Wybierz 2-3 kolory marki i uzywaj ich wszedzie: grafiki, highlights, szablony, tlo zdjec." },
          { id: "brand_no_templates", label: "Brak szablonow grafik", type: "issue", description: "Grafiki sa robione za kazdym razem od zera: rozne czcionki, kolory, style. Feed wyglada nieprofesjonalnie.", recommendation: "Stworz 3-5 szablonow w Canva (post, story, cennik, promo) i uzywaj ich konsekwentnie." },
          { id: "brand_mixed_fonts", label: "Rozne czcionki na kazdej grafice", type: "issue", description: "Kazda grafika uzywa innej czcionki. Brak spojnosci typograficznej obniza postrzeganie profesjonalizmu.", recommendation: "Wybierz max 2 czcionki: jedna na naglowki, jedna na tekst. Uzywaj ich konsekwentnie na wszystkich grafikach." },
          { id: "brand_canva_defaults", label: "Domyslne szablony Canva bez personalizacji", type: "issue", description: "Grafiki to gotowe szablony Canva uzyite bez zmian, te same co u tysiecy innych profili. Zero unikalnosci.", recommendation: "Edytuj szablony: zmien kolory na swoje, dodaj logo, dostosuj czcionki. Szablon to poczatek, nie efekt koncowy." },
          { id: "brand_logo_old", label: "Przestarzale logo z lat 90/2000", type: "issue", description: "Logo wyglada na stare: przestarzaly styl, efekty 3D, cienie, niezgrabna czcionka. Nie pasuje do nowoczesnego salonu.", recommendation: "Odswierz logo do nowoczesnego, minimalistycznego stylu. Proste linie, czytelna czcionka, max 2 kolory." },
          { id: "brand_no_watermark", label: "Zdjecia efektow bez znaku wodnego", type: "issue", description: "Zdjecia efektow pracy nie maja znaku wodnego. Konkurencja lub inne profile moga je krasć i uzywac jako swoje.", recommendation: "Dodaj delikatny znak wodny (logo lub @nazwa) do kazdego zdjecia efektu. Chroni tresci i buduje rozpoznawalnosc." },
        ]
      },
      {
        id: "brand_tone",
        name: "Ton komunikacji",
        findings: [
          // Pozytywne
          { id: "brand_tone_ok", label: "Spójny ton komunikacji", type: "positive", description: "Komunikacja jest spojna: ten sam styl, jezyk i emocje we wszystkich kanalach. Buduje to rozpoznawalnosc." },
          { id: "brand_tone_warm", label: "Ciepły, osobisty ton komunikacji", type: "positive", description: "Salon komunikuje się ciepło i osobiście. Klientki czują relację z marką, co buduje lojalność." },
          { id: "brand_tone_personality", label: "Wyrazista osobowość marki", type: "positive", description: "Profil ma wyrazistą osobowość: własny głos, styl i charakter. Wyróżnia się na tle szablonowej konkurencji." },
          // Błędy
          { id: "brand_tone_mixed", label: "Niespojny ton, raz formalny raz luzny", type: "issue", description: "Ton komunikacji zmienia sie miedzy postami, raz formalny, raz slangowy. Brak jednolitego glosu marki.", recommendation: "Ustal ton: przyjazny i profesjonalny. Mow do klientek jak do przyjaciolki, ale z szacunkiem." },
          { id: "brand_tone_cold", label: "Zbyt formalny, sztywny ton komunikacji", type: "issue", description: "Komunikacja brzmi jak z korporacji: sztywna, bezosobowa. W branzy beauty klientki szukaja ciepla i relacji.", recommendation: "Pisz cieplo, personalnie. Uzywaj imion, emocji, opowiadaj historie. Klientka ma czuc, ze pisze do niej czlowiek." },
          { id: "brand_tone_no_personality", label: "Brak osobowosci marki w komunikacji", type: "issue", description: "Profil nie ma wyrazistej osobowosci. Posty moglyby byc z dowolnego salonu. Zero elementow wyrozniajacych.", recommendation: "Zdefiniuj osobowosc marki: co Cie wyroznia? Humor? Profesjonalizm? Edukacja? Konsekwentnie komunikuj te cechy." },
          { id: "brand_tone_too_casual", label: "Zbyt potoczny jezyk w postach", type: "issue", description: "Posty sa pisane zbyt potocznie: slang, skroty, brak dbania o jezyk. Czesc klientek moze to odebrac jako nieprofesjonalne.", recommendation: "Balans: pisz przystepnie, ale z klasa. Przyjazny ton ≠ brak kultury jezyka. Unikaj skrotow i slangowych zwrotow." },
          { id: "brand_tone_sells_too_hard", label: "Ciagla sprzedaz zamiast budowania relacji", type: "issue", description: "Kazdy post to reklama: kupuj, rezerwuj, promocja. Klientki nie chca ciagle czuc presji zakupowej.", recommendation: "Zasada 80/20: 80% wartosci (porady, efekty, kulisy), 20% sprzedazy. Buduj relacje, sprzedaz przyjdzie naturalnie." },
        ]
      },
      {
        id: "brand_cross_platform",
        name: "Spojnosc miedzy platformami",
        findings: [
          // Pozytywne
          { id: "brand_cross_ok", label: "Spójna prezentacja na wszystkich platformach", type: "positive", description: "Salon wyglada tak samo na FB, IG, Google i stronie www. Klientka od razu rozpoznaje marke." },
          { id: "brand_cross_linked", label: "Platformy linkują do siebie nawzajem", type: "positive", description: "Na każdej platformie są linki do pozostałych. Klientka łatwo znajdzie salon wszędzie." },
          { id: "brand_cross_same_info", label: "Spójne dane na wszystkich platformach", type: "positive", description: "Ten sam adres, telefon, godziny i nazwa na FB, IG, Google i stronie. Zero dezorientacji." },
          // Błędy
          { id: "brand_cross_different_names", label: "Rozne nazwy na roznych platformach", type: "issue", description: "Na FB salon nazywa sie inaczej niz na IG i Google. Klientki nie wiedza czy to ten sam salon.", recommendation: "Ujednolic nazwe na wszystkich platformach. Ta sama nazwa = latwe znajdowanie i rozpoznawalnosc." },
          { id: "brand_cross_different_info", label: "Rozne informacje na roznych platformach", type: "issue", description: "Na FB sa inne godziny niz na Google, inny telefon niz na stronie. Klientka nie wie komu ufac.", recommendation: "Sprawdz i zaktualizuj dane na WSZYSTKICH platformach jednoczesnie. Ten sam adres, telefon, godziny wszedzie." },
          { id: "brand_cross_abandoned_platform", label: "Porzucona platforma z przestarzalymi danymi", type: "issue", description: "Jedna z platform (np. FB) jest calkowicie porzucona: stare posty, nieaktualne dane. Klientki trafiaja tu i tracą zaufanie.", recommendation: "Albo usun/ukryj porzucona platforme, albo zaktualizuj podstawowe dane. Porzucony profil szkodzi wizerunkowi." },
          { id: "brand_cross_no_linking", label: "Platformy nie linkuja do siebie nawzajem", type: "issue", description: "Na IG nie ma linku do FB, na FB nie ma linku do IG. Klientki nie wiedza ze salon jest na innych platformach.", recommendation: "Dodaj linki do wszystkich profili nawzajem: IG ↔ FB ↔ Strona ↔ Google. Ulatwij klientkom znalezienie Cie wszedzie." },
        ]
      }
    ]
  },
  {
    id: "competition",
    name: "Analiza konkurencji",
    description: "Wiekszosc salonow beauty nie inwestuje w profesjonalny marketing. To ogromna szansa wyroznienia sie na tle konkurencji.",
    enabledByDefault: false,
    subSections: [
      {
        id: "comp_local",
        name: "Konkurencja lokalna",
        findings: [
          // Pozytywne
          { id: "comp_local_ahead", label: "Salon wyprzedza lokalną konkurencję", type: "positive", description: "Na tle lokalnej konkurencji salon wyroznia sie profesjonalnym marketingiem, regularnymi publikacjami i spojnym wizerunkiem." },
          { id: "comp_local_more_reviews_us", label: "Więcej opinii niż konkurencja", type: "positive", description: "Salon ma więcej pozytywnych opinii na Google niż lokalna konkurencja. To buduje zaufanie i wyższą pozycję w mapach." },
          { id: "comp_local_better_content", label: "Lepsza jakość treści niż konkurencja", type: "positive", description: "Zdjęcia, opisy i reelsy salonu są wyraźnie lepszej jakości niż u lokalnej konkurencji. Buduje to przewagę." },
          { id: "comp_local_unique_offer", label: "Unikalna oferta niedostępna u konkurencji", type: "positive", description: "Salon oferuje usługi lub specjalizacje, których nie ma lokalna konkurencja. To naturalny wyróżnik." },
          // Błędy
          { id: "comp_local_strong_rival", label: "Silna konkurencja z profesjonalnym marketingiem", type: "issue", description: "W okolicy dziala salon z profesjonalnym marketingiem: regularnie publikuje, ma reklamy, aktywne opinie. Przejmuje klientki.", recommendation: "Przeanalizuj co robi konkurencja dobrze i zrob to LEPIEJ. Wyroznik to klucz, znajdz cos czego oni nie robia." },
          { id: "comp_local_more_reviews", label: "Konkurencja ma wiecej opinii na Google", type: "issue", description: "Lokalne salony maja znacznie wiecej opinii na Google. Klientki porownuja i wybieraja te z wyzsza ocena i wieksza liczba.", recommendation: "Zacznij aktywnie zbierac opinie. SMS po wizycie z linkiem. Cel: przewyzszyc konkurencje w ciagu 3-6 miesiecy." },
          { id: "comp_local_more_followers", label: "Konkurencja ma wiecej obserwujacych", type: "issue", description: "Lokalne salony maja wiecej obserwujacych na IG/FB. Wieksza spolecznosc = wiecej zasiegow i rekomendacji.", recommendation: "Skup sie na jakosci, nie ilości. Regularnosc + reelsy + interakcje = organiczny wzrost. Rozważ współprace lokalne." },
          { id: "comp_local_runs_ads", label: "Konkurencja prowadzi reklamy platne", type: "issue", description: "Konkurencyjne salony inwestuja w reklamy Meta Ads i docieraja do nowych klientek w okolicy. Bez reklam tracisz potencjalne klientki.", recommendation: "Zacznij od reklam na zasieg lub wiadomosci. Min. 10-20 zl/dzien. Targetuj kobiety w promieniu 10-15 km." },
          { id: "comp_local_better_photos", label: "Konkurencja ma lepsze zdjecia", type: "issue", description: "Zdjecia u konkurencji sa jasne, profesjonalne, z neutralnym tlem. Buduja wyzsze zaufanie niz obecne zdjecia salonu.", recommendation: "Zainwestuj w ring light i neutralne tlo. Rób 3-5 zdjec i wybieraj najlepsze. Jakosc zdjec = postrzeganie jakosci uslug." },
          { id: "comp_local_better_reels", label: "Konkurencja publikuje lepsze Reels", type: "issue", description: "Lokalne salony publikuja dynamiczne, trendowe reelsy z montazem. Zdobywaja zasiegi i nowych obserwujacych.", recommendation: "Zacznij nagrywac reelsy: metamorfozy, POV klientki, timelapse. Uzywaj trendowej muzyki. Min. 3-4 reelsy/tydzien." },
          { id: "comp_local_booking_online", label: "Konkurencja ma rezerwacje online", type: "issue", description: "Konkurencyjne salony maja rezerwacje online (Booksy, Moment). Klientki moga umawiac sie 24/7. Bez tego tracisz klientki.", recommendation: "Wdróż system rezerwacji online. Booksy lub Moment, klientki oczekuja mozliwosci rezerwacji o dowolnej porze." },
          { id: "comp_local_website", label: "Konkurencja ma profesjonalna strone www", type: "issue", description: "Lokalne salony maja nowoczesne strony z cennikiem, galeria i rezerwacja. Wygladaja bardziej profesjonalnie.", recommendation: "Stworz prosta, responsywna strone: cennik, galeria efektow, rezerwacja online. Nawet prosta strona > brak strony." },
          { id: "comp_local_better_branding", label: "Konkurencja ma lepsza identyfikacje wizualna", type: "issue", description: "Konkurencyjne salony maja spojne logo, kolory i szablony grafik. Wygladaja bardziej profesjonalnie i wiarygodnie.", recommendation: "Zainwestuj w spojną identyfikacje wizualna: logo, paleta kolorow, szablony. To wyroznia profesjonalistow od amatorow." },
          { id: "comp_local_better_stories", label: "Konkurencja ma aktywniejsze stories", type: "issue", description: "Konkurencja codziennie publikuje angazujace stories z ankietami i kulis. Buduje silniejsze relacje z klientkami.", recommendation: "Zacznij publikowac stories codziennie. Pokaz kulisy, angazuj ankietami, mow do kamery. Relacja = lojalnosc." },
        ]
      },
      {
        id: "comp_positioning",
        name: "Pozycjonowanie marki",
        findings: [
          // Pozytywne
          { id: "comp_pos_unique", label: "Salon ma wyraźny wyróżnik na rynku", type: "positive", description: "Salon ma jasno zdefiniowany wyroznik: specjalizacje, unikalna usluge lub styl komunikacji, ktory przyciaga klientki." },
          { id: "comp_pos_specialty_clear", label: "Jasna specjalizacja i nisza", type: "positive", description: "Salon jest rozpoznawany jako specjalista w konkretnej dziedzinie. To przyciąga klientki szukające eksperta." },
          { id: "comp_pos_premium", label: "Pozycjonowanie jako salon premium", type: "positive", description: "Salon skutecznie pozycjonuje się jako premium. Jakość usług, komunikacja i wizerunek uzasadniają wyższe ceny." },
          // Błędy
          { id: "comp_pos_no_usp", label: "Brak wyroznika na tle konkurencji", type: "issue", description: "Salon nie ma wyraznego wyroznika na tle konkurencji: te same uslugi, podobne ceny, generyczna komunikacja. Klientka nie wie dlaczego wybrac wlasnie ten salon.", recommendation: "Zdefiniuj USP: co robi TEN salon lepiej? Specjalizacja, doswiadczenie, podejscie, atmosfera? Komunikuj to konsekwentnie." },
          { id: "comp_pos_no_specialty", label: "Brak wyraznej specjalizacji", type: "issue", description: "Salon oferuje wszystko, ale nie specjalizuje sie w niczym konkretnym. 'Robimy wszystko' = 'Nie robimy nic wybitnie'.", recommendation: "Wybierz 1-2 glowne specjalizacje i komunikuj je jako ekspert. Lepiej byc znanym z jednej rzeczy niz nieznanym z wielu." },
          { id: "comp_pos_price_war", label: "Konkurowanie wylacznie cena", type: "issue", description: "Salon konkuruje glownie niska cena, a to sciganie w dol. Klientki szukajace najtanszego salonu nie sa lojalne.", recommendation: "Konkuruj WARTOSCIA, nie cena. Pokaz jakosc, doswiadczenie, efekty. Klientki platne za pewnosc, nie za najtansza cene." },
          { id: "comp_pos_no_niche", label: "Brak niszy rynkowej", type: "issue", description: "Salon celuje w 'wszystkich' zamiast w konkretna grupe klientek. Komunikacja jest generyczna i nie trafia do nikogo.", recommendation: "Wybierz nisze: blond specialist, koloryzacja, keratyna, stylizacja slubna. Nisza = mniejsza konkurencja + wyzsze ceny." },
          { id: "comp_pos_invisible", label: "Salon niewidoczny na tle konkurencji", type: "issue", description: "Konkurencja jest bardziej widoczna w social media, Google i reklamach. Salon ginie w tlumie mimo dobrej jakosci uslug.", recommendation: "Zwieksz widocznosc: regularne posty, reelsy, opinie Google, reklamy. Dobra usluga to za malo, trzeba byc WIDOCZNYM." },
          { id: "comp_pos_copycat", label: "Kopiowanie stylu konkurencji zamiast wlasnego", type: "issue", description: "Salon kopiuje styl komunikacji konkurencji zamiast rozwijac wlasny glos. Klientki widza 'kopie' zamiast oryginalu.", recommendation: "Inspiruj sie, ale nie kopiuj. Znajdz SWOJ styl, SWOJ glos, SWOJA unikalna cechę. Oryginalnosc przyciaga." },
        ]
      },
      {
        id: "comp_opportunities",
        name: "Szanse rynkowe",
        findings: [
          // Pozytywne
          { id: "comp_opp_exploited", label: "Salon wykorzystuje luki rynkowe", type: "positive", description: "Salon identyfikuje i wykorzystuje szanse, ktorych konkurencja nie widzi. To buduje przewage konkurencyjna." },
          { id: "comp_opp_collabs", label: "Aktywne współprace lokalne", type: "positive", description: "Salon współpracuje z lokalnymi influencerkami i twórcami. Cross-promocja generuje nowych klientek." },
          { id: "comp_opp_seasonal_active", label: "Aktywne kampanie sezonowe", type: "positive", description: "Salon planuje kampanie sezonowe z wyprzedzeniem: wesela, studniówki, święta. Wykorzystuje każdą okazję." },
          // Błędy
          { id: "comp_opp_no_education", label: "Konkurencja nie edukuje, szansa na eksperta", type: "issue", description: "Zadna lokalna konkurencja nie publikuje tresci edukacyjnych. To szansa na pozycje eksperta w regionie.", recommendation: "Zacznij publikowac tipy, porady, edukacje. Klientki szukaja wiedzy, pokaz sie jako ekspert i buduj zaufanie." },
          { id: "comp_opp_no_reels_local", label: "Konkurencja nie robi Reels, szansa na zasiegi", type: "issue", description: "Lokalna konkurencja nie publikuje reelsow lub robi to sporadycznie. To szansa na zdobycie zasiegow i nowych klientek.", recommendation: "Zacznij publikowac reelsy TERAZ. Na rynku bez konkurencji nawet proste reelsy zdobywaja duze zasiegi." },
          { id: "comp_opp_no_collab", label: "Brak wspólprac lokalnych", type: "issue", description: "Salon nie wspólpracuje z lokalnymi influencerkami, fotografami, makeup artists. To stracona szansa na cross-promocje.", recommendation: "Nawiaz wspolprace z lokalnymi tworcami: wymiana uslug za tresci, wspolne live'y, polecenia. Win-win dla obu stron." },
          { id: "comp_opp_seasonal", label: "Brak ofert sezonowych", type: "issue", description: "Salon nie wykorzystuje sezonow (wesela, studniowki, swieta) do promocji. Konkurencja moze przejmowac te okazje.", recommendation: "Planuj kampanie sezonowe z wyprzedzeniem: pakiety slubne, studniowkowe, swiateczne. Promuj 4-6 tygodni wczesniej." },
          { id: "comp_opp_no_referral", label: "Brak programu polecen", type: "issue", description: "Salon nie ma programu polecen. Klientki nie maja motywacji do polecania salonu znajomym.", recommendation: "Wprowadz program polecen: rabat dla polecajacej i nowej klientki. Proste, skuteczne i tanie." },
          { id: "comp_opp_no_events", label: "Brak wydarzen i dni otwartych", type: "issue", description: "Salon nie organizuje wydarzen: dni otwartych, warsztatow, live'ow. To okazja do przyciagniecia nowych klientek.", recommendation: "Organizuj mini-wydarzenia: warsztaty pielegnacji, live'y z poradami, dni otwarte z gratisowymi konsultacjami." },
        ]
      }
    ]
  },
  {
    id: "paid_ads",
    name: "Reklamy platne",
    description: "Reklamy platne Meta Ads pozwalaja dotrzec do nowych klientek w okolicy. Dobrze skonfigurowana kampania moze przyniesc nowe rezerwacje w ciagu dni.",
    enabledByDefault: false,
    subSections: [
      {
        id: "ads_campaigns",
        name: "Kampanie reklamowe",
        findings: [
          // Pozytywne
          { id: "ads_active", label: "Aktywne kampanie reklamowe", type: "positive", description: "Salon prowadzi aktywne kampanie reklamowe na Facebooku/Instagramie. To przyspiesza pozyskiwanie nowych klientek." },
          { id: "ads_good_creatives", label: "Atrakcyjne kreacje reklamowe", type: "positive", description: "Kreacje reklamowe są wysokiej jakości: dobre zdjęcia/wideo, chwytliwe nagłówki i wyraźne CTA." },
          { id: "ads_targeted", label: "Precyzyjne targetowanie reklam", type: "positive", description: "Reklamy są precyzyjnie targetowane na grupę docelową: lokalne kobiety zainteresowane beauty. Budżet nie jest marnowany." },
          { id: "ads_video_used", label: "Reklamy wideo z metamorfozami", type: "positive", description: "Kampanie wykorzystują wideo: metamorfozy, before/after z muzyką. Wideo konwertuje 2-3x lepiej niż statyczne zdjęcia." },
          // Błędy
          { id: "ads_none", label: "Zero kampanii reklamowych", type: "issue", description: "Salon nie prowadzi zadnych kampanii platnych. Organiczny zasieg jest ograniczony i nie pozwala na dynamiczny rozwoj bazy klientek.", recommendation: "Profesjonalnie prowadzone kampanie Meta Ads pozwalaja dotrzec do nowych klientek w okolicy w ciagu kilku dni. Precyzyjne targetowanie i optymalizacja budzetu przynosi wymierne efekty." },
          { id: "ads_boosted_only", label: "Tylko promowane posty zamiast kampanii", type: "issue", description: "Salon tylko promuje posty przyciskiem 'Promuj'. To najmniej skuteczna forma reklamy z ograniczonymi opcjami.", recommendation: "Przejdz do Menadzera Reklam, pozwala na precyzyjne targetowanie, A/B testy i optymalizacje pod konwersje." },
          { id: "ads_inactive", label: "Kampanie zostaly wylaczone", type: "issue", description: "Salon prowadzil kampanie, ale je wylaczyl. Brak ciaglości reklamowej oznacza utrate rozpędu i cieplej grupy odbiorcow.", recommendation: "Wlacz kampanie ponownie. Nawet maly budzet (10 zl/dzien) utrzymuje widocznosc i zbiera dane o grupie docelowej." },
          { id: "ads_weak_creatives", label: "Slabe kreacje reklamowe", type: "issue", description: "Kreacje reklamowe sa niskiej jakosci: zle zdjecia, slabe teksty, brak wyraznego CTA. Reklama nie przyciaga uwagi.", recommendation: "Uzyj najlepszych zdjec before/after, napisz chwytliwy naglowek i dodaj jasne CTA (np. 'Umow wizyte')." },
          { id: "ads_no_targeting", label: "Zbyt szerokie targetowanie reklam", type: "issue", description: "Reklamy docieraja do zbyt szerokiej grupy, marnujac budzet na osoby ktore nigdy nie przyjda do salonu.", recommendation: "Targetuj: kobiety, 18-55 lat, promien 10-20 km od salonu, zainteresowania: uroda, hair, salon." },
          { id: "ads_old_creatives", label: "Te same kreacje od miesiecy", type: "issue", description: "Reklamy uzywaja tych samych zdjec i tekstow od dlugiego czasu. Grupa docelowa jest znuzona, CTR spada.", recommendation: "Odswierzaj kreacje co 2-4 tygodnie. Nowe zdjecia, nowe naglowki, nowe CTA. Testyj co dziala najlepiej." },
          { id: "ads_no_video", label: "Reklamy tylko ze zdjeciami, brak wideo", type: "issue", description: "Reklamy uzywaja wylacznie zdjec statycznych. Reklamy wideo maja 2-3x wyzszy engagement i nizszy koszt konwersji.", recommendation: "Przetestuj reklamy wideo: 15-30 sek. metamorfozy, efekty before/after z muzyka. Wideo konwertuje lepiej." },
          { id: "ads_landing_mismatch", label: "Reklama nie pasuje do strony docelowej", type: "issue", description: "Reklama obiecuje cos innego niz strona docelowa. Klientka klika i nie znajduje tego czego szukala. Wysoki bounce rate.", recommendation: "Dopasuj strone docelowa do reklamy. Jesli reklama mowi o koloryzacji, link do strony koloryzacji, nie strony glownej." },
        ]
      },
      {
        id: "ads_strategy",
        name: "Strategia reklamowa",
        findings: [
          // Pozytywne
          { id: "ads_strategy_ok", label: "Przemyślana strategia reklamowa", type: "positive", description: "Salon testuje warianty reklam, ma lejek i optymalizuje kampanie. To profesjonalne podejscie do reklam." },
          { id: "ads_strategy_testing", label: "A/B testowanie wariantów reklam", type: "positive", description: "Kampanie testują różne warianty kreacji, nagłówków i CTA. Dane pokazują co działa najlepiej." },
          { id: "ads_strategy_funnel", label: "Działający lejek reklamowy", type: "positive", description: "Reklamy mają lejek: zimny ruch → retargeting → konwersja. Systematyczne podejście maksymalizuje ROI." },
          // Błędy
          { id: "ads_no_testing", label: "Brak testowania wariantow reklam", type: "issue", description: "Reklamy nie sa testowane w wariantach. Bez testow nie wiadomo co dziala najlepiej, budzet jest marnowany.", recommendation: "Tworz min. 2-3 warianty kazdej reklamy: rozne zdjecia, naglowki, CTA. Porownuj wyniki po 3-5 dniach." },
          { id: "ads_no_funnel", label: "Brak lejka reklamowego", type: "issue", description: "Reklamy kieruja tylko do nowych osob. Brakuje retargetingu na osoby ktore juz widzialy profil lub wchodzily w interakcje.", recommendation: "Stworz lejek: 1) Reklama na zimny ruch, 2) Retargeting na osoby interagujace, 3) Reklama na konwersje." },
          { id: "ads_no_pixel", label: "Brak piksela Facebooka na stronie", type: "issue", description: "Na stronie www nie jest zainstalowany piksel Facebooka. Brak danych o ruchu uniemozliwia retargeting.", recommendation: "Zainstaluj piksel Facebooka na stronie i w systemie rezerwacji. Pozwoli to na precyzyjny retargeting." },
          { id: "ads_low_budget", label: "Zbyt niski budzet reklamowy", type: "issue", description: "Budzet reklamowy jest zbyt niski (np. 5 zl/dzien). Algorytm nie ma wystarczajaco duzo danych do optymalizacji.", recommendation: "Minimalnhy efektywny budzet to 15-20 zl/dzien. Ponizej tego algorytm nie jest w stanie dobrze zoptymalizowac kampanii." },
          { id: "ads_wrong_objective", label: "Zy cel kampanii reklamowej", type: "issue", description: "Kampania ma ustawiony zly cel (np. zasieg zamiast wiadomosci). Generuje wyswietlenia, ale nie konwersje.", recommendation: "Dobierz cel do potrzeby: Wiadomosci (nowe klientki), Ruch (na strone), Zasiegi (budowanie swiadomosci). Cel = wynik." },
          { id: "ads_no_exclusions", label: "Brak wykluczeni w targetowaniu", type: "issue", description: "Reklamy sa pokazywane obecnym klientkom i osobom ktore juz kupily. Marnowany budzet na konwertowanych.", recommendation: "Wyklucz: osoby ktore juz napisaly, odwiedzily strone, obserwujacych. Skieruj budzet na NOWE osoby." },
        ]
      }
    ]
  },
  {
    id: "google_gmb",
    name: "Google / Wizytowka",
    description: "Gdy ktos szuka 'salon fryzjerski' w Google, wizytowka decyduje o wyborze. Kompletna wizytowka z opiniami to darmowa reklama 24/7.",
    enabledByDefault: false,
    subSections: [
      {
        id: "gmb_profile",
        name: "Dane wizytowki",
        findings: [
          // Pozytywne
          { id: "gmb_complete", label: "Kompletna wizytówka Google", type: "positive", description: "Wizytowka Google jest kompletna: aktualne dane, zdjecia, godziny otwarcia. Salon jest latwy do znalezienia." },
          { id: "gmb_photos_many", label: "Dużo aktualnych zdjęć w wizytówce", type: "positive", description: "Wizytówka ma 15+ aktualnych zdjęć: wnętrze, efekty pracy, zespół. To zwiększa zaufanie i konwersję o 42%." },
          { id: "gmb_services_listed", label: "Pełna lista usług z cenami", type: "positive", description: "Wizytówka ma kompletną listę usług z opisami i cenami. Klientki mogą porównać ofertę bez telefonowania." },
          { id: "gmb_posts_active", label: "Regularne posty w wizytówce Google", type: "positive", description: "Salon publikuje posty w Google Business regularnie: oferty, efekty, aktualności. Google nagradza aktywne wizytówki." },
          // Błędy
          { id: "gmb_not_claimed", label: "Wizytowka nie jest przejeta przez wlasciciela", type: "issue", description: "Wizytowka Google nie jest przejeta przez wlasciciela. Ktokolwiek moze dodac bledne informacje lub zdjecia.", recommendation: "Przejmij wizytowke w Google Business Profile. Weryfikacja trwa kilka dni, ale daje pelna kontrole nad profilem." },
          { id: "gmb_no_description", label: "Brak opisu w wizytowce Google", type: "issue", description: "Wizytowka Google nie ma opisu. Klientka widzi tylko nazwe i adres, bez informacji czym salon sie wyroznia.", recommendation: "Napisz opis do 750 znakow: specjalizacje, uslugi, co wyroznia salon. Dodaj slowa kluczowe lokalne." },
          { id: "gmb_no_photos", label: "Brak zdjec w wizytowce Google", type: "issue", description: "Wizytowka Google nie ma zdjec. Wizytowki ze zdjeciami dostaja 42% wiecej zapytan o trase do salonu.", recommendation: "Dodaj min. 10-15 zdjec: wnetrze salonu, efekty pracy, zespol, fasada. Aktualizuj co miesiac." },
          { id: "gmb_few_photos", label: "Za malo zdjec w wizytowce", type: "issue", description: "Wizytowka ma tylko kilka zdjec, za malo zeby przekonac klientke. Konkurencja z 30+ zdjeciami wyglada lepiej.", recommendation: "Dodaj zdjecia do min. 15-20. Dodawaj nowe co tydzien, Google nagradza aktywne wizytowki wyzszą pozycja." },
          { id: "gmb_wrong_hours", label: "Nieaktualne godziny otwarcia w Google", type: "issue", description: "Godziny otwarcia w Google nie odpowiadaja rzeczywistosci. Klientki moga przyjechac na zamkniety salon.", recommendation: "Zaktualizuj godziny do aktualnego grafiku. Dodaj godziny specjalne na swieta. Sprawdzaj co miesiac." },
          { id: "gmb_no_services", label: "Brak listy uslug z cenami w Google", type: "issue", description: "W wizytowce brakuje listy uslug i cennika. Klientki nie wiedza co oferujesz i ile to kosztuje przed wizyta.", recommendation: "Dodaj wszystkie uslugi z opisami i cenami. Klientki czesto porownuja cenniki miedzy salonami w Google." },
          { id: "gmb_wrong_category", label: "Zla kategoria wizytowki Google", type: "issue", description: "Wizytowka ma ustawiona ogolna kategorie. Salon nie pojawia sie w wynikach dla branzy beauty.", recommendation: "Ustaw prawidlowa kategorie glowna (np. Salon fryzjerski) i dodatkowe (np. Salon kosmetyczny, Studio urody)." },
          { id: "gmb_no_posts", label: "Brak postow w wizytowce Google", type: "issue", description: "Wizytowka Google nie ma zadnych postow. Google pozwala publikowac aktualnosci, oferty i wydarzenia, co zwieksza widocznosc.", recommendation: "Publikuj posty w Google Business min. 1x/tydzien: oferty, nowe uslugi, efekty pracy. To darmowa reklama." },
          { id: "gmb_old_photos", label: "Stare zdjecia w wizytowce sprzed lat", type: "issue", description: "Zdjecia w wizytowce sa stare: stary wystroj, stary zespol, stare efekty. Klientka widzi nie aktualy salon.", recommendation: "Usun stare zdjecia i dodaj aktualne. Pokazuj jak salon wyglada TERAZ. Aktualizuj zdjecia co 2-3 miesiace." },
          { id: "gmb_no_qa", label: "Brak odpowiedzi na pytania w wizytowce", type: "issue", description: "Klientki zadaja pytania w sekcji Q&A wizytowki, ale salon na nie nie odpowiada. Pytania pozostaja bez odpowiedzi.", recommendation: "Sprawdzaj sekcje pytan regularnie i odpowiadaj szybko. Mozesz tez dodac odpowiedzi na najczesciej zadawane pytania samodzielnie." },
        ]
      },
      {
        id: "gmb_reviews",
        name: "Opinie Google",
        findings: [
          // Pozytywne
          { id: "gmb_reviews_good", label: "Dużo pozytywnych opinii z odpowiedziami", type: "positive", description: "Salon ma liczne pozytywne opinie na Google z odpowiedziami. To buduje zaufanie i wplywa na ranking w mapach." },
          { id: "gmb_reviews_high_rating", label: "Wysoka średnia ocen 4.8+", type: "positive", description: "Średnia ocen jest powyżej 4.8. Klientki filtrują salony po ocenie i ten salon jest w czołówce." },
          { id: "gmb_reviews_system", label: "System aktywnego zbierania opinii", type: "positive", description: "Salon ma wdrożony system proszenia o opinie: SMS po wizycie, QR kod w salonie. Regularnie przybywa nowych opinii." },
          { id: "gmb_reviews_personal", label: "Spersonalizowane odpowiedzi na opinie", type: "positive", description: "Odpowiedzi na opinie są spersonalizowane: z imieniem, odniesieniem do usługi. Buduje to autentyczność." },
          // Błędy
          { id: "gmb_reviews_zero", label: "Zero opinii na Google", type: "issue", description: "Salon nie ma zadnych opinii na Google. Klientki nie umowia wizyty w salonie bez opinii, brak zaufania.", recommendation: "Zacznij zbierac opinie OD DZIS. Wyslij SMS z linkiem do opinii do zadowolonych klientek po wizycie." },
          { id: "gmb_reviews_few", label: "Za malo opinii, ponizej 20", type: "issue", description: "Salon ma malo opinii na Google. Klientki porownuja liczbe opinii miedzy salonami, a mala liczba nie budzi zaufania.", recommendation: "Pros zadowolone klientki o opinie, najlepiej SMS z linkiem tuz po wizycie. Cel: 2-3 nowe opinie/tydzien." },
          { id: "gmb_reviews_no_reply", label: "Opinie bez odpowiedzi od salonu", type: "issue", description: "Opinie na Google pozostaja bez odpowiedzi. To sygnal dla klientek, ze salon nie dba o feedback.", recommendation: "Odpowiadaj na KAZDA opinie w ciagu 24h, pozytywna i negatywna. Podziekuj, spersonalizuj, zapros ponownie." },
          { id: "gmb_reviews_negative_ignored", label: "Negatywne opinie bez reakcji", type: "issue", description: "Negatywne opinie nie maja zadnej odpowiedzi. Klientki widza to i mysla, ze salon nie dba o klientow.", recommendation: "Odpowiadaj spokojnie i profesjonalnie. Przepros, wyjasn, zaproponuj rozwiazanie. Nigdy nie atakuj." },
          { id: "gmb_reviews_low_rating", label: "Niska srednia ocen ponizej 4.5", type: "issue", description: "Srednia ocen jest ponizej 4.5 gwiazdki. Klientki czesto filtruja salony po ocenie i pomijaja te z nizszą nota.", recommendation: "Popraw jakosc obslugi, aktywnie pros zadowolone klientki o opinie. Odpowiadaj na negatywne i rozwiazuj problemy." },
          { id: "gmb_reviews_generic_replies", label: "Szablonowe odpowiedzi na opinie", type: "issue", description: "Odpowiedzi na opinie sa kopiuj-wklej: 'Dziekujemy za opinie!' pod kazda. Klientki widza brak personalizacji.", recommendation: "Personalizuj kazda odpowiedz: uzyj imienia, odniesh sie do konkretnej uslugi, dodaj cos od siebie. Autentycznosc > szablon." },
          { id: "gmb_reviews_no_system", label: "Brak systemu zbierania opinii", type: "issue", description: "Salon nie ma systemu proszenia o opinie i polega na spontanicznych opiniach. To za malo zeby budowac reputacje.", recommendation: "Wdróz system: SMS z linkiem po wizycie, QR kod w salonie, przypomnienie w social media. Systematycznosc = wyniki." },
          { id: "gmb_reviews_old", label: "Ostatnia opinia sprzed wielu miesiecy", type: "issue", description: "Ostatnia opinia jest sprzed kilku miesiecy. Klientki moga myslee ze salon jest mniej popularny lub zamkniety.", recommendation: "Swieze opinie sa kluczowe. Zacznij aktywnie prosic o opinie po kazdej wizycie. Cel: min. 2 nowe opinie/tydzien." },
        ]
      }
    ]
  },
  {
    id: "website",
    name: "Strona internetowa",
    description: "Strona internetowa to wizytowka 24/7. Ponad 80% klientek przeglada strony na telefonie, responsywnosc jest kluczowa.",
    enabledByDefault: false,
    subSections: [
      {
        id: "web_ux",
        name: "Responsywnosc i UX",
        findings: [
          // Pozytywne
          { id: "web_ux_ok", label: "Responsywna, szybka strona", type: "positive", description: "Strona dziala poprawnie na telefonie. Czytelna, szybka i latwa w nawigacji." },
          { id: "web_booking_present", label: "Rezerwacja online na stronie", type: "positive", description: "Strona oferuje rezerwację online. Klientki mogą umówić wizytę 24/7 bez telefonowania." },
          { id: "web_prices_visible", label: "Przejrzysty cennik na stronie", type: "positive", description: "Strona ma przejrzysty, aktualny cennik. Klientki wiedzą ile zapłacą przed umówieniem wizyty." },
          { id: "web_gallery_present", label: "Galeria efektów pracy na stronie", type: "positive", description: "Strona prezentuje galerię efektów pracy. Klientka widzi jakość usług i buduje zaufanie." },
          { id: "web_testimonials_present", label: "Opinie klientek na stronie", type: "positive", description: "Strona prezentuje opinie klientek. Społeczny dowód słuszności buduje zaufanie skuteczniej niż reklamy." },
          // Błędy
          { id: "web_no_site", label: "Brak strony internetowej", type: "issue", description: "Salon nie ma strony internetowej. Klientki szukajace w Google nie znajda informacji o uslugach i cenach.", recommendation: "Stworz prosta strone: uslugi, cennik, galeria, kontakt, rezerwacja. WordPress lub Squarespace wystarczy." },
          { id: "web_not_responsive", label: "Strona nie dziala na telefonie", type: "issue", description: "Strona nie jest responsywna. Na telefonie jest nieczytelna, elementy sie nakladaja. 80% klientek traci sie tu.", recommendation: "Strona MUSI byc mobile-first. Jesli obecna nie jest responsywna, rozwaz nowa strone na nowoczesnej platformie." },
          { id: "web_slow", label: "Wolne ladowanie strony ponad 3 sekundy", type: "issue", description: "Strona laduje sie dluzej niz 3 sekundy. 53% uzytkownikow porzuca strone ktora laduje sie za dlugo.", recommendation: "Zoptymalizuj zdjecia (max 200 KB), wlacz cache, sprawdz hosting. Test na PageSpeed Insights (Google)." },
          { id: "web_outdated", label: "Przestarzaly design strony", type: "issue", description: "Strona wyglada na przestarzala: staromodny design, male czcionki, brak wspolczesnych elementow. Obniza zaufanie.", recommendation: "Nowoczesna strona salonu beauty: minimalistyczna, z duzymi zdjeciami efektow, latwa rezerwacja i testimonialami." },
          { id: "web_no_booking", label: "Brak rezerwacji online na stronie", type: "issue", description: "Strona nie oferuje rezerwacji online. Klientki oczekuja mozliwosci umowienia wizyty 24/7 bez telefonowania.", recommendation: "Dodaj widget rezerwacji (Booksy, Moment, Calendly). Widoczny przycisk 'Umow wizyte' na kazdej stronie." },
          { id: "web_no_prices", label: "Brak cennika na stronie", type: "issue", description: "Strona nie ma cennika. Klientki musza zadzwonic zeby poznac ceny. Wiekszosc po prostu odejdzie do konkurencji.", recommendation: "Dodaj przejrzysty cennik uslug. Klientki chca wiedziec ile zaplaca PRZED umowieniem wizyty." },
          { id: "web_no_gallery", label: "Brak galerii efektow pracy na stronie", type: "issue", description: "Strona nie pokazuje efektow pracy. Klientka nie widzi jakosci uslug. Galeria to najsilniejszy dowod kompetencji.", recommendation: "Dodaj galerie z najlepszymi efektami pracy. Aktualizuj regularnie. Najlepiej w formacie before/after." },
          { id: "web_no_testimonials", label: "Brak opinii klientek na stronie", type: "issue", description: "Strona nie prezentuje opinii klientek, brak spolecznego dowodu slusznosci. Opinie buduja zaufanie skuteczniej niz reklamy.", recommendation: "Dodaj sekcje z opiniami na stronie glownej. Podlinkuj do Google Reviews. Pokaz realne opinie z imionami." },
          { id: "web_no_about", label: "Brak informacji o salonie i zespole", type: "issue", description: "Strona nie ma sekcji 'O nas'. Klientka nie wie kto stoi za salonem, jakie jest doswiadczenie, jakie wartosci.", recommendation: "Dodaj strone O nas: historia salonu, doswiadczenie, szkolenia, zespol. Klientki chca wiedziec KTO bedzie je obslugiwac." },
          { id: "web_broken_links", label: "Niedziałajace linki na stronie", type: "issue", description: "Na stronie sa linki prowadzace do stron 404 lub nieaktualnych podstron. Obniza wiarygodnosc i irytuje klientki.", recommendation: "Sprawdz wszystkie linki na stronie. Napraw lub usun niedziałajace. Testuj regularnie po zmianach." },
          { id: "web_no_contact", label: "Brak widocznych danych kontaktowych", type: "issue", description: "Dane kontaktowe sa ukryte gleboko w stronie. Klientka musi szukac numeru telefonu czy adresu.", recommendation: "Telefon i adres widoczne w naglowku i stopce kazdej strony. Przycisk 'Zadzwon' widoczny na telefonie." },
          { id: "web_no_ssl", label: "Brak certyfikatu SSL (brak kłódki)", type: "issue", description: "Strona nie ma certyfikatu SSL. Przegladarka pokazuje 'Niezabezpieczone'. Klientki nie ufaja takim stronom.", recommendation: "Zainstaluj certyfikat SSL (czesto za darmo w hostingu). Strona musi zaczynac sie od https://." },
        ]
      },
      {
        id: "web_seo",
        name: "SEO i widocznosc",
        findings: [
          // Pozytywne
          { id: "web_seo_good", label: "Dobra widoczność w Google", type: "positive", description: "Strona pojawia sie wysoko w wynikach Google na lokalne frazy. To generuje staly ruch organiczny." },
          { id: "web_seo_local_optimized", label: "Optymalizacja pod lokalne frazy", type: "positive", description: "Strona jest zoptymalizowana pod lokalne frazy kluczowe, np. 'salon fryzjerski + miasto'. Generuje ruch od lokalnych klientek." },
          { id: "web_seo_meta_set", label: "Poprawne meta tagi i tytuły stron", type: "positive", description: "Każda strona ma unikalne meta tagi z nazwą miasta i specjalizacji. Wyższy CTR w wynikach Google." },
          { id: "web_seo_blog_active", label: "Aktywny blog z treściami SEO", type: "positive", description: "Strona ma aktywny blog z artykułami o pielęgnacji i trendach. Buduje autorytet i pozycję w Google." },
          // Błędy
          { id: "web_seo_invisible", label: "Strona niewidoczna w Google", type: "issue", description: "Strona nie pojawia sie w wynikach wyszukiwania nawet na nazwe salonu. Jest calkowicie niewidoczna.", recommendation: "Sprawdz czy strona jest zaindeksowana w Google Search Console. Dodaj meta tagi, tytuly i opisy do kazdej strony." },
          { id: "web_seo_no_local", label: "Brak optymalizacji pod lokalne frazy", type: "issue", description: "Strona nie jest zoptymalizowana pod frazy typu 'salon fryzjerski Nowy Sacz'. Traci lokalny ruch z Google.", recommendation: "Dodaj lokalne frazy kluczowe w tytulach, opisach i tresciach. Stworz strone z uslugami zawierajaca nazwe miasta." },
          { id: "web_seo_no_content", label: "Brak tekstu na stronie, same zdjecia", type: "issue", description: "Strona ma zdjecia, ale brak tekstu. Google nie wie o czym jest strona i nie moze jej zaindeksowac.", recommendation: "Dodaj opisy uslug, cennik tekstowy, sekcje FAQ, blog. Google potrzebuje tekstu, zeby zrozumiec tematykę strony." },
          { id: "web_seo_no_meta", label: "Brak meta tagow i tytulow stron", type: "issue", description: "Strona nie ma ustawionych meta tagow. W Google wyswietla sie ogolny tytul lub brak opisu. Niska klikalnosc.", recommendation: "Dodaj unikalne tytuly (do 60 znakow) i opisy (do 160 znakow) do kazdej strony. Dodaj nazwe miasta i specjalizacje." },
          { id: "web_seo_no_blog", label: "Brak bloga lub sekcji aktualnosci", type: "issue", description: "Strona nie ma bloga. Brak regularnych tresci obniża pozycje w Google. Blog to najlepszy sposob na SEO.", recommendation: "Zacznij blog: 2-4 artykuly/miesiac. Tematy: porady pielegnacyjne, trendy, FAQ. Uzyj lokalnych slow kluczowych." },
          { id: "web_seo_no_alt", label: "Brak opisow alt na zdjeciach", type: "issue", description: "Zdjecia na stronie nie maja opisow alt. Google nie wie co jest na zdjeciach i nie indeksuje ich w wyszukiwarce grafiki.", recommendation: "Dodaj opisy alt do kazdego zdjecia: 'metamorfoza wlosow blond salon fryzjerski [miasto]'. To pomaga SEO i dostepnosci." },
        ]
      }
    ]
  },
];

export const FIXED_SLIDE_TYPES = ["intro", "recommendations", "summary"] as const;

export function getDefaultEnabledCategories(): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const cat of AUDIT_CATEGORIES) {
    result[cat.id] = cat.enabledByDefault;
  }
  return result;
}

export function getCategoryById(id: string): AuditCategoryDef | undefined {
  return AUDIT_CATEGORIES.find(c => c.id === id);
}

export function getAllCheckedIssues(checkedFindings: Record<string, boolean>): AuditFinding[] {
  const issues: AuditFinding[] = [];
  for (const cat of AUDIT_CATEGORIES) {
    for (const sub of cat.subSections) {
      for (const f of sub.findings) {
        if (checkedFindings[f.id] && f.type === "issue") {
          issues.push(f);
        }
      }
    }
  }
  return issues;
}

export function getCategorySummary(categoryId: string, checkedFindings: Record<string, boolean>): { positives: number; issues: number } {
  const cat = getCategoryById(categoryId);
  if (!cat) return { positives: 0, issues: 0 };
  let positives = 0, issues = 0;
  for (const sub of cat.subSections) {
    for (const f of sub.findings) {
      if (checkedFindings[f.id]) {
        if (f.type === "positive") positives++;
        else issues++;
      }
    }
  }
  return { positives, issues };
}

export function getSubSectionForFinding(findingId: string): string | null {
  for (const cat of AUDIT_CATEGORIES) {
    for (const sub of cat.subSections) {
      for (const f of sub.findings) {
        if (f.id === findingId) return sub.id;
      }
    }
  }
  return null;
}

export function getSubSectionFindingIds(subSectionId: string): string[] {
  for (const cat of AUDIT_CATEGORIES) {
    for (const sub of cat.subSections) {
      if (sub.id === subSectionId) return sub.findings.map(f => f.id);
    }
  }
  return [];
}

export function generateAuditSlides(
  enabledCategories: Record<string, boolean>,
  checkedFindings: Record<string, boolean>,
): AuditSlideData[] {
  const slides: AuditSlideData[] = [{ type: 'intro' }];

  for (const cat of AUDIT_CATEGORIES) {
    if (!enabledCategories[cat.id]) continue;

    if (cat.subSections.length === 0) {
      if (cat.id === "competition") {
        slides.push({ type: 'competition', categoryId: cat.id, categoryName: cat.name });
      }
      continue;
    }

    const summary = getCategorySummary(cat.id, checkedFindings);

    slides.push({
      type: 'category-overview',
      categoryId: cat.id,
      categoryName: cat.name,
      positiveCount: summary.positives,
      issueCount: summary.issues,
    });

    const allChecked: EnrichedFinding[] = [];
    for (const sub of cat.subSections) {
      for (const f of sub.findings) {
        if (checkedFindings[f.id]) {
          allChecked.push({ ...f, subSectionName: sub.name });
        }
      }
    }

    for (let i = 0; i < allChecked.length; i += 3) {
      slides.push({
        type: 'findings',
        categoryId: cat.id,
        categoryName: cat.name,
        findings: allChecked.slice(i, i + 3),
      });
    }
  }

  slides.push({ type: 'recommendations' });
  slides.push({ type: 'summary' });
  return slides;
}

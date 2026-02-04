// Polish declension helper for cities and names
// Converts nominative case to locative (miejscownik) for use in sentences

const cityDeclensions: Record<string, string> = {
  // Cities ending in -a (feminine)
  'Warszawa': 'Warszawie',
  'Kraków': 'Krakowie',
  'Łódź': 'Łodzi',
  'Wrocław': 'Wrocławiu',
  'Poznań': 'Poznaniu',
  'Gdańsk': 'Gdańsku',
  'Szczecin': 'Szczecinie',
  'Bydgoszcz': 'Bydgoszczy',
  'Lublin': 'Lublinie',
  'Białystok': 'Białymstoku',
  'Katowice': 'Katowicach',
  'Gdynia': 'Gdyni',
  'Częstochowa': 'Częstochowie',
  'Radom': 'Radomiu',
  'Sosnowiec': 'Sosnowcu',
  'Toruń': 'Toruniu',
  'Kielce': 'Kielcach',
  'Rzeszów': 'Rzeszowie',
  'Gliwice': 'Gliwicach',
  'Zabrze': 'Zabrzu',
  'Olsztyn': 'Olsztynie',
  'Bielsko-Biała': 'Bielsku-Białej',
  'Bytom': 'Bytomiu',
  'Zielona Góra': 'Zielonej Górze',
  'Rybnik': 'Rybniku',
  'Ruda Śląska': 'Rudzie Śląskiej',
  'Opole': 'Opolu',
  'Tychy': 'Tychach',
  'Gorzów Wielkopolski': 'Gorzowie Wielkopolskim',
  'Płock': 'Płocku',
  'Dąbrowa Górnicza': 'Dąbrowie Górniczej',
  'Elbląg': 'Elblągu',
  'Wałbrzych': 'Wałbrzychu',
  'Włocławek': 'Włocławku',
  'Tarnów': 'Tarnowie',
  'Chorzów': 'Chorzowie',
  'Koszalin': 'Koszalinie',
  'Kalisz': 'Kaliszu',
  'Legnica': 'Legnicy',
  'Grudziądz': 'Grudziądzu',
  'Jaworzno': 'Jaworznie',
  'Słupsk': 'Słupsku',
  'Jastrzębie-Zdrój': 'Jastrzębiu-Zdroju',
  'Nowy Sącz': 'Nowym Sączu',
  'Jelenia Góra': 'Jeleniej Górze',
  'Siedlce': 'Siedlcach',
  'Mysłowice': 'Mysłowicach',
  'Konin': 'Koninie',
  'Piła': 'Pile',
  'Piotrków Trybunalski': 'Piotrkowie Trybunalskim',
  'Inowrocław': 'Inowrocławiu',
  'Lubin': 'Lubinie',
  'Ostrów Wielkopolski': 'Ostrowie Wielkopolskim',
  'Suwałki': 'Suwałkach',
  'Stargard': 'Stargardzie',
  'Gniezno': 'Gnieźnie',
  'Ostrowiec Świętokrzyski': 'Ostrowcu Świętokrzyskim',
  'Siemianowice Śląskie': 'Siemianowicach Śląskich',
  'Głogów': 'Głogowie',
  'Pabianice': 'Pabianicach',
  'Leszno': 'Lesznie',
  'Zamość': 'Zamościu',
  'Łomża': 'Łomży',
  'Żory': 'Żorach',
  'Pruszków': 'Pruszkowie',
  'Ełk': 'Ełku',
  'Tarnowskie Góry': 'Tarnowskich Górach',
  'Tomaszów Mazowiecki': 'Tomaszowie Mazowieckim',
  'Chełm': 'Chełmie',
  'Mielec': 'Mielcu',
  'Kędzierzyn-Koźle': 'Kędzierzynie-Koźlu',
  'Przemyśl': 'Przemyślu',
  'Stalowa Wola': 'Stalowej Woli',
  'Tczew': 'Tczewie',
  'Biała Podlaska': 'Białej Podlaskiej',
  'Bełchatów': 'Bełchatowie',
  'Świdnica': 'Świdnicy',
  'Będzin': 'Będzinie',
  'Zgierz': 'Zgierzu',
  'Piekary Śląskie': 'Piekarach Śląskich',
  'Racibórz': 'Raciborzu',
  'Legionowo': 'Legionowie',
  'Ostrołęka': 'Ostrołęce',
  'Świętochłowice': 'Świętochłowicach',
  'Skierniewice': 'Skierniewicach',
  'Starachowice': 'Starachowicach',
  'Wejherowo': 'Wejherowie',
  'Puławy': 'Puławach',
  'Zawiercie': 'Zawierciu',
  'Brodnica': 'Brodnicy',
  'Ostrów Mazowiecka': 'Ostrowi Mazowieckiej',
  'Sochaczew': 'Sochaczewie',
  'Ciechanów': 'Ciechanowie',
  'Mińsk Mazowiecki': 'Mińsku Mazowieckim',
  'Żyrardów': 'Żyrardowie',
  'Wołomin': 'Wołominie',
  'Otwock': 'Otwocku',
  'Piaseczno': 'Piasecznie',
  'Grodzisk Mazowiecki': 'Grodzisku Mazowieckim',
  'Nowy Dwór Mazowiecki': 'Nowym Dworze Mazowieckim',
  'Kozienice': 'Kozienicach',
  'Marki': 'Markach',
  'Ząbki': 'Ząbkach',
  'Zielonka': 'Zielonce',
  'Kobyłka': 'Kobyłce',
  'Józefów': 'Józefowie',
  'Łuków': 'Łukowie',
  'Garwolin': 'Garwolinie',
  'Biłgoraj': 'Biłgoraju',
  'Hrubieszów': 'Hrubieszowie',
  'Kraśnik': 'Kraśniku',
  'Lubartów': 'Lubartowie',
  'Łęczna': 'Łęcznej',
  'Świdnik': 'Świdniku',
  'Dęblin': 'Dęblinie',
  'Ryki': 'Rykach',
  'Poniatowa': 'Poniatowej',
  'Opoczno': 'Opocznie',
  'Radomsko': 'Radomsku',
  'Wieluń': 'Wieluniu',
  'Zduńska Wola': 'Zduńskiej Woli',
  'Kutno': 'Kutnie',
  'Łowicz': 'Łowiczu',
  'Sieradz': 'Sieradzu',
  'Łęczyca': 'Łęczycy',
  'Aleksandrów Łódzki': 'Aleksandrowie Łódzkim',
  'Konstantynów Łódzki': 'Konstantynowie Łódzkim',
  'Ozorków': 'Ozorkowie',
  'Głowno': 'Głownie',
  'Koluszki': 'Koluszkach',
  'Brzeziny': 'Brzezinach',
  'Kolno': 'Kolnie',
  'Grajewo': 'Grajewie',
  'Augustów': 'Augustowie',
  'Sejny': 'Sejnach',
  'Hajnówka': 'Hajnówce',
  'Siemiatycze': 'Siemiatyczach',
  'Bielsk Podlaski': 'Bielsku Podlaskim',
  'Sokółka': 'Sokółce',
  'Mońki': 'Mońkach',
  'Zambrów': 'Zambrowie',
  'Wysokie Mazowieckie': 'Wysokiem Mazowieckim',
  'Łapy': 'Łapach',
  'Czarna Białostocka': 'Czarnej Białostockiej',
  'Supraśl': 'Supraślu',
  'Wasilków': 'Wasilkowie',
  'Choroszcz': 'Choroszczy',
  'Olecko': 'Olecku',
  'Giżycko': 'Giżycku',
  'Pisz': 'Piszu',
  'Szczytno': 'Szczytnie',
  'Mrągowo': 'Mrągowie',
  'Kętrzyn': 'Kętrzynie',
  'Bartoszyce': 'Bartoszycach',
  'Lidzbark Warmiński': 'Lidzbarku Warmińskim',
  'Braniewo': 'Braniewie',
  'Iława': 'Iławie',
  'Ostróda': 'Ostródzie',
  'Działdowo': 'Działdowie',
  'Nidzica': 'Nidzicy',
  'Nowe Miasto Lubawskie': 'Nowym Mieście Lubawskim',
  'Golub-Dobrzyń': 'Golubiu-Dobrzyniu',
  'Rypin': 'Rypinie',
  'Lipno': 'Lipnie',
  'Radziejów': 'Radziejowie',
  'Aleksandrów Kujawski': 'Aleksandrowie Kujawskim',
  'Ciechocinek': 'Ciechocinku',
  'Nieszawa': 'Nieszawie',
  'Kowal': 'Kowalu',
  'Chełmno': 'Chełmnie',
  'Świecie': 'Świeciu',
  'Nowe': 'Nowem',
  'Sępólno Krajeńskie': 'Sępólnie Krajeńskim',
  'Tuchola': 'Tucholi',
  'Nakło nad Notecią': 'Nakle nad Notecią',
  'Szubin': 'Szubinie',
  'Żnin': 'Żninie',
  'Mogilno': 'Mogilnie',
  'Strzelno': 'Strzelnie',
  'Kruszwica': 'Kruszwicy',
};

// Rules for declining names
function declineByRules(name: string): string {
  const trimmed = name.trim();
  
  // Check dictionary first for exact match (including multi-word cities)
  if (cityDeclensions[trimmed]) {
    return cityDeclensions[trimmed];
  }
  
  // Multi-word names - decline ALL words (Polish locative requires agreement)
  if (trimmed.includes(' ')) {
    const parts = trimmed.split(' ');
    // Check if it's a known compound city first
    if (cityDeclensions[trimmed]) {
      return cityDeclensions[trimmed];
    }
    // Decline each word separately
    return parts.map(part => declineSingleWord(part)).join(' ');
  }

  return declineSingleWord(trimmed);
}

// Decline a single word to locative
export function declineSingleWord(word: string): string {
  if (!word) return '';
  
  // Check dictionary first
  if (cityDeclensions[word]) {
    return cityDeclensions[word];
  }

  // Apply grammatical rules
  const lower = word.toLowerCase();
  
  // Feminine -a endings
  if (lower.endsWith('a')) {
    // -ka, -ga -> -ce, -dze (palatalization)
    if (lower.endsWith('ka')) {
      return word.slice(0, -2) + 'ce';
    }
    if (lower.endsWith('ga')) {
      return word.slice(0, -2) + 'dze';
    }
    // -owa -> -owej
    if (lower.endsWith('owa')) {
      return word.slice(0, -1) + 'ej';
    }
    // -cka, -ska -> -ckiej, -skiej (adjectives)
    if (lower.endsWith('cka') || lower.endsWith('ska')) {
      return word.slice(0, -1) + 'iej';
    }
    // -ia -> -ii
    if (lower.endsWith('ia')) {
      return word.slice(0, -1) + 'i';
    }
    // -ja -> -ji
    if (lower.endsWith('ja')) {
      return word.slice(0, -1) + 'i';
    }
    // Generic -a -> -ie
    return word.slice(0, -1) + 'ie';
  }

  // Neuter -o endings
  if (lower.endsWith('o')) {
    // -no -> -nie
    if (lower.endsWith('no')) {
      return word.slice(0, -1) + 'ie';
    }
    // -wo -> -wie
    if (lower.endsWith('wo')) {
      return word.slice(0, -1) + 'ie';
    }
    // Generic -o -> -ie
    return word.slice(0, -1) + 'ie';
  }

  // Neuter -e endings (places like Zakopane)
  if (lower.endsWith('e')) {
    // -ie -> -iu
    if (lower.endsWith('ie')) {
      return word.slice(0, -2) + 'iu';
    }
    // -ce -> -cu
    if (lower.endsWith('ce')) {
      return word.slice(0, -1) + 'u';
    }
    return word;
  }

  // Adjective masculine endings (for compound city names)
  // -ski -> -skim, -cki -> -ckim
  if (lower.endsWith('ski') || lower.endsWith('cki')) {
    return word + 'm';
  }

  // Masculine endings
  // -ów -> -owie
  if (lower.endsWith('ów')) {
    return word.slice(0, -2) + 'owie';
  }
  // -ew -> -ewie
  if (lower.endsWith('ew')) {
    return word + 'ie';
  }
  // -aw -> -awie
  if (lower.endsWith('aw')) {
    return word + 'ie';
  }
  // -in -> -inie
  if (lower.endsWith('in')) {
    return word + 'ie';
  }
  // -yn -> -ynie
  if (lower.endsWith('yn')) {
    return word + 'ie';
  }
  // -ań -> -aniu
  if (lower.endsWith('ań')) {
    return word.slice(0, -1) + 'niu';
  }
  // -eń -> -eniu
  if (lower.endsWith('eń')) {
    return word.slice(0, -1) + 'niu';
  }
  // -ń -> -niu
  if (lower.endsWith('ń')) {
    return word.slice(0, -1) + 'niu';
  }
  // -sk -> -sku
  if (lower.endsWith('sk')) {
    return word + 'u';
  }
  // -ck -> -cku
  if (lower.endsWith('ck')) {
    return word + 'u';
  }
  // -k -> -ku
  if (lower.endsWith('k')) {
    return word + 'u';
  }
  // -c -> -cu
  if (lower.endsWith('c')) {
    return word + 'u';
  }
  // -ec -> -cu (drop e)
  if (lower.endsWith('ec')) {
    return word.slice(0, -2) + 'cu';
  }
  // -ż -> -żu
  if (lower.endsWith('ż')) {
    return word + 'u';
  }
  // -sz -> -szu
  if (lower.endsWith('sz')) {
    return word + 'u';
  }
  // -cz -> -czu
  if (lower.endsWith('cz')) {
    return word + 'u';
  }
  // -dź -> -dziu
  if (lower.endsWith('dź')) {
    return word.slice(0, -1) + 'ziu';
  }
  // -ł -> -le
  if (lower.endsWith('ł')) {
    return word + 'e';
  }

  // Default: add -ie for consonants
  return word + 'ie';
}

/**
 * Decline a Polish city name to locative case (miejscownik)
 * Used in sentences like "w [mieście]"
 */
export function declineCityToLocative(city: string): string {
  if (!city) return '';
  return declineByRules(city);
}

/**
 * Get owner's first name - keep in nominative case for SMS
 * In modern Polish SMS communication, using the nominative form of names is acceptable and common
 */
export function getOwnerFirstName(name: string): string {
  if (!name) return '';
  return name.trim().split(' ')[0];
}

/**
 * Decline salon name for genitive case
 * Only declines common nouns like "salon", "studio" - leaves business names unchanged
 * "Salon Beauty Kaja" -> "salonu Beauty Kaja" (not "salonu beauty kaji")
 */
export function declineSalonNameToGenitive(salonName: string): string {
  if (!salonName) return '';
  
  const trimmed = salonName.trim();
  const words = trimmed.split(' ');
  
  if (words.length === 0) return trimmed;
  
  // Only decline the first word if it's a common noun
  const firstWord = words[0];
  const firstWordLower = firstWord.toLowerCase();
  
  // Common nouns that should be declined
  const commonNouns: Record<string, string> = {
    'salon': 'salonu',
    'studio': 'studia',
    'centrum': 'centrum',
    'gabinet': 'gabinetu',
    'pracownia': 'pracowni',
    'klinika': 'kliniki',
    'akademia': 'akademii',
    'instytut': 'instytutu',
    'atelier': 'atelier',
    'spa': 'spa',
  };
  
  if (commonNouns[firstWordLower]) {
    // Replace first word with declined version, keep the rest unchanged
    const declinedFirst = commonNouns[firstWordLower];
    // Preserve original casing pattern if capitalized
    const finalFirst = firstWord[0] === firstWord[0].toUpperCase() 
      ? declinedFirst.charAt(0).toUpperCase() + declinedFirst.slice(1)
      : declinedFirst;
    return [finalFirst, ...words.slice(1)].join(' ');
  }
  
  // If first word isn't a common noun, return unchanged
  return trimmed;
}

/**
 * Decline a Polish city name to genitive case (dopełniacz)
 * Used in sentences like "z [miasta]"
 */
export function declineCityToGenitive(city: string): string {
  if (!city) return '';
  
  const trimmed = city.trim();
  
  // Dictionary for common cities - genitive forms
  const cityGenitive: Record<string, string> = {
    'Warszawa': 'Warszawy',
    'Kraków': 'Krakowa',
    'Łódź': 'Łodzi',
    'Wrocław': 'Wrocławia',
    'Poznań': 'Poznania',
    'Gdańsk': 'Gdańska',
    'Szczecin': 'Szczecina',
    'Bydgoszcz': 'Bydgoszczy',
    'Lublin': 'Lublina',
    'Białystok': 'Białegostoku',
    'Katowice': 'Katowic',
    'Gdynia': 'Gdyni',
    'Częstochowa': 'Częstochowy',
    'Radom': 'Radomia',
    'Toruń': 'Torunia',
    'Kielce': 'Kielc',
    'Rzeszów': 'Rzeszowa',
    'Olsztyn': 'Olsztyna',
    'Opole': 'Opola',
    'Płock': 'Płocka',
    'Tarnów': 'Tarnowa',
    'Koszalin': 'Koszalina',
    'Kalisz': 'Kalisza',
    'Legnica': 'Legnicy',
    'Słupsk': 'Słupska',
    'Brodnica': 'Brodnicy',
    'Ostrów Mazowiecka': 'Ostrowi Mazowieckiej',
  };
  
  if (cityGenitive[trimmed]) {
    return cityGenitive[trimmed];
  }
  
  // Apply grammatical rules for genitive
  const lower = trimmed.toLowerCase();
  
  // Feminine -a endings -> -y or -i
  if (lower.endsWith('a')) {
    if (lower.endsWith('ka') || lower.endsWith('ga')) {
      return trimmed.slice(0, -1) + 'i';
    }
    if (lower.endsWith('ca') || lower.endsWith('cza')) {
      return trimmed.slice(0, -1) + 'y';
    }
    return trimmed.slice(0, -1) + 'y';
  }
  
  // Neuter -o endings -> -a
  if (lower.endsWith('o')) {
    return trimmed.slice(0, -1) + 'a';
  }
  
  // Neuter -e endings (plural) -> drop -e or -ø
  if (lower.endsWith('ice') || lower.endsWith('ce')) {
    return trimmed.slice(0, -1);
  }
  
  // Masculine endings -> -a or -u
  if (lower.endsWith('ów')) {
    return trimmed.slice(0, -2) + 'owa';
  }
  
  // Default for masculine: add -a
  return trimmed + 'a';
}

/**
 * Format phone number for display and copying
 * Ensures proper Polish format: +48 XXX XXX XXX
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  
  // If starts with 48, add +
  if (digits.startsWith('48') && digits.length > 9) {
    digits = digits.slice(2);
  }
  
  // Ensure 9 digits for Polish numbers
  if (digits.length === 9) {
    return `+48 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  
  // Return original if can't format
  return phone;
}

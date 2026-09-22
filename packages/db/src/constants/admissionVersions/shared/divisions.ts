import * as v from "valibot";

/**
 * Administrative divisions (Sri Lanka — Southern Province) used by the
 * cascading address selects. Mirrors the id data of the source
 * `aloysius-g1` project's `apps/web/src/lib/g1/divisions.ts` (ids only —
 * bilingual display labels stay in the UI layer).
 */

export const DistrictSchema = v.picklist(["galle", "matara", "hambantota"]);
export type District = v.InferOutput<typeof DistrictSchema>;

export const DivisionSchema = v.picklist([
  // ── Galle ──────────────────────────────────────────────────────────────
  "galle-fg",
  "akmeemana",
  "ambalangoda",
  "baddegama",
  "balapitiya",
  "benthota",
  "bope-poddala",
  "elpitiya",
  "gonapinuwala",
  "habaraduwa",
  "hikkaduwa",
  "imaduwa",
  "karandeniya",
  "madampagama",
  "nagoda",
  "neluwa",
  "niyagama",
  "rathgama",
  "thawalama",
  "waduramba",
  "welivitiya",
  "yakkalamulla",
  // ── Matara ─────────────────────────────────────────────────────────────
  "akuressa",
  "athuraliya",
  "devinuwara",
  "dickwella",
  "hakmana",
  "kamburupitiya",
  "kirinda",
  "kotapola",
  "malimbada",
  "matara-ds",
  "mulatiyana",
  "pasgoda",
  "pitabeddara",
  "thihagoda",
  "weligama",
  "welipitiya",
  // ── Hambantota ─────────────────────────────────────────────────────────
  "ambalantota",
  "angunakolapelessa",
  "beliatta",
  "hambantota-ds",
  "katuwana",
  "lunugamvehera",
  "okewela",
  "sooriyawewa",
  "tangalle",
  "thissamaharama",
  "weeraketiya",
  "walasmulla",
]);
export type Division = v.InferOutput<typeof DivisionSchema>;

/** Divisions belonging to each district — the cascading-select mapping. */
export const DIVISIONS_BY_DISTRICT: Record<District, Division[]> = {
  galle: [
    "galle-fg",
    "akmeemana",
    "ambalangoda",
    "baddegama",
    "balapitiya",
    "benthota",
    "bope-poddala",
    "elpitiya",
    "gonapinuwala",
    "habaraduwa",
    "hikkaduwa",
    "imaduwa",
    "karandeniya",
    "madampagama",
    "nagoda",
    "neluwa",
    "niyagama",
    "rathgama",
    "thawalama",
    "waduramba",
    "welivitiya",
    "yakkalamulla",
  ],
  matara: [
    "akuressa",
    "athuraliya",
    "devinuwara",
    "dickwella",
    "hakmana",
    "kamburupitiya",
    "kirinda",
    "kotapola",
    "malimbada",
    "matara-ds",
    "mulatiyana",
    "pasgoda",
    "pitabeddara",
    "thihagoda",
    "weligama",
    "welipitiya",
  ],
  hambantota: [
    "ambalantota",
    "angunakolapelessa",
    "beliatta",
    "hambantota-ds",
    "katuwana",
    "lunugamvehera",
    "okewela",
    "sooriyawewa",
    "tangalle",
    "thissamaharama",
    "weeraketiya",
    "walasmulla",
  ],
};

/**
 * Grama Niladhari divisions belonging to each DS division — mirrors the
 * `en` names of the source `aloysius-g1` project's `GN_DIVISIONS` (ids and
 * Sinhala names stay in that source; only the English display name is
 * stored here, matching the free-text value this field held previously).
 */
export const GN_DIVISIONS_BY_DIVISION: Record<Division, string[]> = {
  // ── Galle ─────────────────────────────────────────────────────────
  "galle-fg": ["Bataganvila", "Bope East", "Bope North", "Bope West", "China Garden", "Dadalla East", "Dadalla West", "Dangedara East", "Dangedara West", "Deddugoda North", "Deddugoda South", "Dewata", "Dewathura", "Eththiligoda South", "Fort", "Galwadugoda", "Ginthota East", "Ginthota West", "Kaluwella", "Kandewatta", "Katugoda", "Koongaha", "Kumbalwella North", "Kumbalwella South", "Kurunduwatta", "Madapathala", "Madawalamulla North", "Madawalamulla South", "Magalla", "Maha Hapugala", "Mahamodara", "Maitipe", "Makuluwa", "Maligaspe", "Milidduwa", "Minuwangoda", "Osanagoda", "Pettigalawatta", "Piyadigama", "Pokunawatta", "Richmond Kanda", "Sangamithpura", "Siyambalagahawatta", "Thalapitiya", "Ukwatta East", "Ukwatta West", "Walawwatta", "Welipatha", "Welipitimodara", "Weliwatta"],
  "akmeemana": ["Akmeemana", "Amalgama", "Ambagahavila", "Ambalanwatta", "Amukotuwa", "Anangoda", "Ankokkawala", "Attaragoda", "Badungoda", "Badungoda Colony", "Bambaragoda", "Batadoowa West", "Bataduwa", "Divulana Colony", "Etambagasmulla", "Ettiligoda North", "Galgamuwa", "Ganegoda", "Ganegoda West", "Halgasmulla", "Halivala", "Handugoda", "Hinidumgoda", "Hiyare East", "Hiyare North", "Hiyare South", "Ihala Hiyare", "Ihalagoda Colony", "Ihalagoda East", "Ihalagoda South", "Ihalagoda West", "Jambuketiya", "Kaduruduwa", "Kadurugashena", "Kalahe", "Kandahena", "Keranvila Colony", "Ketandola", "Kirindagoda", "Manawila", "Meegoda", "Melegoda", "Metaramba", "Nagahawatta", "Nivithipitigoda", "Niyagama", "Nugaduwa", "Panagamuwa", "Pedinnoruwa", "Pilana", "Pinnadoowa", "Pinnadoowa Colony", "Rathkindagoda", "Thalahitiyawa", "Thalgasyaya", "Thalpe North", "Thalpegoda", "Walahanduwa", "Wanchawala", "Welihena", "Weliketiya", "Yakgaha", "Yatagama"],
  "ambalangoda": ["Batadoowa", "Batapola Central", "Batapola East", "Batapola North", "Batapola South", "Batapola West", "Diddeliya", "Domanwila", "Dorala", "Eranawila", "Godahena", "Heppumulla", "Hirewatta", "Kaluwadumulla", "Kariththakanda", "Keraminiya", "Kobeithuduwa", "Kondagala", "Lewdoowa", "Maha Ambalangoda", "Matiwala", "Meetiyagoda", "Nawagama", "Nindana", "Okanda", "Paniyandoowa", "Patabendimulla", "Polhunnawa", "Polwatta", "Poramba", "Thalgasgoda", "Thanipolgahalanga", "Thilakapura", "Udakerawa", "Vilegoda", "Walakada"],
  "baddegama": ["Adurathvila", "Baddegama East", "Baddegama North", "Baddegama South", "Baddegama Town", "Balagoda", "Bataketiya", "Boralukada", "Dodangoda", "Ellakanda Wathurawa", "Ganegama East", "Ganegama North", "Ganegama South", "Ganegama West", "Ginimellagaha East", "Ginimellagaha South", "Ginimellagaha West", "Gonapura", "Gothatuwa", "Halpathota", "Halpathota Central", "Hemmeliya", "Horagampita", "Horagampita Central", "Kasideniya", "Keembi Ela", "Keradewala", "Kohombanadeniya", "Kotagoda", "Lelkada", "Madoldoowa", "Mahahengoda", "Mahalapitiya", "Majuwana", "Nayapamula", "Pahala Keembiya", "Pilagoda", "Pituwalgoda", "Sandarawala", "Thelikada", "Thelikada Nagare", "Thilaka Udagama", "Walpita North", "Walpita South", "Warakapitikanda", "Wavulagala", "Wewaldeniya", "Yahaladoowa"],
  "balapitiya": ["Ahungalla", "Andadola", "Balapitiya", "Berathuduwa", "Bogahapitiya", "Bogahawatta", "Boraluketiya", "Brahmanawatta North", "Brahmanawatta South", "Doowemodara", "Elathota", "Galmangoda", "Galvehera", "Godapitiya", "Heenatiya North", "Heenatiya South", "Hegalla - Piyagama", "Kadiragonna", "Kandegoda", "Katuvila", "Kosgoda", "Kudagodagama", "Kurunduwatta", "Madoowa", "Mahakarawa", "Mahaladoowa", "Mahapitiya", "Makumbura", "Middaramulla", "Nanathota Palatha", "Nape", "Paragahathota", "Pathegamgoda", "Pathiraja Pedesa", "Pathirajagama", "Pelegaspalatha", "Petiwatta", "Polathu Palatha", "Randombe North", "Randombe South", "Seenigoda", "Viharagoda", "Wadumulla", "Walagedara", "Wandadoowa", "Wathugedara", "Wathugedara South", "Wathurawela", "Wathuregama", "Welithara", "Weliwathugoda", "Wellabada"],
  "benthota": ["Akadegoda", "Angagoda", "Athuruwella", "Bodhimaluwa", "Dedduwa", "Delkabalagoda", "Dombagahawatta", "Dope", "Elakaka", "Etawalawatta East", "Etawalawatta West", "Ethungagoda", "Galagama", "Galbada", "Galthuduwa", "Gonagalapura", "Habakkala", "Haburugala", "Hipanwatta", "Huganthota Wadumulla", "Ihala Malawala", "Kahagalla", "Kahawe Gammedda", "Kaikawala", "Kandemulla", "Kolaniya", "Kommala", "Kotuwabendahena", "Kuda Uragaha", "Maha Uragaha", "Mahagoda", "Mahavila East", "Mahavila West", "Malawala", "Miriswatta", "Moragoda", "Mullegoda", "Olaganduwa", "Pahurumulla", "Pilekumbura", "Ranthotuwila", "Sinharoopagama", "Sooriyagama", "Thotakanatta", "Thunduwa East", "Thunduwa West", "Viyandoowa", "Warahena", "Warakamulla", "Yalegama", "Yathramulla"],
  "bope-poddala": ["Abeysundara Watta", "Addaragoda", "Ambagahawatta", "Bangalawatta", "Baswatta", "Beraliyadola", "Bokaramullagoda", "Galketiya", "Godakanda", "Hapugala", "Hirimburagama", "Holuwagoda", "Kahaduwawatta", "Kalegana North", "Kalegana South", "Kapuhempala", "Karapitiya", "Keranwila", "Kithulampitiya", "Kurunda", "Kurunda Kanda", "Labudoowa", "Magadeniya", "Mampitiya", "Meepawala", "Mulana East", "Mulana West", "Narawala", "Navinna", "Niladeniya", "Opatha", "Paliwathugoda", "Panideniya", "Pannamaga", "Panvila", "Pelawatta", "Poddala", "Silvagewatta", "Thotagoda", "Thunhiripana", "Uluvitike", "Wakwella", "Walawatta", "Watareka East"],
  "elpitiya": ["Ambana", "Ambana North", "Amugoda", "Atakohota", "Aviththawa", "Batuwanhena", "Delpona", "Digala Nagahatenna", "Dikhena", "Ella", "Ella Thanabaddegama", "Elpitiya Central", "Elpitiya East", "Elpitiya North", "Elpitiya South", "Eramulla", "Goluwamulla", "Goluwamulla North", "Goluwamulla West", "Himbutugoda", "Igala", "Igala East", "Igala Thalawa", "Igala Thalawa East", "Ihala Omatta", "Indipalegoda", "Kahadoowa", "Kahadoowa South", "Kellapatha", "Ketandola Udowita", "Kudagala Kadirandola", "Mahawela Abayapura", "Metiviliya", "Nawadagala", "Omatta", "Opatha", "Pahala Omatta", "Pelendagoda", "Pinikahana", "Pituwala North", "Pituwala South", "Pituwala West", "Poojagallena", "Rekadahena", "Sittaragoda", "Thalagaspe", "Thalagaspe West", "Thibbotuwawa", "Wallambagala", "Wallambagala North", "Wathuruvila"],
  "gonapinuwala": ["Aluthwala", "Arachchikanda", "Banwelgodella", "Berathuduwa", "Dangaragaha Udumulla", "Dodankahawila", "Eriyagahamulla", "Gonapeenuwala Central", "Gonapinuwala East", "Gonapinuwala West", "Henagoda", "Hikkaduwa East", "Kaluwagaha Colony", "Karuwalabedda", "Kirindiela", "Mahagangoda", "Manampita", "Thilakagama", "Woodland Watta"],
  "habaraduwa": ["Ahangama Central", "Ahangama East", "Ahangama Nakanda", "Ahangamgoda", "Alawathukisgoda", "Annasiwathugoda", "Atadahewathugoda", "Attaragoda", "Bogahamulugoda", "Bonavistawa", "Dalawella", "Danduhela", "Digaredda", "Dodampe", "Dommannagoda", "Godawatta", "Goviyapana", "Haloluwagoda", "Handogoda", "Happawana", "Harumalgoda Central", "Harumalgoda East", "Harumalgoda West", "Heenatigala South", "Kahawathugoda", "Kahawennagama", "Kalahegoda", "Kalapuwa", "Karandugoda", "Kathluwa Central", "Kathluwa East", "Kathluwa West", "Katukurunda", "Koggala", "Koggala Additional I", "Koggala Additional II", "Korahendigoda", "Lanumodara", "Liyanagoda", "Maharamba", "Meegahagoda", "Meepe", "Meliyagoda", "Morampitigoda", "Pelessa", "Pitidoowa", "Piyadigama East", "Piyadigama West", "Thaldoowa", "Thalpe East", "Thalpe South", "Unawatuna Central", "Unawatuna East", "Unawatuna West", "Uragasgoda", "Wadugegoda", "Welhengoda", "Wellethota", "Yaddehimulla"],
  "hikkaduwa": ["Delgahadoowa", "Dodandoowa", "Dodandugoda", "Gammaduwatta", "Handaudumulla", "Hennathota", "Hikkaduwa Central", "Hikkaduwa Nagarikaya", "Hikkaduwa West", "Katukoliha", "Kuda Wewala", "Millagoda", "Modara Patuwatha", "Nakanda", "Nalagasdeniya", "Narigama", "Narigama Wellabada", "Pannamgoda", "Patuwatha", "Pinkanda", "Thiranagama", "Uduhalpitiya", "Wavulagoda East", "Wavulagoda West", "Wellabada Thiranagama", "Wellawatta", "Wewala"],
  "imaduwa": ["Ampavila", "Andugoda", "Angulugaha", "Atanikitha", "Bedipita", "Danduwana", "Deegoda", "Deegoda Athireka 01", "Dikkumbura", "Dorape", "Ellalagoda", "Godaudamandiya", "Hatangala", "Hawpe", "Hawpe North", "Hettigoda", "Horadugoda", "Ihala Kombala", "Ihala Mawella", "Imaduwa", "Imaduwa Athireka", "Indurannavila", "Kabaragala", "Kahanda", "Kahanda Athireka 1", "Kalugalgoda", "Kodagoda East", "Kodagoda South", "Kombala", "Malalgodapitiya", "Mawella", "Mayakaduwa", "Panugalgoda", "Paragoda", "Pelawatta", "Pituwalahena", "Polhena", "Puswelkada", "Rangoda", "Thittagalla East", "Thittagalla West", "Wathawana", "Welikonda"],
  "karandeniya": ["Anganaketiya", "Angulugalla", "Beligaswella", "Borakanda", "Dangahawila", "Diviyagahawela", "Diyapitagallana", "Egodawela", "Galagoda Atta", "Galpottawala", "Halgahawella", "Hipankanda", "Ihala Kiripedda", "Jayabima", "Kaluwalagoda", "Karandeniya North", "Karandeniya South", "Kirinuge", "Kiripedda", "Kurundugaha Hethekma", "Lenagal Palatha", "Mabingoda", "Madakumbura", "Magala North", "Magala South", "Mahaedanda", "Mahagoda", "Mandakanda", "Meegaspitiya", "Mendorawala", "Pehembiyakanda", "Randenigama", "Siripura", "Thalgahawatta", "Unagaswela", "Uragasmanhandiya East", "Uragasmanhandiya North", "Uragasmanhandiya South", "Walinguruketiya", "Yatagala"],
  "madampagama": ["Akurala", "Akurala North", "Akurala South", "Andurangoda", "Daluwathumulla", "Deldoowa", "Delmar Colony", "Dewagoda East", "Dewagoda West", "Dimbuldoowa", "Galagoda East", "Galagoda West", "Galdoowa", "Godagama North", "Godagama South", "Harannagala", "Idanthota", "Kahawa", "Kalupe", "Kuleegoda East", "Kuleegoda West", "Malawenna", "Medagoda", "Pereliya North", "Pereliya South", "Seenigama East", "Seenigama West", "Thelwatta", "Thotagamuwa", "Udumulla", "Uduwaragoda North", "Uduwaragoda South", "Urawatta", "Usmudulawa", "Wellabada", "Wenamulla", "Weragoda", "Werellana"],
  "nagoda": ["Aluth Thanayamgoda Ihala", "Aluth Thanayamgoda Ihala ( South )", "Aluth Thanayamgoda Pahala", "Aluth Thanayamgoda Pahala West", "Aluthwatta", "Budapanagama", "Gammeddegoda", "Gammeddegoda South", "Gonadeniya", "Gonadeniya South", "Gonalagoda", "Gonalagoda East", "Hangaranwala", "Homadola", "Keppitiyagoda", "Keppitiyagoda North", "Ketagoda North", "Ketagoda South", "Kurupanawa", "Malamura", "Mapalagama", "Marakanda", "Nagoda", "Nagoda Ihala", "Parana Thanayamgoda", "Parana Thanayamgoda Central", "Parana Thanayamgoda Pahala", "Thalgaswala", "Udalamatta East", "Udalamatta North", "Udalamatta South", "Udawelivitiya", "Udawelivitiya Thalawa", "Udawelivitiya Thalawa East", "Udawelivitiya West", "Udugama", "Udugama Central", "Udugama East", "Udugama North", "Udugama South", "Udugama West", "Ukovita", "Ukovita North", "Unanvitiya", "Unanvitiya East", "Urala Central", "Urala East", "Urala North", "Urala Pahala", "Urala South", "Yatalamatta", "Yatalamatta East", "Yatalamatta West"],
  "neluwa": ["Batuwangala", "Batuwangala West", "Danawala", "Dellawa", "Dewalegama East", "Dewalegama West", "Ehelapitiya", "Embalegedara North", "Embalegedara South", "Happitiya", "Ihala Gigumaduwa", "Ihala Lelwala", "Ihala Maddegama", "Ihala Millawa", "Kosmulla", "Koswatta", "Lankagama", "Lelwala", "Maddegama East", "Madugeta", "Mavita East", "Mavita West", "Mawanana", "Medagama", "Millawa West", "Miyanawathura", "Neluwa", "Pahala Gigumaduwa", "Pahala Maddegama", "Pahala Millawa", "Panagoda", "Pannimulla", "Thambalagama", "Warukandeniya"],
  "niyagama": ["Amaragama", "Bambarawana", "Bangamukanda", "Boraluwahena", "Duwegoda", "Godamuna North", "Godamuna South", "Hattaka", "Horangalla Akulavila", "Horangalla Thalawa", "Horangalla West", "Kaluarachchigoda", "Karawwa", "Kimbulawala", "Liyanagamakanda", "Manampita", "Maraggoda", "Marthupitiya", "Mattaka", "Naranovita", "Niyagama", "Niyagama South", "Niyagama West", "Pitigala", "Pitigala North", "Poddiwala East", "Poddiwela West", "Polpelaketiya", "Porawagama", "Porawagama South", "Uhanovita", "Usbim Colony", "Wattahena", "Weihena"],
  "rathgama": ["Boossa", "Bopagoda", "Devinigoda", "Dolikanda", "Gammeddagoda", "Gammeddagoda East", "Gammeddagoda Rathgama", "Ganegoda", "Hegoda", "Imbula", "Kadurupe", "Kandegoda", "Kapumulugoda", "Katudampe", "Kedala", "Krawegoda", "Mahahegoda", "Maliduwa", "Mawadawila", "Medawala", "Owakanda", "Palanthriyagoda", "Palliyapitiya", "Panvila Pahalagoda", "Pitiwella North", "Pitiwella South", "Ranapanadeniya", "Rathgama Hegoda", "Rathna Udagama", "Rejjipura", "Rupiwala", "Thotavila"],
  "thawalama": ["Batahena", "Dammala", "Dammala Colony", "Ela Ihala", "Ela Ihala North", "Eppala", "Gallandala", "Habarakada East", "Habarakada West", "Halvitigala Colony Step 1", "Halvitigala Colony Step 2", "Hiniduma North", "Hiniduma South", "Hiniduma West", "Koralegama", "Kudugalpola", "Kumburegoda", "Malgalla", "Malhathawa", "Opatha East", "Opatha North", "Opatha South", "Opatha West", "Panangala East", "Panangala North", "Panangala West", "Thalangalla", "Thalangalla East", "Thalangalla West", "Thawalama Mookalana", "Thawalama North", "Thawalama South", "Weerapana East", "Weerapana North", "Weerapana South", "Weerapana West"],
  "waduramba": ["Deiyandara", "Gulugahakanda", "Ihala Keembiya", "Ihala Keembiya South", "Ihala Lelwala", "Indurupathvila", "Kirindalahena", "Kokawala", "Kumbalamalahena", "Mabotuwana", "Meda Keembiya", "Meda Keembiya East", "Nattewela", "Pahala Lelwala", "Panvila", "Pitiharawa", "Polgahavila", "Thalawa", "Thiruwanaketiya", "Wanduramba", "Wanduramba South", "Weihena"],
  "welivitiya": ["Agaliya", "Ampegama", "Divithura", "Divithura East", "Divithura South", "Ethkandura", "Galahenkanda", "Hamingala", "Kuttiyawatta", "Maddevila", "Miriswatta", "Nambaraatta", "Nugethota", "Old Colony", "Pathawelivitiya", "Pathaweliwitiya North", "Polgahavila", "Thanabaddegama", "Waduwelivitiya", "Waduwelivitiya North"],
  "yakkalamulla": ["Badungala", "Beranagoda", "Ella Ihala", "Gahalakoladeniya", "Hiriyamalkumbura", "Ihala Nakiyadeniya", "Ihala Walpola", "Kaludiyawala", "Karagoda", "Karagoda Ihala", "Karagoda Pahala", "Kottawa", "Kottawa East", "Kottawa West", "Magedara", "Magedara East", "Magedara North", "Moraketiya", "Nabadawa", "Nakiyadeniya", "Nakiyadeniya North", "Nawala", "Nevungala", "Nevungala South", "Polpagoda", "Polpagoda West", "Rathambalaketiya", "Thalgampala", "Thalgampala North", "Thellambura Iahala", "Thellambura North", "Thellambura Pahala", "Thellambura South", "Udubattawa West", "Udubettawa", "Udumalagala", "Uduwella", "Walpola Pahala", "Wathogala", "Wattahena", "Welendawa", "Yakkalamulla", "Yakkalamulla East", "Yatamalagala"],
  // ── Matara ────────────────────────────────────────────────────────
  "akuressa": ["Akuressa", "Asmagoda", "Bopitiya", "Dediyagala", "Diganahena", "Diyalape", "Dolamawatha", "Ehelape", "Ellewela", "Eramudugoda", "Galabadahena", "Gallala", "Ganhela", "Henegama", "Henegama West", "Hikgoda", "Hulandawa", "Idikakudeniya", "Ihala Kiyaduwa", "Ihala Maliduwa", "Iluppella", "Imbullgoda", "Ketanvila", "Kohugoda", "Lenama North", "Lenama South", "Manikgoda", "Maramba North", "Maramba South", "Melewwa", "Minipogoda", "Nawalagoda", "Nimalawa", "Nimalawa East", "Pahala Maliduwa", "Paraduwa East", "Paraduwa North", "Paraduwa South", "Paragahawatta", "Peddapitiya North", "Peddapitiya South", "Poramba", "Udupitiya", "Vilagama", "Weliketiya", "Yakabwdda"],
  "athuraliya": ["Athuraliya East", "Athuraliya West", "Balakawala", "Dematapassa", "Divithura", "Godapitiya", "Howpe", "Ihala Athuraliya", "Kanahalagama", "Kehelwala", "Maragoda", "Naburukanda", "Pahala Athuraliya", "Panadugama", "Thalahagama East", "Thalahagama West", "Thibbotuwawa", "Thibbotuwawa North", "Uggashena", "Urumutta", "Urumutta South", "Vilpita East 1", "Vilpita East 2", "Vilpita West", "Walagepiyadda", "Welihena", "Wenagama", "Yahamulla"],
  "devinuwara": ["Agarawala", "Aparekka North", "Beddegammedda", "Delgalla", "Devinuwara", "Devinuwara Central", "Devinuwara East", "Devinuwara Light House Place", "Devinuwara North", "Devinuwara Nugegoda", "Devinuwara Sinhasana Pedesa", "Devinuwara South", "Devinuwara Wawwa", "Devinuwara Welegoda", "Devinuwara West", "Gandara Central", "Gandara East", "Gandara South", "Gandara West", "Gandarawaththa Kotasak", "Kadawedduwa East", "Kadawedduwa West", "Kapugama Central", "Kapugama East", "Kapugama North", "Kapugama West", "Naotunna", "Naotunna Central", "Naotunna North", "Naotunna South", "Palle Aparekka", "Pathegama East", "Pathegama North", "Thalalla", "Thalalla Central", "Thalalla East", "Thalalla North", "Thalalla South", "Uda Aparekka", "Uda Aperakka East", "Walbulugahahena"],
  "dickwella": ["Bambarenda Central", "Bambarenda East", "Bambarenda North", "Bambarenda South", "Bambarenda West", "Batheegama Central", "Bathigama East", "Bathigama West", "Belideniya", "Beliwatta", "Bodarakanda", "Dandeniya North", "Dandeniya South", "Dickwella Central", "Dickwella East", "Dickwella Muslim Yonakapura East", "Dickwella Muslim Yonakapura West", "Dickwella North", "Dickwella South", "Dodampahala Central", "Dodampahala East", "Dodampahala North", "Dodampahala South", "Dodampahala West", "Godauda", "Kottagoda", "Lunukalapuwa", "Pathegama Central", "Pathegama South", "Pohosathugoda", "Rannawala", "Rathmale", "Suduwella", "Urugamuwa", "Urugamuwa Central", "Urugamuwa East", "Urugamuwa North", "Urugamuwa South", "Urugamuwa West", "Walasgala East", "Walasgala West", "Wattegama", "Wattegama North", "Wattegama South", "Wehella", "Wehella North", "Wehella South", "Wewurukannala"],
  "hakmana": ["Badabadda", "Beruwewela", "Denagama East", "Denagama North", "Denagama West", "Ellewela East", "Ellewela West", "Gammedapitiya", "Gangodagama", "Kandegoda", "Kebiliyapola North", "Kebiliyapola South", "Kohuliyadda", "Kongala Central", "Kongala East", "Kongala South", "Kongala West", "Lalpe", "Meeella", "Muruthamuraya", "Muruthamuraya East", "Muruthamuraya West", "Narawelpita East", "Narawelpita North", "Narawelpita South", "Narawelpita West", "Pananwela East", "Pananwela West", "Pottewela", "Udupeellegoda East", "Udupeellegoda West", "Wepathaira North", "Wepathaira South", "Wepathaira West"],
  "kamburupitiya": ["Akurugoda", "Beragammulla", "Bibulewela", "Eriyathota", "Ganegama", "Gathara East", "Gathara North", "Gathara West", "Godawa", "Ihala Vitiyala East", "Ihala Vitiyala North", "Ihala Vitiyala South", "Ihala Vitiyala West", "Kahagala", "Kahagala South", "Kamburupitiya", "Karagoda Uyangoda 1 East", "Karagoda Uyangoda 1 West", "Karagoda Uyangoda 2 East", "Karagoda Uyangoda 2 West", "Karaputugala North", "Karaputugala South", "Lenabatuwa", "Magamure", "Malana", "Mapalana Magin Pahala", "Mapalana Mangin Ihala", "Narandeniya East", "Narandeniya West", "Palolpitiya", "Pitakatuwana", "Sapugoda", "Seewelgama", "Thumbe", "Ullala East", "Ullala Masmulla", "Ullala West", "Urapola East", "Urapola West"],
  "kirinda": ["Boraluketiya", "Galkanda", "Hettiyawala East", "Hettiyawala North", "Hettiyawala South", "Hettiyawala West", "Karathota", "Kirinda Magin Ehala North", "Kirinda Magin Ihala Central", "Kirinda Magin Ihala East", "Kirinda Magin Ihala South", "Kirinda Magin Pahala", "Kumbalgoda", "Malwathugoda", "Naradda", "Ovitigamuwa North", "Ovitigamuwa South", "Puhulwella East", "Puhulwella West", "Walakanda East", "Walakanda South", "Walakanda West", "Wathukolakanda East", "Wathukolakanda North", "Wavulanbokka"],
  "kotapola": ["Adaradeniya", "Bateyaya", "Beliattakumbura", "Deniyaya", "Deniyaya West", "Horagala East", "Horagala West", "Ihalagama", "Ilukpitiya", "Kalugalahena", "Kandilpana", "Keeriwalagama", "Kiriweldola", "Kolawenigama", "Koodaludeniya", "Kosmodara", "Kotapola North", "Kotapola South", "Lindagawahena", "Mederipitiya", "Morawaka", "Mugunumulla", "Nawalahena", "Nissankapura", "Pallegama North", "Pallegama South", "Paragala", "Pathawala Nadakanda", "Pelawatta", "Poddana", "Porupitiya", "Pussawela", "Thenipita", "Usamalagoda", "Uvaragala", "Viharahena", "Waralla"],
  "malimbada": ["Akurugoda East", "Akurugoda North", "Akurugoda South", "Akurugoda West", "Dampella", "Elgiriya", "Galpamuna", "Horagoda East", "Horagoda South", "Horagoda West", "Kadduwa", "Kadukanna", "Katuwangoda", "Kekunawela", "Kirimetimulla North", "Kirimetimulla South", "Malimbada East", "Malimbada North", "Malimbada South", "Malimbeda West", "Maragoda", "Nape", "Pahala Kiyaduwa", "Sulthanagoda East", "Sulthanagoda South", "Sulthanagoda West", "Thelijjavila", "Uninduwela", "Weladagoda"],
  "matara-ds": ["Deeyagaha West", "Diyagaha East", "Eduwa - Madurudoowa", "Eliyakanda North", "Eliyakanda South", "Fort", "Gandarawatta South", "Godagama", "Hittatiya East", "Hittatiya Meda", "Hittatiya West", "Isadeen Town", "Kadeweediya East", "Kadeweediya South", "Kadeweediya West", "Kakanadura South", "Kanattagoda North", "Kanattagoda South", "Kekanadura Central", "Kekanadura East", "Kekanadura North", "Kekanadura West", "Kokawala", "Kotuwegoda North", "Kotuwegoda South", "Madiha East", "Madiha West", "Makavita", "Mathotagama", "Meddawatta", "Meddawatta South", "Nakuttiya", "Navimana North", "Navimana South", "Noope", "Pahalagoda", "Pamburana", "Parawahara East", "Parawahera North", "Parawahera South", "Polhena", "Rassanadeniya", "Ruwan Ella", "Sudarshi Place", "Thalpavila North", "Thalpavila South", "Thotamuna", "Thudawa East", "Thudawa North", "Thudawa South", "Uyanwatta", "Uyanwatta North", "Veherahena", "Walgama", "Walgama Meda", "Walgama North", "Walgama South", "Walpala", "Welegoda East", "Welegoda West", "Weliweriya East", "Weliweriya West", "Weradoowa", "Weragampita", "Wewa Ihalagoda", "Wewahamandoowa"],
  "mulatiyana": ["Athapattukanda", "Bamunugama East", "Bamunugama West", "Batadola", "Belpamulla", "Beragama East", "Beragama North", "Beragama South", "Beragama West", "Deiyandara", "Dewalegama East", "Dewalegama West", "Diddenipotha East", "Diddenipotha North", "Diddenipotha South", "Galetumba", "Gammedagama", "Gombaddala North", "Gombaddala South", "Horapavita North", "Horapavita South", "Ketapalakanda", "Ketiyape North", "Ketiyape South", "Kithsiripura", "Koramburuwana", "Kudapana", "Maduwala", "Makandura East", "Makandura West", "Meepavita", "Mudaligedara", "Mulatiyana", "Neralampitiya", "Pallawela", "Parapamulla East", "Parapamulla South", "Parapamulla West", "Pitawalgamuwa", "Radawela East", "Radawela West", "Ransegoda East", "Ransegoda North", "Ransegoda South", "Ransegoda West", "Rathkekulawa", "Seenipella East", "Seenipella West"],
  "pasgoda": ["Adaluwa", "Batandura North", "Batandura South", "Bengamuwa East", "Bengamuwa South", "Bengamuwa West", "Beralapanathara North", "Beralapanathara South", "Dampahala East", "Dampahala West", "Denkandaliya", "Ehelakanda", "Galketikanda", "Ginnaliya East", "Ginnaliya North", "Ginnaliya South", "Ginnaliya West", "Gomila", "Heegoda", "Hulankanda", "Keeripitiya East", "Keeripitiya West", "Kekundeniya", "Ketawala", "Kirilapane", "Mawarala", "Mekiliyathenna", "Mologgamuwa North", "Mologgamuwa South", "Moragala", "Napathella", "Panakaduwa East", "Panakaduwa West", "Pasgoda", "Pathavita", "Pattigala", "Poddeniya", "Puwakgahahena", "Rotumba East", "Rotumba West", "Thalapelakanda", "Urubokka", "Wijayagama"],
  "pitabeddara": ["Alapaladeya North", "Alapaladeya South", "Aluwana", "Ambewela", "Banagala East", "Banagala West", "Dangala East", "Dangala West", "Dankoluwa", "Dehigaspa", "Derangala", "Diyadawa", "Edandukitha East", "Edandukitha West", "Emaldeniya", "Galabada", "Gorakawela", "Ihala Ainagama", "Kaduruwana", "Kalubovitiyana", "Kiriwelkele North", "Kiriwelkele South", "Kodikaragoda East", "Kodikaragoda West", "Kosnilgoda", "Kotagala", "Kudagalahena", "Mahapotuvila", "Paradupalla", "Pitabaddera", "Puwakbadovita", "Rambukana East", "Rambukana West", "Siyambalagoda East", "Siyambalagoda West", "Thalapekumbura", "Thannehena", "Wanasinkanda", "Waturakumbura", "Weliwa"],
  "thihagoda": ["Akkara Panaha", "Attudawa", "Attudawa West", "Bandattara 1", "Bandattara 2", "Batuvita 2", "Batuvita I", "Dematahettigoda", "Elambathalagoda", "Galbada", "Kapudoowa", "Kapudoowa East", "Kithalagama Central", "Kithalagama East 1", "Kithalagama East 2", "Kithalagama East 3", "Kithalagama West", "Komangoda 1", "Komangoda 2", "Kottawatta", "Medauyangoda", "Nadugala 1", "Nadugala 2", "Naimbala 1", "Naimbala 2", "Narangala", "Pahala Vitiyala Central", "Pahala Vitiyala East", "Pahala Vitiyala West", "Palatuwa", "Polathugoda", "Thihagoda", "Thihagoda East", "Uduwa East", "Uduwa West", "Unella", "Watagedara", "Watagedara East", "Wellethota", "Yatiyana"],
  "weligama": ["Aluthweediya", "Bandaramulla", "Denuwala", "Galbokka East", "Galbokka West", "Garanduwa", "Gurubebila", "Henwala East", "Henwala West", "Hetti Weediya", "Kamburugamuwa North", "Kamburugamuwa South", "Kamburugamuwa West", "Kapparathota North", "Kapparathota South", "Kohunugamuwa", "Kotavila North", "Kotavila South", "Kotavila West", "Maha Weediya", "Midigama East", "Midigama North", "Midigama West", "Mirissa North", "Mirissa South 1", "Mirissa South 2", "Mirissa Udumulla", "Mirissa Udupila", "Moodugamuwa East", "Moodugamuwa West", "New Street", "Nidangala", "Paranakade", "Pathegama", "Pelena North", "Pelena South", "Pelena West", "Pitidoowa", "Polwathumodara", "Polwatta", "Thal Aramba East", "Thal Aramba North", "Thal Aramba South", "Thudella", "Walana", "Walliwala East", "Walliwala South", "Walliwala West", "Wekada"],
  "welipitiya": ["Bathalahena", "Beraleliya", "Borala", "Denipitiya Central", "Denipitiya East", "Denipitiya West", "Hallala", "Ibbawala", "Jamburegoda East", "Jamburegoda West", "Jayawickramapura", "Kapuwatta", "Kokmaduwa North", "Maduragoda", "Meeruppa", "Moonamalpa", "Nalawana", "Nivithiwelbokka", "Padili Kokmaduwa", "Palalla", "Penetiyana East", "Penetiyana West", "Poramba Kananke North", "Poramba Kananke South", "Puhulahena", "Sahabandu Kokmaduwa", "Udukawa North", "Udukawa South", "Uruvitiya", "Vilegoda", "Wahala Kananke North", "Wahala Kananke South", "Warakapitiya East", "Warakapitiya North", "Warakapitiya South", "Watagedaramulla", "Welipitiya", "Wellana"],
  // ── Hambantota ────────────────────────────────────────────────────
  "ambalantota": ["Ambalantota North", "Ambalantota South", "Barawakumbuka", "Bata Atha North", "Bata Atha South", "Beminiyanvila", "Bolana North", "Bolana South", "Deniya", "Ekkassa", "Elegoda East", "Elegoda West", "Eraminiyaya", "Ethbatuwa", "Godakoggala", "Handunkatuwa", "Hathagala", "Hedavinna", "Hungama", "Ihalagama", "Jansagama", "Kiula North", "Kiula South", "Koggalla", "Kuda Bolana", "Liyangasthota", "Lunama North", "Lunama South", "Mahajandura", "Malpettawa", "Mamadala North", "Mamadala South", "Miniethiliya", "Modarapiliwala", "Mulana", "Murawesihena", "Nonagama", "Pallegama", "Palugahagodella", "Pingama", "Poliyarwaththa", "Puhulyaya", "Punchihenayagama", "Ridiyagama", "Rotawala", "Rote", "Siyabalakote", "Thaligala", "Thawaluvila", "Uhapitagoda", "Walawewatta East", "Walawewatta West", "Wanduruppa", "Welipatanvila", "Wetiya"],
  "angunakolapelessa": ["Abesekaragama", "Achariyagama", "Aluthwewa", "Amarathungama", "Angunakolapelessa", "Aththanayala East", "Attanayala West", "Binkama", "Bogamuwa", "Dabarella North", "Dabarella South", "Daha Amuna", "Dandenigama", "Debokkawa North", "Debokkawa South", "Dikwewa", "Dimbulgoda", "Gajanayakagama", "Gurunnehegeara", "Guruwala", "Hakuruwela", "Heenbunna", "Helekada", "Indigetawela", "Jandura", "Julamulla", "Kailawelapotawa", "Kalawelwala", "Kankanamgama", "Karagahawala", "Kariyamadiththa", "Kendaketiya", "Kohombagaswewa", "Kotawaya", "Makuladeniya", "Meda Ara", "Medagoda", "Medayala", "Metigathwala", "Netalaporuwa", "Pahalagama", "Rathmalwala", "Sooriyapokuna", "Thalamporuwa", "Thalawa North", "Thalawa South", "Udayala", "Uswewa", "Wakamulla", "Weeragaswewa", "Yakagala"],
  "beliatta": ["Agulmaduwa", "Ambagasdeniya", "Ambala North", "Ambala West", "Aranwela North", "Aranwela West", "Beliatta South", "Beliatta Town", "Beliatta West", "Beligalla North", "Beligalla South", "Dammulla East", "Dammulla West", "Dedduwawala", "Dedduwawala East", "Eldeniya", "Galagama East", "Galagama North", "Galagama South", "Galagama West", "Galwewa", "Getamanna East", "Getamanna North", "Getamanna South", "Getamanna West", "Godawela", "Ihala Beligalla East", "Ihala Beligalla West", "Indiketiyagoda", "Kahawatta", "Kambussawala East", "Kambussawala West", "Karambaketiya", "Kosgahagoda", "Kudaheela East", "Kudaheela North", "Kudaheela South", "Mahaheella East", "Mahaheella North", "Mahaheella West", "Maligathenna", "Medagoda", "Mihindupura", "Miriswatta", "Nakulugamuwa North", "Nakulugamuwa West", "Nayakawatta", "Nihiluwa East", "Nihiluwa West", "Nugewela", "Ovilana", "Pahalagoda", "Palapotha East", "Palapotha West", "Pallattara East", "Pallattara South", "Pallattara West", "Panamulla", "Pattiyawela", "Puwakdandawa East", "Puwakdandawa North", "Sitinamaluwa East", "Sitinamaluwa North", "Sitinamaluwa South", "Sitinamaluwa West", "Tharaperiya", "Udugalmotegama", "Wadiya", "Waharakgoda North", "Waharakgoda South", "Wewdaththa"],
  "hambantota-ds": ["Arawanamulla", "Bandagiriya", "Bellagaswewa", "Bundala", "Dehigahalanda", "Elalla", "Galwewa", "Godawaya", "Gonnoruwa", "Hambantota East", "Hambantota West", "Joolgamuwa", "Keliyapura", "Ketanwewa", "Koholankala", "Manajjawa", "Mirijjawila", "Pahala Beragama", "Pallemalala", "Samodagama", "Siribopura", "Siriyagama", "Sisilasa Gama", "Siyambalagaswila North", "Siyambalagaswila South", "Tammannawa", "Uda Beragama", "Walawa", "Yahangala East", "Yahangala West"],
  "katuwana": ["Ambagahahena", "Ambagasara", "Andalugoda", "Araboda", "Bengamukanda", "Binthenna", "Bukendayaya", "Dambethalawa", "Dangalakanda", "Gallindamulla", "Galpothukanda", "Gangulandeniya", "Hediwatta", "Hellala", "Hingurakanda", "Horavinna", "Karametiya", "Karivilakanda", "Katuwana", "Keselwatta", "Kohomporuwa", "Kongasthenna", "Kudagoda East", "Kudagoda West", "Labuhengoda", "Medakanda", "Meemanakoladeniya", "Mellaketigoda", "Middeniya East", "Middeniya North", "Middeniya West", "Murungasyaya East", "Murungasyaya West", "Obadagahadeniya", "Pahala Alupothdeniya", "Pangamvilayaya", "Puwakgasara", "Ranasingoda", "Ritigahayaya", "Rukmalpitiya", "Sapugahayaya", "Siyambalamuraya", "Siyarapitiya", "Thalwatta", "Uda Alupothdeniya", "Udagomadiya", "Udawelmulla", "Ulahitiyawa", "Ulahitiyawa East", "Ulahitiyawa West", "Walgammulla", "Wathukanda", "Weerakkuttigoda", "Welipitiya", "Welipitiya East", "Welipitiya West"],
  "lunugamvehera": ["Abayapura", "Agbopura", "Angunakolawewa", "Beralihela", "Bogahawewa", "Dewramwehera", "Dutugemunupura", "Iththanwekada", "Jayagama", "Karambawewa", "Keerthipura", "Kendagasmankada", "Lunugamvehera New Town", "Mahaaluthgamara", "Mahanagapura", "Maththala", "Mihindupura", "Muwanwewa", "Padawgama", "Pahala Maththala", "Parakramapura", "Punchiappujandura", "Rambukwewa", "Ranasiripura", "Ranawaranawa", "Saddhathissapura", "Saddhathissapura New Town", "Saliyapura", "Samanpura", "Seenimunna", "Senapura", "Singhapura", "Weeravil Ara", "Weeravila", "Weheragala", "Weligatta"],
  "okewela": ["Godawenna", "Heenatihathmuna", "Ihala Thalahagamwaduwa", "Kadigamuwa East", "Kadigamuwa West", "Kahatellagoda", "Kandebedda", "Kanumuldeniya East", "Kanumuldeniya North", "Kanumuldeniya South", "Kanumuldeniya West", "Kurunduwatta", "Modarawana North", "Modarawana South", "Morakandegoda", "Nathuwala", "Okawela", "Olu Ara", "Pahala Thalahagamwaduwa", "Palle Wawwa", "Rajapuragoda", "Sumihirigama", "Udadeniya", "Wawwa", "Wijayasiripura", "Yatigala Ihala", "Yatigala Pahala"],
  "sooriyawewa": ["Aliolu Ara", "Andarawewa", "Beddewewa", "Bediganthota", "Habaraththawala", "Hathporuwa", "Ihala Kumbukwewa", "Mahagalwewa", "Mahapelessa", "Mahawelikada Ara", "Meegaha Jandura", "Namadagaswewa", "Ranmuduwewa", "Samajasewapura", "Sooriyawewa Town", "Suravirugama", "Viharagala", "Wediwewa", "Weeriyagama", "Weliwewa", "Weniwal Ara"],
  "tangalle": ["Aluthgoda", "Andupalana", "Athgalmulla", "Danketiya", "Godawanagoda", "Gotaimbaragama", "Gurupokuna", "Ihalagoda", "Indipokunagoda North", "Indipokunagoda South", "Kadiragoda", "Kadurupokuna East", "Kadurupokuna North", "Kadurupokuna South", "Kadurupokuna West", "Kahandamodara", "Kahandawa", "Kattakaduwa North", "Kattakaduwa South", "Kotuwe Goda", "Kudawella Central", "Kudawella East", "Kudawella North", "Kudawella South", "Kudawella West", "Mahawela", "Marakolliya", "Mawella North", "Mawella South", "Medagama", "Medaketiya", "Medilla", "Moraketiara East", "Moraketiara West", "Nakulugamuwa South", "Nalagama East", "Nalagama West", "Netolpitiya North", "Netolpitiya South", "Nidahasgama East", "Nidahasgama West", "Pahajjawa", "Palathuduwa", "Pallikkudawa Rural", "Pallikkudawa Urban", "Pattiyapola East", "Pattiyapola South", "Pattiyapola West", "Polommaruwa North", "Polommaruwa South", "Ranna East", "Ranna West", "Rekawa East", "Rekawa West", "Seenimodara East", "Seenimodara West", "Siyambalagoda", "Sudarshanagama", "Thalapitiyagama", "Thalunna", "Thenagama North", "Thenagama South", "Uduwilagoda", "Unakooruwa East", "Unakooruwa West", "Vigamuwa", "Vitharandeniya North", "Vitharandeniya South", "Wadigala", "Wagegoda", "Walgameliya", "Wella Odaya"],
  "thissamaharama": ["Andaragasyaya", "Anjaligala", "Dambewelena", "Debarawewa", "Ekamuthugama", "Ellagala", "Gangasiripura", "Gemunupura", "Gonagamuwa", "Gotabhayapura", "Halmillawa", "Joolpallama", "Kachcheriyagama", "Kawanthissapura", "Kirinda", "Konwelena", "Magama", "Mahasenpura", "Mahindapura", "Medawelena", "Molakapupatana", "Nedigamvila", "Pannagamuwa", "Polgahawelena", "RanaKeliya", "Randunuwatta", "Rathnelumwalayaya", "Rohanapura", "Rubberwatta", "Saliyapura", "Sandagiripura", "Sandungama", "Senapura", "Shuddha Nagaraya", "Tissamaharama", "Tissapura", "Uddhakandara", "Uduvila", "Viharamahadevipura", "Vijithapura", "Weerahela", "Welipothewela", "Wijayapura", "Yodhakandiya"],
  "weeraketiya": ["Abakolawewa North", "Abakolawewa South", "Agrahera", "Athubode East", "Athubode West", "Badigama East", "Badigama North", "Badigama West", "Bedigama South", "Buddhiyagama East", "Buddhiyagama North", "Buddhiyagama West", "Debokkawa East", "Debokkawa West", "Degampotha", "Galpoththayaya North", "Galpottayaya South", "Handapangala Ayna", "Heellageayna", "Ihala Gonadeniya", "Iththademaliya East", "Iththademaliya South", "Iththademaliya West", "Kadamadiththa", "Kaluwagahayaya", "Kappitiyawa South", "Kemegala", "Keppitiyawa North", "Kinchigune East", "Kinchigune South", "Kinchigune West", "Kuda Badigama", "Kuda Bibula South", "Kudabibula North", "Kudagal Ara", "Madagoda", "Madamulana", "Malhewage ayna", "Mandaduwa", "Medagama", "Meegas Ara", "Morayaya North", "Morayaya South", "Mulanyaya", "Mulgirigala East", "Mulgirigala North", "Mulgirigala South", "Mulgirigala West", "Okandayaya North", "Okandayaya West", "Pahala Gonadeniya", "Raluwa", "Siyambalaheddawa", "Thelambuyaya", "Udukirivila", "Weeraketiya East", "Weeraketiya West", "Wekandawala North", "Wekandawala South", "Yakgasmulla"],
  "walasmulla": ["Agalabada", "Athpitiya", "Batagassa", "Bowala North", "Bowala South", "Bowala West", "Daluwakgoda", "Dehigahahena", "Egodabedda", "Galahitiya East", "Galahitiya North", "Galahitiya South", "Galwadiya", "Haggithakanda North", "Handugala", "Horewela", "Julampitiya", "Kebellaketiya", "Kekiriobada", "Keradeniya", "Koholana", "Konkarahena", "Mapitakanda", "Mathuwakanda", "Medagamgoda", "Muruthawela Ihala", "Muruthawela Pahala", "Namaneliya", "Omara East", "Omara West", "Pahalaobada", "Pahalawaththa", "Palle Julampitiya", "Pathegama", "Pissubedda", "Radaniara", "Rammala", "Saputhanthrikanda", "Thalapathkanda", "Uda Julampitiya", "Udahagoda", "Walasmulla East", "Walasmulla Lower", "Walasmulla North", "Walasmulla South", "Walasmulla Upper", "Walasmulla West", "Warapitiya", "Waththehengoda", "Weedapola", "Weedikanda", "Welandagada", "Yahalmulla"],
};

/**
 * Sri Lanka's Southern Province parliamentary/electoral constituencies —
 * mirrors the `en` names of the source `aloysius-g1` project's
 * `ELECTORAL_CONSTITUENCIES`. Unlike district/division/GN division this is a
 * flat, searchable list — it doesn't cascade from the district field (the
 * source app uses it the same way, as a standalone Combobox).
 */
export const ELECTORAL_DISTRICTS = [
  // ── Galle ────────────────────────────────────────────────────────────────
  "Akmeemana",
  "Ambalangoda",
  "Baddegama",
  "Balapitiya",
  "Bentara-Elpitiya",
  "Galle",
  "Habaraduwa",
  "Hiniduma",
  "Karandeniya",
  "Ratgama",
  // ── Matara ───────────────────────────────────────────────────────────────
  "Akuressa",
  "Deniyaya",
  "Devinuwara",
  "Hakmana",
  "Kamburupitiya",
  "Matara",
  "Weligama",
  // ── Hambantota ───────────────────────────────────────────────────────────
  "Beliatta",
  "Mulkirigala",
  "Tangalle",
  "Thissamaharama",
];

/** English display labels for district ids — selects show these instead of the raw id. */
export const DISTRICT_LABELS: Record<District, string> = {
  galle: "Galle",
  matara: "Matara",
  hambantota: "Hambantota",
};

/** English display labels for DS division ids — selects show these instead of the raw id. */
export const DIVISION_LABELS: Record<Division, string> = {
  "galle-fg": "Galle Four Gravets",
  "akmeemana": "Akmeemana",
  "ambalangoda": "Ambalangoda",
  "baddegama": "Baddegama",
  "balapitiya": "Balapitiya",
  "benthota": "Benthota",
  "bope-poddala": "Bope-Poddala",
  "elpitiya": "Elpitiya",
  "gonapinuwala": "Gonapinuwala",
  "habaraduwa": "Habaraduwa",
  "hikkaduwa": "Hikkaduwa",
  "imaduwa": "Imaduwa",
  "karandeniya": "Karandeniya",
  "madampagama": "Madampagama",
  "nagoda": "Nagoda",
  "neluwa": "Neluwa",
  "niyagama": "Niyagama",
  "rathgama": "Rathgama",
  "thawalama": "Thawalama",
  "waduramba": "Waduramba",
  "welivitiya": "Welivitiya-Divithura",
  "yakkalamulla": "Yakkalamulla",
  "akuressa": "Akuressa",
  "athuraliya": "Athuraliya",
  "devinuwara": "Devinuwara",
  "dickwella": "Dickwella",
  "hakmana": "Hakmana",
  "kamburupitiya": "Kamburupitiya",
  "kirinda": "Kirinda Puhulwella",
  "kotapola": "Kotapola",
  "malimbada": "Malimbada",
  "matara-ds": "Matara",
  "mulatiyana": "Mulatiyana",
  "pasgoda": "Pasgoda",
  "pitabeddara": "Pitabeddara",
  "thihagoda": "Thihagoda",
  "weligama": "Weligama",
  "welipitiya": "Welipitiya",
  "ambalantota": "Ambalantota",
  "angunakolapelessa": "Angunakolapelessa",
  "beliatta": "Beliatta",
  "hambantota-ds": "Hambantota",
  "katuwana": "Katuwana",
  "lunugamvehera": "Lunugamvehera",
  "okewela": "Okewela",
  "sooriyawewa": "Sooriyawewa",
  "tangalle": "Tangalle",
  "thissamaharama": "Thissamaharama",
  "weeraketiya": "Weeraketiya",
  "walasmulla": "Walasmulla",
};

/**
 * Safe lookup into a label map keyed by a specific string-literal union
 * (e.g. `DISTRICT_LABELS`), for callers holding a plain, unknown-origin
 * string (form data, a rendered option) rather than that literal type.
 */
export function lookupLabel<K extends string>(labels: Record<K, string>, key: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(labels, key) ? labels[key as K] : undefined;
}

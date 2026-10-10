// Curated 2D Home Services - QuickServe Marketplace

export interface HomeServiceCard {
  id: string;
  title: string;
  title_hi: string;
  categorySlug: string;
  categoryId: string;
  subServiceName: string;
  image: string;
  startingPrice: number;
  duration_mins: number;
  tagline: string;
  filterGroup: 'all' | 'kitchen' | 'cleaning' | 'repairs';
  isPopular?: boolean;
  includedTasks: string[];
  excludedTasks: string[];
  includedTasks_hi: string[];
  excludedTasks_hi: string[];
  materialsNote?: string;
  materialsNote_hi?: string;
}

export const professionalHomeServices: HomeServiceCard[] = [
  // ==========================================
  // 1. CLEANING & MAID SERVICES
  // ==========================================
  {
    id: 's-hourly',
    title: 'Hourly House Maid & Helper',
    title_hi: 'प्रति घंटा घरेलू सहायिका',
    categorySlug: 'maid-helper',
    categoryId: 'cat-maid',
    subServiceName: 'Emergency household helper',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80',
    startingPrice: 199,
    duration_mins: 60,
    tagline: 'On-demand helper for dusting, mopping & kitchen chores',
    filterGroup: 'cleaning',
    isPopular: true,
    includedTasks: [
      'Room tidying, dusting & organizing items',
      'Floor sweeping and disinfectant mopping',
      'Utensil dishwashing & kitchen platform clearing',
      'Vegetable peeling, chopping & meal prep assistance'
    ],
    excludedTasks: [
      'Moving heavy furniture (>15 kg) or high ladder work',
      'Exterior balcony glass cleaning at unsafe heights',
      'Full meal cooking for parties (book dedicated cook)'
    ],
    includedTasks_hi: [
      'कमरे की व्यवस्था, डस्टिंग और सामान व्यवस्थित करना',
      'झाड़ू लगाना और फर्श का फिनाइल पोछा',
      'बर्तनों की धुलाई और किचन स्लैब की सफाई'
    ],
    excludedTasks_hi: [
      'भारी फर्नीचर (15 किग्रा से अधिक) उठाना',
      'ऊंचाई पर बाहरी खिड़कियों की सफाई'
    ],
    materialsNote: 'Customer to provide broom, mop, cleaning liquids & bucket.'
  },
  {
    id: 's-bathroom',
    title: 'Bathroom Deep Cleaning',
    title_hi: 'बाथरूम की गहरी सफाई',
    categorySlug: 'maid-helper',
    categoryId: 'cat-maid',
    subServiceName: 'Deep bathroom sanitization',
    image: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&auto=format&fit=crop&q=80',
    startingPrice: 399,
    duration_mins: 45,
    tagline: 'Spotless tiles, commode, mirror and sink descaling',
    filterGroup: 'cleaning',
    isPopular: true,
    includedTasks: [
      'Toilet pot, commode rim & jet thorough scrubbing',
      'Wall tile soap scum, scaling & yellow stain removal',
      'Chrome tap, showerhead & fixtures descaling & shine',
      'Floor scrubbing, drain clearing & pleasant scent spray'
    ],
    excludedTasks: [
      'Underground drainage excavation or sewer line unclogging',
      'Replacing broken tiles or plumbing pipe repair'
    ],
    includedTasks_hi: [
      'टॉयलेट पॉट, सीट रिम और जेट की ब्रश से गहरी सफाई',
      'दीवार की टाइल्स पर साबुन व पानी के जिद्दी दाग हटाना',
      'नल, शॉवर और क्रोम फिटिंग्स से खारे पानी के निशान हटाना'
    ],
    excludedTasks_hi: [
      'सीवर लाइन की खुदाई या टाइल्स बदलना'
    ]
  },
  {
    id: 's-sweeping',
    title: 'Floor Sweeping & Mopping',
    title_hi: 'झाड़ू और पोछा सेवा',
    categorySlug: 'maid-helper',
    categoryId: 'cat-maid',
    subServiceName: 'Disinfectant floor care',
    image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=600&auto=format&fit=crop&q=80',
    startingPrice: 149,
    duration_mins: 35,
    tagline: 'Corner-to-corner floor sweeping & fragrant phenyl mopping',
    filterGroup: 'cleaning',
    includedTasks: [
      'Dry sweeping of all rooms, living area & balconies',
      'Under-bed and sofa-edge dust bunny removal',
      'Disinfectant germ-kill wet mopping of all hard floors',
      'Waste paper bin emptying & trash bag tie-up'
    ],
    excludedTasks: [
      'Industrial floor buffering machine grinding',
      'Cement mortar paint scraping from floor tiles'
    ],
    includedTasks_hi: [
      'सभी कमरों में अच्छी तरह झाड़ू लगाना',
      'फिनाइल और कीटाणुनाशक से गीला पोछा लगाना'
    ],
    excludedTasks_hi: [
      'मशीन से मार्बल घिसाई'
    ]
  },
  {
    id: 's-kitchen-prep',
    title: 'Kitchen Platform & Slab Clean',
    title_hi: 'किचन स्लैब व चिमनी सफाई',
    categorySlug: 'maid-helper',
    categoryId: 'cat-maid',
    subServiceName: 'Degreasing cooking counter',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
    startingPrice: 249,
    duration_mins: 40,
    tagline: 'Countertop degreasing, stove burner scrub & tile shine',
    filterGroup: 'kitchen',
    includedTasks: [
      'Gas stove top, brass burners & drip tray degreasing',
      'Granite kitchen platform & backsplash tile scrub',
      'Kitchen sink scrubbing and drain strainer clearing',
      'Wiping cabinet exterior door fronts'
    ],
    excludedTasks: [
      'Opening motor chimney duct motor assembly',
      'Pest control fumigation inside hollow cabinets'
    ],
    includedTasks_hi: [
      'गैस चूल्हा, बर्नर और स्लैब से तेल-मसाले के दाग हटाना',
      'किचन सिंक और जाली की गहरी सफाई'
    ],
    excludedTasks_hi: [
      'चिमनी की मोटर खोलना'
    ]
  },
  {
    id: 's-fridge',
    title: 'Refrigerator Deep Sanitization',
    title_hi: 'फ्रिज की अंदरूनी सफाई',
    categorySlug: 'maid-helper',
    categoryId: 'cat-maid',
    subServiceName: 'Food-safe fridge detailing',
    image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&auto=format&fit=crop&q=80',
    startingPrice: 299,
    duration_mins: 40,
    tagline: 'Shelves removal, odor removal & antibacterial wipe',
    filterGroup: 'kitchen',
    includedTasks: [
      'Removing all shelves, vegetable crisper baskets & door racks',
      'Warm soap wash of all trays and stain wipeout',
      'Door rubber gasket fungal mildew wipe & deodorizing spray'
    ],
    excludedTasks: [
      'Compressor cooling gas refill or electrical thermostat repair'
    ],
    includedTasks_hi: [
      'फ्रिज की सभी ट्रे और बास्केट धोकर साफ करना',
      'रबर गास्केट से फंगस हटाना व बदबू दूर करना'
    ],
    excludedTasks_hi: [
      'गैस रिफिल या कंप्रेसर रिपेयर'
    ]
  },

  // ==========================================
  // 2. PLUMBER SERVICES
  // ==========================================
  {
    id: 's-plumbing-tap',
    title: 'Tap Repair & Replacement',
    title_hi: 'नल रिपेयर व नया नल लगाना',
    categorySlug: 'plumber',
    categoryId: 'cat-plumber',
    subServiceName: 'Dripping tap & mixer repair',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80',
    startingPrice: 299,
    duration_mins: 35,
    tagline: 'Fix continuous water dripping, spindle & washer replacement',
    filterGroup: 'repairs',
    isPopular: true,
    includedTasks: [
      'Fixing dripping taps, replacing worn rubber washers & spindle',
      'Installing new kitchen sink mixer, bib cock, or angle valve',
      'Replacing leaking health faucets, jet sprays & flexible hoses',
      'Teflon tape waterproof sealing of pipe joints'
    ],
    excludedTasks: [
      'Breaking concealed bathroom tiles to trace underground pipes',
      'Free replacement hardware (new taps provided by customer)'
    ],
    includedTasks_hi: [
      'टपकते नल का वाशर या स्पिंडल बदलकर लीकेज बंद करना',
      'नया नल, मिक्सर या जेट स्प्रे लगाना',
      'टेफ्लॉन टेप से जोड़ों को वाटरप्रूफ सील करना'
    ],
    excludedTasks_hi: [
      'दीवार की टाइल्स तोड़ना'
    ]
  },
  {
    id: 's-plumbing-pipe',
    title: 'Pipe Leakage & Seepage Fix',
    title_hi: 'पाइप लीकेज व सीपेज मरम्मत',
    categorySlug: 'plumber',
    categoryId: 'cat-plumber',
    subServiceName: 'Leakage diagnosis & sealing',
    image: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&auto=format&fit=crop&q=80',
    startingPrice: 399,
    duration_mins: 45,
    tagline: 'Locate water leaks, seal joints & replace cracked PVC pipes',
    filterGroup: 'repairs',
    includedTasks: [
      'Diagnosing wall seepage and dripping pipe joints',
      'Replacing cracked PVC / CPVC elbow, union & pipe section',
      'Pressure testing of pipe after sealant application'
    ],
    excludedTasks: [
      'Major structural wall demolition or underground water mains excavation'
    ],
    includedTasks_hi: [
      'लीक हो रहे पाइप और जोड़ों को ढूंढकर सील करना',
      'टूटी हुई पीवीसी फिटिंग बदलना'
    ],
    excludedTasks_hi: [
      'बड़ी दीवार तोड़ना'
    ]
  },
  {
    id: 's-plumbing-drain',
    title: 'Sink & Drainage Unclog',
    title_hi: 'सिंक व नाली ब्लॉकेज हटाना',
    categorySlug: 'plumber',
    categoryId: 'cat-plumber',
    subServiceName: 'Drainage clearing',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
    startingPrice: 349,
    duration_mins: 40,
    tagline: 'Clear kitchen sink, washbasin & bathroom drain blockages',
    filterGroup: 'repairs',
    includedTasks: [
      'Unclogging washbasin bottle traps & clearing hair/soap debris',
      'Clearing kitchen sink food blockages using mechanical wire',
      'Flushing drain with safe cleaning agent for free water flow'
    ],
    excludedTasks: [
      'Main society sewer line jetting requiring municipal tanker'
    ],
    includedTasks_hi: [
      'वॉशबेसिन और सिंक के नीचे जमी गंदगी निकालना',
      'ड्रेन पाइप खोलकर पानी का बहाव चालू करना'
    ],
    excludedTasks_hi: [
      'सोसायटी की मुख्य सीवर लाइन'
    ]
  },

  // ==========================================
  // 3. ELECTRICIAN SERVICES
  // ==========================================
  {
    id: 's-fan',
    title: 'Ceiling Fan & Switch Repair',
    title_hi: 'पंखा और स्विच मरम्मत',
    categorySlug: 'electrician',
    categoryId: 'cat-electrician',
    subServiceName: 'Fan & switchboard service',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
    startingPrice: 249,
    duration_mins: 35,
    tagline: 'Fan regulator fix, capacitor replacement & switch repair',
    filterGroup: 'repairs',
    isPopular: true,
    includedTasks: [
      'Ceiling fan unmounting, downrod inspection & capacitor check',
      'Replacing burnt modular switch, 3-pin socket or fan regulator',
      'Eliminating noisy fan hum or wobble alignment'
    ],
    excludedTasks: [
      'Motor copper rewinding for burnt motors (requires workshop)',
      'New electrical accessories (customer to provide switches)'
    ],
    includedTasks_hi: [
      'सीलिंग पंखे का कैपेसिटर या रेगुलेटर बदलना',
      'खराब या जला हुआ स्विच/सॉकेट बदलना',
      'पंखे की आवाज़ व बैलेंस ठीक करना'
    ],
    excludedTasks_hi: [
      'पंखे की मोटर वाइंडिंग (वर्कशॉप का काम)'
    ]
  },
  {
    id: 's-light-fitting',
    title: 'Light Fitting & LED Setup',
    title_hi: 'लाइट, झूमर व एलईडी इंस्टॉलेशन',
    categorySlug: 'electrician',
    categoryId: 'cat-electrician',
    subServiceName: 'Lighting installation',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
    startingPrice: 199,
    duration_mins: 30,
    tagline: 'Install wall sconces, ceiling LED panels, tube lights & chandeliers',
    filterGroup: 'repairs',
    includedTasks: [
      'Drilling and mounting new LED batten or false ceiling spotlights',
      'Wiring connection to existing switchboard with insulation',
      'Safety testing of earthing and switch polarity'
    ],
    excludedTasks: [
      'High ladder work exceeding 12 feet without scaffolding'
    ],
    includedTasks_hi: [
      'नई ट्यूबलाइट, एलईडी पैनल या वॉल लाइट लगाना',
      'वायरिंग और अर्थिंग की जांच'
    ],
    excludedTasks_hi: [
      '12 फीट से ऊंची छत पर काम'
    ]
  },
  {
    id: 's-mcb-repair',
    title: 'MCB Tripping & Short Circuit Fix',
    title_hi: 'एमसीबी ट्रिपिंग व शॉर्ट सर्किट डायग्नोसिस',
    categorySlug: 'electrician',
    categoryId: 'cat-electrician',
    subServiceName: 'Electrical fault diagnosis',
    image: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=600&auto=format&fit=crop&q=80',
    startingPrice: 499,
    duration_mins: 45,
    tagline: 'Troubleshoot frequent power cut, MCB tripping & burnt wires',
    filterGroup: 'repairs',
    includedTasks: [
      'Multimeter diagnosis of short-circuit loop in house circuit',
      'Isolating faulty appliance line and testing load distribution',
      'Replacing faulty single pole or double pole MCB breaker'
    ],
    excludedTasks: [
      'Complete house rewiring through concealed conduits'
    ],
    includedTasks_hi: [
      'बार-बार एमसीबी गिरने का कारण ढूंढकर ठीक करना',
      'शॉर्ट सर्किट की लाइन अलग करना व एमसीबी बदलना'
    ],
    excludedTasks_hi: [
      'पूरे घर की नई वायरिंग'
    ]
  },

  // ==========================================
  // 4. AC & APPLIANCES SERVICES
  // ==========================================
  {
    id: 's-ac-service',
    title: 'AC Power Jet Servicing',
    title_hi: 'एसी पावर जेट सर्विसिंग',
    categorySlug: 'ac-repair',
    categoryId: 'cat-ac-repair',
    subServiceName: 'High-pressure AC foam jet wash',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&auto=format&fit=crop&q=80',
    startingPrice: 499,
    duration_mins: 45,
    tagline: 'High-pressure water jet cleaning of indoor and outdoor coils',
    filterGroup: 'repairs',
    isPopular: true,
    includedTasks: [
      'Indoor unit coil, blower & filter high-pressure jet wash',
      'Outdoor unit condenser coil wash & debris removal',
      'Drain tray & pipe clearing to prevent indoor water dripping',
      'Cooling temperature and airflow performance test'
    ],
    excludedTasks: [
      'Refrigerant gas leak repair or full gas top-up (charged extra if needed)',
      'PCB circuit board replacement'
    ],
    includedTasks_hi: [
      'अंदर और बाहर की यूनिट की हाई-प्रेशर जेट धुलाई',
      'फिल्टर सफाई और एंटीबैक्टीरियल स्प्रे',
      'ड्रेन पाइप की सफाई ताकि पानी न टपके'
    ],
    excludedTasks_hi: [
      'गैस रीफिल या पीसीबी बदलना'
    ]
  },
  {
    id: 's-appliance-repair',
    title: 'Washing Machine & Fridge Repair',
    title_hi: 'वाशिंग मशीन और फ्रिज रिपेयर',
    categorySlug: 'ac-repair',
    categoryId: 'cat-ac-repair',
    subServiceName: 'Doorstep appliance diagnostic & fix',
    image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&auto=format&fit=crop&q=80',
    startingPrice: 399,
    duration_mins: 45,
    tagline: 'Diagnosis & repair by certified appliance technician',
    filterGroup: 'repairs',
    includedTasks: [
      'Complete diagnostic of motor, drum, thermostat & PCB sensor',
      'Washing machine drum spinning or drainage issue fix',
      'Single/double door refrigerator cooling loss diagnosis',
      'Minor wiring and relay contact adjustment'
    ],
    excludedTasks: [
      'Cost of new spare parts (billed transparently at standard MRP)',
      'Compressor motor replacement'
    ],
    includedTasks_hi: [
      'मोटर, ड्रम और थर्मोस्टेट की पूरी जांच',
      'पानी न निकलने या ड्रम न घूमने की समस्या ठीक करना',
      'फ्रिज में कूलिंग की जांच'
    ],
    excludedTasks_hi: [
      'नये स्पेयर पार्ट्स का खर्च'
    ]
  },

  // ==========================================
  // 5. COOK / HOME MEAL PREPARATION
  // ==========================================
  {
    id: 's-cook-meal',
    title: 'Daily Home Meal Cook',
    title_hi: 'दैनिक भोजन कुक',
    categorySlug: 'cook',
    categoryId: 'cat-cook',
    subServiceName: 'Fresh home cooked meal',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&auto=format&fit=crop&q=80',
    startingPrice: 349,
    duration_mins: 60,
    tagline: 'Fresh breakfast, lunch, or dinner cooked right in your kitchen',
    filterGroup: 'kitchen',
    isPopular: true,
    includedTasks: [
      'Preparing 1 sabzi, 1 dal, fresh rotis/phulkas, and rice',
      'Custom spice levels as per family preferences',
      'Healthy home-style food preparation with clean hygiene',
      'Kitchen platform wiped clean after cooking'
    ],
    excludedTasks: [
      'Groceries and vegetables (customer to provide raw ingredients)',
      'Deep dishwashing of multiple utensils outside cooking pots'
    ],
    includedTasks_hi: [
      '1 सब्जी, दाल, ताज़ी रोटियां और चावल बनाना',
      'परिवार की पसंद के अनुसार मसाले व तेल',
      'किचन स्लैब की सफाई'
    ],
    excludedTasks_hi: [
      'राशन व सब्जियां ग्राहक को देनी होंगी'
    ]
  },
  {
    id: 's-cook-party',
    title: 'Party & Gathering Cook',
    title_hi: 'पार्टी भोजन कुक (5-8 लोग)',
    categorySlug: 'cook',
    categoryId: 'cat-cook',
    subServiceName: 'Special dishes for 5-8 guests',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=80',
    startingPrice: 899,
    duration_mins: 120,
    tagline: 'Multi-course festive meal for family get-togethers & guests',
    filterGroup: 'kitchen',
    includedTasks: [
      '2 Special curries/gravies + Dal + Pulao/Biryani + Breads',
      'Snacks / Starter preparation assistance',
      'Hygienic and presentable meal preparation'
    ],
    excludedTasks: [
      'Grocery raw materials (to be provided by host)',
      'Table serving / catering staff'
    ],
    includedTasks_hi: [
      'पार्टी के लिए 2 विशेष सब्जियां, दाल, पुलाव व रोटी'
    ],
    excludedTasks_hi: [
      'सामग्री मेजबान द्वारा दी जाएगी'
    ]
  },

  // ==========================================
  // 6. MOVING HELP & TRANSPORT
  // ==========================================
  {
    id: 's-moving-truck',
    title: 'Mini Truck / Tempo on Demand',
    title_hi: 'मिनी ट्रक / टेम्पो ऑन डिमांड',
    categorySlug: 'packers',
    categoryId: 'cat-packers',
    subServiceName: 'Local goods transport',
    image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&auto=format&fit=crop&q=80',
    startingPrice: 799,
    duration_mins: 60,
    tagline: 'Tata Ace / Champion vehicle for local furniture & luggage transport',
    filterGroup: 'repairs',
    isPopular: true,
    includedTasks: [
      'Direct doorstep arrival of mini truck for point-to-point transit',
      'Transit within city zone for furniture, boxes, luggage',
      'Secure cargo tying with ropes & tarpaulin'
    ],
    excludedTasks: [
      'Toll and state border tax (if applicable outside zone)',
      'Inter-state transport'
    ],
    includedTasks_hi: [
      'घर के सामान के लिए मिनी ट्रक ऑन डिमांड',
      'रस्सी और तिरपाल से सुरक्षित सामान'
    ],
    excludedTasks_hi: [
      'टोल टैक्स अलग से रहेगा'
    ]
  },
  {
    id: 's-moving-helpers',
    title: 'Moving & Shifting Helpers',
    title_hi: 'सामान शिफ्टिंग हेल्पर',
    categorySlug: 'packers',
    categoryId: 'cat-packers',
    subServiceName: 'Heavy lifting & packing labor',
    image: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=600&auto=format&fit=crop&q=80',
    startingPrice: 499,
    duration_mins: 60,
    tagline: 'Trained helpers for loading, unloading & carrying up stairs',
    filterGroup: 'repairs',
    includedTasks: [
      'Carrying heavy furniture, sofa, beds, fridge across stairs/lift',
      'Loading and unloading into vehicle carefully',
      'Placing heavy items in designated rooms'
    ],
    excludedTasks: [
      'Carpentry dismantling of modular wardrobes without tools',
      'Packing boxes and bubble wrap (provided separately)'
    ],
    includedTasks_hi: [
      'भारी फर्नीचर, फ्रिज, सोफा सीढ़ियों से चढ़ाना/उतारना',
      'गाड़ी में सामान लोड और अनलोड करना'
    ],
    excludedTasks_hi: [
      'बॉक्स और पैकिंग सामग्री अतिरिक्त'
    ]
  },
  {
    id: 's-packing',
    title: 'Luggage & Box Packing Help',
    title_hi: 'पैकिंग व अनपैकिंग सहायता',
    categorySlug: 'packers',
    categoryId: 'cat-packers',
    subServiceName: 'Cardboard box & luggage packing',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
    startingPrice: 349,
    duration_mins: 45,
    tagline: 'Neat packing of kitchen crockery, books, clothes & carton sealing',
    filterGroup: 'repairs',
    includedTasks: [
      'Wrapping delicate kitchenware with protective sheets',
      'Boxing and sealing cartons with strong adhesive tape',
      'Labeling boxes for easy room-wise unpacking'
    ],
    excludedTasks: [
      'Packing material cost (cartons & bubble wraps provided by user)'
    ],
    includedTasks_hi: [
      'कांच के बर्तन और कपड़े डिब्बों में पैक करना',
      'टेप लगाना और डिब्बों पर मार्कर से लिखना'
    ],
    excludedTasks_hi: [
      'कार्टन बॉक्स का खर्च'
    ]
  }
];

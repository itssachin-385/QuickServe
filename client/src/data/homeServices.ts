// Curated 3D Diorama Home Services - QuickServe Marketplace

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
  {
    id: 's-hourly',
    title: 'Hourly bookings',
    title_hi: 'प्रति घंटा बुकिंग',
    categorySlug: 'maid-helper',
    categoryId: 'cat-maid',
    subServiceName: 'Emergency household helper',
    image: '/images/hourly_bookings_3d.jpg',
    startingPrice: 199,
    duration_mins: 60,
    tagline: 'On-demand helper for flexible hours',
    filterGroup: 'cleaning',
    isPopular: true,
    includedTasks: [
      'Room tidying, dusting & organizing items',
      'Floor sweeping and disinfectant mopping',
      'Utensil dishwashing & kitchen platform clearing',
      'Folding clean laundry, bed making & wardrobe stacking',
      'Vegetable peeling, chopping & meal prep assistance'
    ],
    excludedTasks: [
      'Moving heavy furniture (>15 kg) or high ladder work',
      'Exterior balcony glass cleaning at unsafe heights',
      'Deep chemical bathroom scrubbing or pet feces cleanup',
      'Full meal cooking for parties (book dedicated cook)'
    ],
    includedTasks_hi: [
      'कमरे की व्यवस्था, डस्टिंग और सामान व्यवस्थित करना',
      'झाड़ू लगाना और फर्श का फिनाइल पोछा',
      'बर्तनों की धुलाई और किचन स्लैब की सफाई',
      'साफ कपड़े तय लगाना, बिस्तर बनाना और अलमारी में रखना',
      'सब्जी काटना, छीलना और कुकिंग में मदद'
    ],
    excludedTasks_hi: [
      'भारी फर्नीचर (15 किग्रा से अधिक) उठाना',
      'ऊंचाई पर बालकनी के बाहरी कांच साफ करना',
      'बाथरूम की एसिड से गहरी सफाई या पालतू जानवरों की गंदगी',
      'पार्टी के लिए पूरा खाना बनाना (कुक बुक करें)'
    ],
    materialsNote: 'Customer to provide broom, mop, cleaning liquids & bucket.',
    materialsNote_hi: 'ग्राहक को झाड़ू, पोछा, बाल्टी व फिनाइल उपलब्ध कराना होगा।'
  },
  {
    id: 's-bathroom',
    title: 'Bathroom Cleaning',
    title_hi: 'बाथरूम की गहरी सफाई',
    categorySlug: 'maid-helper',
    categoryId: 'cat-maid',
    subServiceName: 'Deep bathroom sanitization',
    image: '/images/bathroom_clean_3d.jpg',
    startingPrice: 399,
    duration_mins: 40,
    tagline: 'Tiles, toilet, and sink scrub',
    filterGroup: 'cleaning',
    isPopular: true,
    includedTasks: [
      'Toilet pot, commode rim & water jet thorough scrubbing',
      'Wall tile soap scum, scaling & yellow stain removal',
      'Washbasin, counter and mirror stain-free buffing',
      'Chrome tap, showerhead & fixtures descaling & shine',
      'Floor scrubbing, drain strainer clearing & pleasant scent spray'
    ],
    excludedTasks: [
      'Underground drainage excavation or sewer line unclogging',
      'Deep hard-water corrosion etched into decades-old marble',
      'Ceiling mold scraping or wall painting',
      'Replacing broken tiles or plumbing pipe repair'
    ],
    includedTasks_hi: [
      'टॉयलेट पॉट, सीट रिम और जेट की ब्रश से गहरी सफाई',
      'दीवार की टाइल्स पर साबुन व पानी के जिद्दी दाग हटाना',
      'वॉशबेसिन, कांच और शेल्फ की चमकदार सफाई',
      'नल, शॉवर और क्रोम फिटिंग्स से खारे पानी के निशान हटाना',
      'फर्श की मशीन/ब्रश से रगड़ाई और जाली की सफाई'
    ],
    excludedTasks_hi: [
      'जमीन के अंदर सीवर पाइप की खुदाई या जाम खोलना',
      'सालों पुराने मार्बल में गहराई तक बैठ चुके निशान',
      'छत की फंगस छीलना या पेंट का काम',
      'टूटी टाइल्स बदलना या नया पाइप लगाना'
    ],
    materialsNote: 'Professional brings standard descaling agent & scrubbing brushes.',
    materialsNote_hi: 'प्रोफेशनल अपने साथ टॉयलेट क्लीनर, ब्रश और स्क्रब लेकर आते हैं।'
  },
  {
    id: 's-fridge',
    title: 'Fridge Cleaning',
    title_hi: 'फ्रिज की सफाई',
    categorySlug: 'maid-helper',
    categoryId: 'cat-maid',
    subServiceName: 'Refrigerator sanitization',
    image: '/images/fridge_cleaning_3d.jpg',
    startingPrice: 299,
    duration_mins: 30,
    tagline: 'Deep sanitization of shelves and odor removal',
    filterGroup: 'kitchen',
    includedTasks: [
      'Unloading, washing & drying all removable shelves & crisper trays',
      'Anti-bacterial wipe-down of interior walls and ice box',
      'Rubber door gasket deep cleaning to eliminate trapped fungus',
      'Exterior door wiping, handle sanitization & top dust removal',
      'Safe reloading of food containers & natural lemon odor neutralizer'
    ],
    excludedTasks: [
      'Gas refilling, compressor repair, or electrical fixes',
      'Defrosting heavily frozen freezers (please turn off 2 hrs prior)',
      'Discarding expired food without explicit customer instruction'
    ],
    includedTasks_hi: [
      'फ्रिज की सभी ट्रे और दराज बाहर निकालकर धोना और सुखाना',
      'अंदर की दीवारों की कीटाणुनाशक वाइप से सफाई',
      'दरवाजे की रबर गैसकेट में जमी फंगस व गंदगी साफ करना',
      'बाहरी दरवाजे, हैंडल और ऊपर की धूल साफ करना',
      'सामान को वापस सलीके से जमाना और दुर्गंध मिटाना'
    ],
    excludedTasks_hi: [
      'फ्रिज की गैस भरना, कंप्रेसर या वायरिंग रिपेयर',
      'जमी हुई बर्फ पिघलाना (कृपया 2 घंटे पहले फ्रिज बंद कर दें)',
      'बिना पूछे किसी भी खाने-पीने की वस्तु को फेंकना'
    ],
    materialsNote: 'Food-safe sanitizing agents and microfiber cloths are used.',
    materialsNote_hi: 'खाने की सुरक्षा के अनुकूल क्लीनर और माइक्रोफाइबर कपड़े इस्तेमाल किए जाते हैं।'
  },
  {
    id: 's-packing',
    title: 'Packing or Unpacking',
    title_hi: 'पैकिंग व अनपैकिंग',
    categorySlug: 'maid-helper',
    categoryId: 'cat-maid',
    subServiceName: 'Luggage and carton packing assistance',
    image: '/images/luggage_packing_3d.jpg',
    startingPrice: 499,
    duration_mins: 45,
    tagline: 'Safe luggage and household packing',
    filterGroup: 'cleaning',
    includedTasks: [
      'Folding clothes, quilts & neatly packing into luggage / cartons',
      'Cushioning and wrapping fragile crockery, glassware & decor',
      'Labeling boxes room-wise for easy unpacking after move',
      'Unpacking cartons, placing items in shelves & collapsing empty boxes'
    ],
    excludedTasks: [
      'Relocation logistics or loading/driving transport tempo trucks',
      'Dismantling heavy hydraulic beds, godrej almirahs, or large ACs',
      'Handling cash, jewelry, confidential deeds, or flammable goods'
    ],
    includedTasks_hi: [
      'कपड़े तय करना, चादरें समेटना और सूटकेस/कार्टन में पैक करना',
      'कांच के बर्तन, क्रॉकरी और नाजुक सामान को सुरक्षित लपेटना',
      'बक्सों पर रूम-वाइज लेबल लगाना ताकि बाद में आसानी हो',
      'नए घर में कार्टन खोलकर अलमारी में सामान सलीके से लगाना'
    ],
    excludedTasks_hi: [
      'सामान को लोडिंग ऑटो/ट्रक में ढोना या गाड़ी चलाना',
      'हाइड्रोलिक बेड या लोहे की भारी अलमारी खोलना/खोलकर जोड़ना',
      'कैश, जेवरात या कीमती कागजात को हाथ लगाना'
    ],
    materialsNote: 'Customer to provide cardboard boxes, tape & bubble wrap.',
    materialsNote_hi: 'ग्राहक को गत्ते के डिब्बे, सेलो टेप व बबलगम रैप उपलब्ध कराना होगा।'
  },
  {
    id: 's-utensils',
    title: 'Utensils',
    title_hi: 'बर्तन सफाई',
    categorySlug: 'maid-helper',
    categoryId: 'cat-maid',
    subServiceName: 'Kitchen dishwashing',
    image: '/images/utensils_3d.jpg',
    startingPrice: 249,
    duration_mins: 25,
    tagline: 'Hygienic kitchen dishwashing',
    filterGroup: 'kitchen',
    isPopular: true,
    includedTasks: [
      'Scrubbing plates, bowls, cups, spoons & non-stick cookware',
      'Cleaning daily cooking pots, pressure cookers, kadhais & tawas',
      'Washing delicate glassware with soft scratch-free sponges',
      'Clearing leftover food debris from sink strainer and sink basin wipe',
      'Stacking clean vessels neatly on dish drying rack'
    ],
    excludedTasks: [
      'Deep metal sanding of carbon burn marks accumulated over months',
      'Chimney filter degreasing (book separate Kitchen Deep Clean)',
      'Commercial hotel/restaurant banquet bulk dishwashing'
    ],
    includedTasks_hi: [
      'थाली, कटोरी, कप, चम्मच और नॉन-स्टिक बर्तनों की धुलाई',
      'रोजाना इस्तेमाल होने वाले कुकर, कढ़ाई और तवे की सफाई',
      'कांच के बर्तनों को बिना खरोंच वाले स्पंज से सावधानीपूर्वक धोना',
      'सिंक की जाली से बचा हुआ कचरा निकालना और सिंक साफ करना',
      'धुले बर्तनों को रैक पर सलीके से सूखने के लिए लगाना'
    ],
    excludedTasks_hi: [
      'सालों पुराने जले हुए बर्तनों को रेगमाल से घिसना',
      'रसोई की चिमनी की जाली साफ करना (अलग सर्विस बुक करें)',
      'होटल या रेस्टोरेंट के बल्क बर्तनों की धुलाई'
    ],
    materialsNote: 'Customer provides dishwash bar/liquid & scrub pad.',
    materialsNote_hi: 'ग्राहक को विम बार/लिक्विड और बर्तन धोने का स्क्रबर देना होगा।'
  },
  {
    id: 's-kitchen-prep',
    title: 'Kitchen Prep',
    title_hi: 'रसोई कटिंग व तैयारी',
    categorySlug: 'maid-helper',
    categoryId: 'cat-maid',
    subServiceName: 'Cooking preparation assistance',
    image: '/images/kitchen_prep_3d.jpg',
    startingPrice: 299,
    duration_mins: 30,
    tagline: 'Vegetable chopping and meal preparation',
    filterGroup: 'kitchen',
    includedTasks: [
      'Washing, peeling & fine chopping onions, tomatoes, greens & veggies',
      'Kneading soft wheat dough (atta gundhna) for chapatis',
      'Grinding fresh ginger-garlic paste & dry spice mix preparation',
      'Boiling & mashing potatoes, shelling peas & soaking pulses',
      'Wiping kitchen platform, gas burner surround & prep bowls'
    ],
    excludedTasks: [
      'Full main course cooking of complex party dishes',
      'Going outside to the grocery market to purchase raw vegetables',
      'Commercial tandoor baking or deep oil frying at high heat'
    ],
    includedTasks_hi: [
      'सब्जियों, प्याज, टमाटर व हरी सब्जियों को धोना, छीलना और काटना',
      'रोटियों के लिए नरम आटा गूंधना',
      'अदरक-लहसुन का पेस्ट पीसना और मसालों की तैयारी',
      'आलू उबालना, छीलना, मटर छीलना और दाल भिगोना',
      'कटिंग के बाद किचन स्लैब और गैस चूल्हे के आसपास की सफाई'
    ],
    excludedTasks_hi: [
      'पार्टी या दावत के लिए पूरा भोजन स्वयं पकाना',
      'सब्जी मंडी जाकर कच्चा सामान खरीदकर लाना',
      'तंदूर या बड़ी भट्टी पर काम करना'
    ],
    materialsNote: 'Raw vegetables, spices & cookware provided by customer.',
    materialsNote_hi: 'कच्ची सब्जियां, मसाले और बर्तन ग्राहक द्वारा उपलब्ध कराए जाएंगे।'
  },
  {
    id: 's-dusting',
    title: 'Dusting & Wiping',
    title_hi: 'डस्टिंग व पोछा',
    categorySlug: 'maid-helper',
    categoryId: 'cat-maid',
    subServiceName: 'Surface wiping & dusting',
    image: '/images/dusting_wiping_3d.jpg',
    startingPrice: 349,
    duration_mins: 35,
    tagline: 'Microfiber surface sanitization',
    filterGroup: 'cleaning',
    includedTasks: [
      'Dry & damp microfiber dusting of study tables, TV unit & center tables',
      'Gentle dust wipe of electronics (TV screen, laptop desk, audio speakers)',
      'Window sills, door handles, light switchboards & photo frames',
      'Bookshelf, curio cabinet & open rack surface dusting',
      'Sofa cushions fluffing and dining table cloth arrangement'
    ],
    excludedTasks: [
      'Cleaning exterior high-rise window panes from the outside',
      'Dismantling fragile antique glass chandeliers or crystal items',
      'Scraping dried oil paint drops or adhesive sticker glue from walls'
    ],
    includedTasks_hi: [
      'स्टडी टेबल, टीवी यूनिट, सेंटर टेबल और अलमारी की डस्टिंग',
      'इलेक्ट्रॉनिक्स (टीवी स्क्रीन, कंप्यूटर टेबल) की सूखी वाइपिंग',
      'खिड़की की चौखट, दरवाजों के हैंडल और स्विच बोर्ड साफ करना',
      'किताबों की रैक, शो-पीस और दीवारों के फोटो फ्रेम पोछना',
      'सोफे के कुशन सही करना और डाइनिंग टेबल की सफाई'
    ],
    excludedTasks_hi: [
      'ऊंची मंजिलों पर खिड़की के बाहर लटककर कांच साफ करना',
      'पुराने कीमती झूमर खोलना या नाजुक शो-पीस धोना',
      'दीवारों से पेंट या पुराने स्टिकर के गोंद को खुरचना'
    ],
    materialsNote: 'Microfiber dusters & surface cleaning spray used.',
    materialsNote_hi: 'माइक्रोफाइबर डस्टर और ग्लास क्लीनर इस्तेमाल किया जाता है।'
  },
  {
    id: 's-sweeping',
    title: 'Sweeping & Mopping',
    title_hi: 'झाड़ू और पोछा',
    categorySlug: 'maid-helper',
    categoryId: 'cat-maid',
    subServiceName: 'Floor sweeping & deep mopping',
    image: '/images/sweeping_mopping_3d.jpg',
    startingPrice: 349,
    duration_mins: 35,
    tagline: 'Living rooms & bedrooms deep floor wipe',
    filterGroup: 'cleaning',
    isPopular: true,
    includedTasks: [
      'Full dry broom sweep across living, dining, kitchen & all bedrooms',
      'Reaching dust under movable beds, sofas, study tables & corners',
      'Wet mopping using disinfectant phenyl floor cleaner solution',
      'Attached balcony floor dry sweep and quick mop',
      'Collecting accumulated dust and disposing in customer household dustbin'
    ],
    excludedTasks: [
      'Industrial wet shampoo scrubbing of wall-to-wall fixed carpeting',
      'Moving heavy fixed wooden almirahs or heavy refrigerators',
      'Water jet pressure washing of terrace or parking courtyard'
    ],
    includedTasks_hi: [
      'लिविंग रूम, डाइनिंग, किचन और सभी कमरों में पूरी झाड़ू लगाना',
      'बेड, सोफा और टेबल के नीचे कोनों से धूल-मिट्टी निकालना',
      'खुशबूदार फिनाइल और कीटाणुनाशक से साफ पानी का पोछा लगाना',
      'अटैच बालकनी में झाड़ू और पोछा लगाना',
      'कूड़ा डस्टपैन में इकट्ठा करके घर के डस्टबिन में डालना'
    ],
    excludedTasks_hi: [
      'मशीन से पूरे कारपेट की शैम्पू धुलाई',
      'भारी लकड़ी की अलमारी या फ्रिज को खींचकर हटाना',
      'छत या खुली पार्किंग को प्रेशर पाइप से धोना'
    ],
    materialsNote: 'Customer provides floor broom, mop stick, bucket & phenyl.',
    materialsNote_hi: 'ग्राहक को झाड़ू, मॉप स्टिक, बाल्टी और फिनाइल देना होगा।'
  },
  {
    id: 's-pre-party',
    title: 'Pre-Party Express Clean',
    title_hi: 'पार्टी पूर्व सफाई',
    categorySlug: 'maid-helper',
    categoryId: 'cat-maid',
    subServiceName: 'Quick party area preparation',
    image: '/images/kitchen_prep_3d.jpg',
    startingPrice: 399,
    duration_mins: 45,
    tagline: 'Living room, guest washroom & table setting',
    filterGroup: 'cleaning',
    includedTasks: [
      'Living and dining hall express vacuum/sweep and fragrance mop',
      'Guest washroom sanitization (basin, toilet rim, mirror & clean hand towel check)',
      'Dining table wipe-down, plate placing & party glasses wipe',
      'Sofa cushion arrangement and front entry footwear organization',
      'Kitchen platform prep for incoming caterer/home cooking'
    ],
    excludedTasks: [
      'Deep sofa fabric shampooing or stain extraction (takes hours to dry)',
      'Cooking multi-dish snacks or tending drinks/serving guests',
      'Outdoor lawn decoration or lighting string installation'
    ],
    includedTasks_hi: [
      'लिविंग और डाइनिंग एरिया की तेज झाड़ू-पोछा और फ्रेश रूम स्प्रे',
      'गेस्ट वॉशरूम की तुरंत सफाई (बेसिन, आईना, टॉयलेट सीट)',
      'डाइनिंग टेबल साफ करना और पार्टी क्रॉकरी/ग्लास पोंछकर लगाना',
      'सोफा कुशन सजाना और मुख्य दरवाजे पर जूतों की रैक व्यवस्थित करना',
      'पार्टी की तैयारी के लिए किचन का काउंटर खाली और साफ करना'
    ],
    excludedTasks_hi: [
      'सोफे की गीली शैम्पू धुलाई (सूखने में समय लगता है)',
      'पार्टी का खाना पकाना या मेहमानों को सर्व करना',
      'बाहर गार्डन सजाना या बिजली की लड़ियां लगाना'
    ],
    materialsNote: 'Focuses on guest-facing zones for immediate entertaining.',
    materialsNote_hi: 'मेहमानों के बैठने वाले मुख्य कमरों को तुरंत तैयार किया जाता है।'
  },
  {
    id: 's-wardrobe',
    title: 'Complete Wardrobe Cleaning',
    title_hi: 'वार्डरोब व्यवस्था',
    categorySlug: 'maid-helper',
    categoryId: 'cat-maid',
    subServiceName: 'Wardrobe and closet organization',
    image: '/images/wardrobe_clean_3d.jpg',
    startingPrice: 449,
    duration_mins: 45,
    tagline: 'Clothes folding and closet organization',
    filterGroup: 'cleaning',
    includedTasks: [
      'Sorting clothes category-wise (shirts, pants, ethnic wear, daily wear)',
      'Neat folding of tumbled clothes and stack organization in closet racks',
      'Arranging hanger rods with coats, blazers, dresses & ironed shirts',
      'Undergarment and socks drawer compartmentalization',
      'Wiping dust from empty wardrobe shelves before replacing clothes'
    ],
    excludedTasks: [
      'Heavy bulk steam ironing of entire family laundry (requires laundry service)',
      'Tailoring, button stitching or cloth repairs',
      'Discarding any clothing without explicit customer consent'
    ],
    includedTasks_hi: [
      'कपड़ों को छांटना (फॉर्मल, डेली वियर, साड़ियां, बच्चों के कपड़े)',
      'बिखरे कपड़ों की साफ सुथरी तय बनाना और शेल्फ में लाइन से लगाना',
      'हैंगर में शर्ट, कोट और कुर्तियां सलीके से टांगना',
      'दराजों में मोजे, अंडरगार्मेंट्स और रुमाल व्यवस्थित करना',
      'अलमारी के खाली रैक को कपड़े से पोंछकर साफ करना'
    ],
    excludedTasks_hi: [
      'पूरे परिवार के कपड़ों की बल्क प्रेस/इस्त्री करना',
      'कपड़ों की सिलाई, बटन लगाना या रफू करना',
      'ग्राहक की अनुमति के बिना कोई भी कपड़ा फेंकना'
    ],
    materialsNote: 'Customer should be present to guide category preferences.',
    materialsNote_hi: 'कपड़ों की पसंद और व्यवस्था बताने के लिए ग्राहक की मौजूदगी बेहतर है।'
  },
  {
    id: 's-after-party',
    title: 'After-Party Express Clean',
    title_hi: 'पार्टी उपरांत सफाई',
    categorySlug: 'maid-helper',
    categoryId: 'cat-maid',
    subServiceName: 'Trash clearing and post-party dish wash',
    image: '/images/utensils_3d.jpg',
    startingPrice: 449,
    duration_mins: 50,
    tagline: 'Bottle clearing, dish washing and floor mop',
    filterGroup: 'cleaning',
    includedTasks: [
      'Clearing disposable plates, empty cans, bottles & snacks into trash bags',
      'Complete sink washing of all party glasses, bowls & serving dishes',
      'Cleaning food stains, gravy drips & sticky drink spills from tables & floor',
      'Disinfectant sweeping & double-mopping of living & dining halls',
      'Moving shifted dining chairs back to their standard layout'
    ],
    excludedTasks: [
      'Deep steam cleaning of sofas soaked with red wine or gravy stains',
      'Handling sharp broken glass without safe thick dustpan disposal',
      'Carrying heavy trash bags to far-away municipal garbage dumps outside'
    ],
    includedTasks_hi: [
      'पार्टी की खाली बोतलें, डिस्पोजल प्लेट्स और कचरा बैग में भरना',
      'पार्टी के सभी कांच के ग्लास, बर्तन और कटोरियां धोना',
      'टेबल और फर्श पर गिरे कोल्ड ड्रिंक व खाने के चिपचिपे दाग पोछना',
      'लिविंग और डाइनिंग हॉल में फिनाइल से दो बार पक्का पोछा लगाना',
      'इधर-उधर हुई कुर्सियों और फर्नीचर को वापस अपनी जगह लगाना'
    ],
    excludedTasks_hi: [
      'सोफे पर गिरे वाइन या तेल के गहरे दागों की स्टीम ड्राईक्लीनिंग',
      'टूटे कांच के टुकड़ों को बिना सुरक्षा के हाथ से उठाना',
      'सोसायटी के बाहर दूर कचरा फेंकने जाना'
    ],
    materialsNote: 'Customer provides sturdy garbage trash bags & dish soap.',
    materialsNote_hi: 'ग्राहक को मजबूत कचरा बैग और डिशवॉश साबुन देना होगा।'
  },
  {
    id: 's-washing-machine',
    title: 'Washing Machine Cleaning',
    title_hi: 'वाशिंग मशीन सफाई',
    categorySlug: 'electrician',
    categoryId: 'cat-electrician',
    subServiceName: 'Washing machine deep descale',
    image: '/images/washing_machine_3d.jpg',
    startingPrice: 399,
    duration_mins: 35,
    tagline: 'Drum descaling and filter clear',
    filterGroup: 'cleaning',
    includedTasks: [
      'Detergent dispenser drawer removal, soaking & crusty soap scum scrub',
      'Front-load rubber door seal (gasket) mold and black mildew cleaning',
      'Coin/lint filter unscrewing, water drainage & trapped debris removal',
      'Running tub clean descale cycle with anti-scaling chemical formula',
      'Exterior machine body, lid & control panel streak-free wipe-down'
    ],
    excludedTasks: [
      'Repairing burnt motors, drum ball bearings, or motor drive belts',
      'Electronic motherboard PCB chip repairs or error code diagnostics',
      'Breaking wall tiles for new water tap inlet plumbing'
    ],
    includedTasks_hi: [
      'डिटर्जेंट ट्रे को बाहर निकालकर जमी हुई पुरानी सर्फ की पपड़ी साफ करना',
      'फ्रंट लोड के रबर गास्केट में जमी काली फंगस और गंदगी को हटाना',
      'मशीन के लिंट फिल्टर से फंसे सिक्के, बाल व धागे निकालना',
      'ड्रम के अंदर खारा पानी साफ करने वाले केमिकल से टब क्लीन चलाना',
      'मशीन की बाहरी बॉडी, ढक्कन और बटन पैनल को साफ पोंछना'
    ],
    excludedTasks_hi: [
      'मशीन की मोटर, ड्रम की बेयरिंग या बेल्ट रिपेयर करना',
      'मशीन का कंप्यूटर मदरबोर्ड या एरर कोड ठीक करना',
      'दीवार तोड़कर नया पानी का नल या पाइप लगाना'
    ],
    materialsNote: 'Professional brings appliance-grade descaling powder.',
    materialsNote_hi: 'प्रोफेशनल अपने साथ टब डीस्केलिंग पाउडर लेकर आते हैं।'
  },
  {
    id: 's-balcony',
    title: 'Balcony Cleaning',
    title_hi: 'बालकनी की सफाई',
    categorySlug: 'maid-helper',
    categoryId: 'cat-maid',
    subServiceName: 'Balcony deep pressure scrub',
    image: '/images/balcony_cleaning_3d.jpg',
    startingPrice: 349,
    duration_mins: 30,
    tagline: 'Railing, glass, and floor jet scrub',
    filterGroup: 'cleaning',
    includedTasks: [
      'Balcony floor sweeping, soap scrubbing & water wash to remove grime',
      'Scraping dried pigeon droppings & moss from floor and ledge',
      'Railing wipe-down (metal/stainless steel grill and banisters)',
      'Interior side wiping of balcony sliding glass doors',
      'Clearing rainwater drainage pipe outlet so water flows freely'
    ],
    excludedTasks: [
      'Leaning out over railings at dangerous heights above 1st floor',
      'Installing pigeon bird-safety nets or balcony iron grill fabrication',
      'Waterproofing balcony floor cracks or civil concrete patching'
    ],
    includedTasks_hi: [
      'बालकनी के फर्श पर साबुन और पानी से ब्रश लगाकर मैल साफ करना',
      'कबूतरों की बीट और फर्श के कोनों में जमी काई खुरच कर निकालना',
      'बालकनी की रेलिंग, ग्रिल और छज्जे को पोंछकर साफ करना',
      'बालकनी के कांच वाले स्लाइडिंग दरवाजों को अंदर से चमकाना',
      'बारिश के पानी की नाली का छेद साफ करना ताकि पानी न भरे'
    ],
    excludedTasks_hi: [
      'ऊंची मंजिलों पर खतरनाक तरीके से बाहर लटककर काम करना',
      'कबूतरों की जाली लगाना या लोहे की वेल्डिंग करना',
      'बालकनी की सीलन ठीक करना या सीमेंट का काम'
    ],
    materialsNote: 'Customer provides water connection, bucket & scrub brush.',
    materialsNote_hi: 'ग्राहक को पानी का नल, बाल्टी और फर्श का ब्रश देना होगा।'
  },
  {
    id: 's-fan',
    title: 'Fan & Electrician',
    title_hi: 'पंखा व बिजली रिपेयर',
    categorySlug: 'electrician',
    categoryId: 'cat-electrician',
    subServiceName: 'Fan & household electrical repairs',
    image: '/images/fan_electrician_3d.jpg',
    startingPrice: 249,
    duration_mins: 30,
    tagline: 'Regulator, motor, and blade balance',
    filterGroup: 'repairs',
    includedTasks: [
      'Ceiling fan unmounting, blade cleaning, re-fixing & blade angle balancing',
      'Exhaust fan installation, grease wiping & wiring connection',
      'Wall regulator switch, fan capacitor, or modular switch replacement',
      'Light fixtures, LED tube lights, decorative ceiling lamps & bulb sockets',
      'Electric switchboard earthing, loose wire tightening & fuse check'
    ],
    excludedTasks: [
      'Concealed wall drilling/chiseling for new internal conduits without pipes',
      'Tampering with official high-voltage BESCOM/State Electricity Board meters',
      'Heavy 3-phase industrial motor rewinding (requires lathe workshop)',
      'Free replacement hardware (capacitor, fan blades, regulator to be paid by customer)'
    ],
    includedTasks_hi: [
      'सीलिंग फैन उतारना, पंखुड़ियों की सफाई, वापस लगाना और बैलेंस सही करना',
      'रसोई/बाथरूम का एग्जॉस्ट फैन लगाना और तार जोड़ना',
      'खराब रेगुलेटर, कैपेसिटर (कंडेंसर) या बिजली का स्विच बदलना',
      'एलईडी ट्यूबलाइट, होल्डर, फैंसी लाइट व झूमर की फिटिंग',
      'स्विचबोर्ड में ढीले तारों को कसना, अर्थिंग व फ्यूज चेक करना'
    ],
    excludedTasks_hi: [
      'बिना पाइप के दीवार में लंबी नाली काटना या भारी तोड़-फोड़',
      'बिजली विभाग के सरकारी मेन मीटर या सील को छेड़ना',
      'फैक्ट्री की 3-फेज भारी मोटर की रिवाइंडिंग (वर्कशॉप का काम)',
      'मुफ्त में नया सामान देना (कैपेसिटर, स्विच या तार ग्राहक को खरीदने होंगे)'
    ],
    materialsNote: 'Electrician brings voltage tester, wire stripper & screwdrivers. Spare parts cost extra.',
    materialsNote_hi: 'इलेक्ट्रीशियन टेस्टर, प्लास व पेचकस लाते हैं। नया सामान (कैपेसिटर/स्विच) अलग से लगेगा।'
  },
  {
    id: 's-plumbing-tap',
    title: 'Tap & Plumbing Fix',
    title_hi: 'नल व प्लम्बिंग रिपेयर',
    categorySlug: 'plumber',
    categoryId: 'cat-plumber',
    subServiceName: 'Tap repair & minor plumbing fix',
    image: '/images/plumbing_tap_3d.jpg',
    startingPrice: 299,
    duration_mins: 30,
    tagline: 'Dripping taps, washers, and valve replacement',
    filterGroup: 'repairs',
    includedTasks: [
      'Fixing dripping taps, replacing worn rubber washers, spindle or ceramic cartridge',
      'Installing new kitchen sink mixer, pillar cock, or wall tap',
      'Replacing leaking health faucets, jet sprays, flexible hose & angle valves',
      'Unclogging washbasin bottle traps & clearing hair/soap blockage',
      'Teflon tape sealing of threaded pipe joints to eliminate persistent water leaks'
    ],
    excludedTasks: [
      'Breaking concealed bathroom tiles to trace underground pipe bursts',
      'Main building sewage line excavation or septic tank emptying',
      'Overhead water tank heavy structural cleaning or motor rewinding',
      'Free replacement hardware (new taps, valves, flex pipes provided by customer)'
    ],
    includedTasks_hi: [
      'टपकते नल का वाशर, स्पिंडल या डिस्क बदलकर लीकेज बंद करना',
      'किचन सिंक में नया नल, मिक्सर या बाथरूम का नल लगाना',
      'लीक हो रहे हेल्थ फॉसेट (जेट स्प्रे), फ्लेक्सिबल पाइप और एंगल कॉक बदलना',
      'वॉशबेसिन के नीचे का बॉटल ट्रैप खोलकर कचरा व बाल निकालना',
      'चूड़ियों पर टेफ्लॉन टेप लगाकर टपकते जोड़ों को वाटरप्रूफ सील करना'
    ],
    excludedTasks_hi: [
      'दीवार के अंदर पाइप ढूंढने के लिए बाथरूम की टाइल्स तोड़ना',
      'सोसायटी की मुख्य सीवर लाइन की खुदाई या सेप्टिक टैंक खाली करना',
      'छत की बड़ी सिंटेक्स टंकी की सफाई या पानी की मोटर बदलना',
      'मुफ्त नया नल देना (नया नल, पाइप या वाल्व ग्राहक को देना होगा)'
    ],
    materialsNote: 'Plumber brings pipe wrench, Teflon tape & sealants. New hardware parts extra.',
    materialsNote_hi: 'प्लम्बर रिंच, टेफ्लॉन टेप व पाना लाते हैं। नया नल या पाइप का खर्च अलग रहेगा।'
  }
];

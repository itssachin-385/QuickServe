// QuickServe Dual-Language Translation Dictionary (English & हिंदी)

export type Language = 'en' | 'hi';

export const translations = {
  en: {
    // Header & Navigation
    tagline: 'Home services, made simple',
    subtitle: 'Transparent prices. 100% Aadhaar verified local professionals at your doorstep.',
    searchPlaceholder: 'What service do you need? (e.g. tap leak, fan, maid)',
    allServices: 'All Services',
    myOrders: 'My Orders',
    profile: 'Profile',
    partnerPortal: 'Partner Portal',
    bookNow: 'Book Now',
    startsAt: 'Starts at',
    estimatedTime: 'Estimated time',
    noAdvance: 'Zero Advance Required',
    freeCancellation: 'Free Cancellation Anytime',
    payAfterWork: 'Pay after service with Cash or UPI',
    quickServeGuarantee: 'QuickServe Customer Guarantee',
    
    // Categories
    cat_all: 'All Services',
    cat_maid: 'Cleaning & Maid',
    cat_plumber: 'Plumber',
    cat_electrician: 'Electrician',
    cat_ac: 'AC & Appliances',
    cat_cook: 'Cook / Food',
    cat_packers: 'Moving Help',

    // Statuses
    status_requested: 'Booking Requested',
    status_confirmed: 'Confirmed',
    status_partner_assigned: 'Partner Assigned',
    status_in_progress: 'Service In Progress',
    status_completed: 'Completed',
    status_cancelled: 'Cancelled',

    // Orders & Actions
    activeBookings: 'Active & Recent Bookings',
    noOrdersYet: 'No service bookings yet',
    noOrdersSub: 'Book a certified local professional in seconds.',
    doorstepOtp: 'Doorstep Start OTP',
    otpInstruction: 'Share with professional upon arrival',
    callPartner: 'Call Partner',
    chatWhatsApp: 'WhatsApp Chat',
    cancelOrder: 'Cancel Order',
    downloadBill: 'Download Bill / Invoice',
    rateService: 'Rate Service',
    ratedThanks: 'Service Rated',
    orderProgress: 'Order Progress',

    // Reviews & Bill
    rateTitle: 'How was your service experience?',
    rateSubtitle: 'Your rating helps maintain high quality standards.',
    submitReview: 'Submit Review',
    invoiceTitle: 'Tax Invoice / Service Receipt',
    printInvoice: 'Print / Save PDF',
    close: 'Close',
    supportWhatsApp: 'WhatsApp Helpline'
  },
  hi: {
    // Header & Navigation
    tagline: 'घरेलू सेवाएं, अब बेहद आसान',
    subtitle: 'पारदर्शी कीमतें। 100% आधार सत्यापित कारीगर सीधे आपके घर पर।',
    searchPlaceholder: 'आपको किस सेवा की आवश्यकता है? (नल, पंखा, सफाई, एसी)',
    allServices: 'सभी सेवाएं',
    myOrders: 'मेरे ऑर्डर्स',
    profile: 'प्रोफ़ाइल',
    partnerPortal: 'पार्टनर पोर्टल',
    bookNow: 'अभी बुक करें',
    startsAt: 'शुरुआती कीमत',
    estimatedTime: 'अनुमानित समय',
    noAdvance: 'ज़ीरो एडवांस (कोई पेशगी नहीं)',
    freeCancellation: 'किसी भी समय मुफ़्त रद्दीकरण',
    payAfterWork: 'काम पूरा होने के बाद नकद या UPI से भुगतान',
    quickServeGuarantee: 'क्विकसर्व ग्राहक सुरक्षा गारंटी',

    // Categories
    cat_all: 'सभी सेवाएं',
    cat_maid: 'सफाई व मेड',
    cat_plumber: 'प्लंबर (नल व पाइप)',
    cat_electrician: 'इलेक्ट्रीशियन (बिजली)',
    cat_ac: 'एसी व उपकरण',
    cat_cook: 'रसोइया / कुक',
    cat_packers: 'शिफ्टिंग व ट्रांसपोर्ट',

    // Statuses
    status_requested: 'बुकिंग दर्ज हुई',
    status_confirmed: 'कन्फर्म हो गई',
    status_partner_assigned: 'पार्टनर असाइन हुआ',
    status_in_progress: 'काम चालू है',
    status_completed: 'सफलतापूर्वक पूरा हुआ',
    status_cancelled: 'रद्द किया गया',

    // Orders & Actions
    activeBookings: 'सक्रिय एवं हालिया ऑर्डर्स',
    noOrdersYet: 'अभी तक कोई बुकिंग नहीं है',
    noOrdersSub: 'सिर्फ कुछ सेकंड में किसी भी घरेलू कारीगर को घर बुलाएं।',
    doorstepOtp: 'डोरस्टेप स्टार्ट OTP',
    otpInstruction: 'कारीगर के घर पहुंचने पर ही यह कोड बताएं',
    callPartner: 'फ़ोन करें',
    chatWhatsApp: 'व्हाट्सएप चैट',
    cancelOrder: 'ऑर्डर रद्द करें',
    downloadBill: 'बिल / रसीद डाउनलोड करें',
    rateService: 'रेटिंग दें',
    ratedThanks: 'रेटिंग दर्ज हो गई',
    orderProgress: 'ऑर्डर प्रगति',

    // Reviews & Bill
    rateTitle: 'सेवा का अनुभव कैसा रहा?',
    rateSubtitle: 'आपकी रेटिंग से कारीगर की गुणवत्ता बनी रहती है।',
    submitReview: 'रेटिंग सबमिट करें',
    invoiceTitle: 'सेवा बिल व रसीद (Tax Invoice)',
    printInvoice: 'प्रिंट / PDF सेव करें',
    close: 'बंद करें',
    supportWhatsApp: 'व्हाट्सएप हेल्पलाइन'
  }
};

import React, { useState, useEffect } from 'react';
import { Home, Info, Book, Phone, Menu, X, ChevronRight, Calendar, Users, Briefcase, GraduationCap, PlusCircle, Trash2, Edit, LogIn, LogOut, Settings, MoreVertical, Image, Sun, Moon, Globe, Bell } from 'lucide-react'; // Added Bell icon

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where } from 'firebase/firestore'; 

// Admin Credentials (hardcoded for simple login, NOT SECURE for production)
const ADMIN_EMAIL = 'mubc1969@saif.com'; // Hardcoded admin email
const ADMIN_PASSWORD = 'mubcsaif@143'; // Hardcoded admin password

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [teachers, setTeachers] = useState([]); 
  const [notices, setNotices] = useState([]); 
  const [galleryImages, setGalleryImages] = useState([]); 
  const [heroSlides, setHeroSlides] = useState([]); // New state for hero slideshow images
  const [notifications, setNotifications] = useState([]); // New state for notifications
  const [websiteSettings, setWebsiteSettings] = useState({ // New state for website settings
    mapEmbedUrl: '',
    aboutHistory: '',
    aboutMission: '',
    aboutVision: ''
  });
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editingNotice, setEditingNotice] = useState(null);
  const [editingGalleryImage, setEditingGalleryImage] = useState(null); // New state for editing gallery images
  const [editingHeroSlide, setEditingHeroSlide] = useState(null); // New state for editing hero slides
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showDesktopAdminMenu, setShowDesktopAdminMenu] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [loading, setLoading] = useState(true); 
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0); // For slideshow
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'
  const [language, setLanguage] = useState('bn'); // 'bn' for Bengali, 'en' for English

  // Firebase states
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [appId, setAppId] = useState(null); 
  const [currentFirebaseUserId, setCurrentFirebaseUserId] = useState(null); 
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Initialize Firebase and set up auth listener
  useEffect(() => {
    try {
      const currentAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      setAppId(currentAppId); 
      const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const firebaseAuth = getAuth(app);

      setDb(firestore);
      setAuth(firebaseAuth);

      const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setCurrentFirebaseUserId(user.uid); 
        } else {
          try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
              await signInWithCustomToken(firebaseAuth, __initial_auth_token);
            } else {
              await signInAnonymously(firebaseAuth);
            }
            setCurrentFirebaseUserId(firebaseAuth.currentUser?.uid); 
          } catch (error) {
            console.error("Error during initial sign-in:", error);
            setCurrentFirebaseUserId(crypto.randomUUID()); 
          }
        }
        setIsAuthReady(true);
        setLoading(false);
      });

      return () => unsubscribeAuth(); 
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      setLoading(false);
    }
  }, []);

  // Fetch data from Firestore once auth is ready and db is available
  useEffect(() => {
    if (db && appId && isAuthReady && currentFirebaseUserId) { 
      // Teachers data
      const teachersQuery = query(collection(db, `artifacts/${appId}/public/data/teachers`));
      const unsubscribeTeachers = onSnapshot(teachersQuery, (snapshot) => {
        const fetchedTeachers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeachers(fetchedTeachers);
      }, (error) => {
        console.error("Error fetching teachers:", error);
      });

      // Notices data
      const noticesQuery = query(collection(db, `artifacts/${appId}/public/data/notices`));
      const unsubscribeNotices = onSnapshot(noticesQuery, (snapshot) => {
        const fetchedNotices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().date ? doc.data().date.toDate() : new Date() }));
        setNotices(fetchedNotices.sort((a, b) => b.date - a.date)); 
      }, (error) => {
        console.error("Error fetching notices:", error);
      });

      // Gallery Images data
      const galleryQuery = query(collection(db, `artifacts/${appId}/public/data/gallery`));
      const unsubscribeGallery = onSnapshot(galleryQuery, (snapshot) => {
        const fetchedImages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGalleryImages(fetchedImages);
      }, (error) => {
        console.error("Error fetching gallery images:", error);
      });

      // Hero Slides data
      const heroSlidesQuery = query(collection(db, `artifacts/${appId}/public/data/heroSlides`));
      const unsubscribeHeroSlides = onSnapshot(heroSlidesQuery, (snapshot) => {
        const fetchedSlides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHeroSlides(fetchedSlides);
      }, (error) => {
        console.error("Error fetching hero slides:", error);
      });

      // Notifications data
      const notificationsQuery = query(collection(db, `artifacts/${appId}/public/data/notifications`));
      const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
        const fetchedNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp ? doc.data().timestamp.toDate() : new Date() }));
        setNotifications(fetchedNotifications.sort((a, b) => b.timestamp - a.timestamp)); // Sort by newest first
      }, (error) => {
        console.error("Error fetching notifications:", error);
      });

      // Website Settings data
      const websiteSettingsDocRef = doc(db, `artifacts/${appId}/public/data/websiteSettings`, 'generalInfo');
      const unsubscribeWebsiteSettings = onSnapshot(websiteSettingsDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setWebsiteSettings(docSnap.data());
        } else {
          console.log("No website settings found. Using defaults.");
          // Optionally set default values if doc doesn't exist
          setWebsiteSettings({
            mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.080517924719!2d90.3546736746979!3d23.82137688469399!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c0c915f7a297%3A0x6a0f4a7c8c3c1e2e!2sMonipur%20High%20School%20and%20College!5e0!3m2!1sen!2sbd!4v1678901234567!5m2=1sen!2sbd",
            aboutHistory: "Monipur Uccha Bidyalaya & College (MUBC) was established in 1969 by the late Hazi Noor Mohammad with a vision to provide quality education in Mirpur, Dhaka. Starting as a small primary school, it gradually expanded to include secondary and higher secondary levels, becoming one of the most renowned educational institutions in Bangladesh. Over the decades, MUBC has consistently achieved outstanding results in various public examinations, including PSC, JSC, SSC, and HSC, earning a reputation for academic excellence and holistic student development. We are committed to fostering a conducive learning environment that nurtures intellectual, moral, and social growth.",
            aboutMission: "Our mission is to empower students with knowledge, skills, and values to become responsible citizens and future leaders. We strive to provide a comprehensive education that encourages critical thinking, creativity, and a lifelong love for learning.",
            aboutVision: "To be a leading educational institution in Bangladesh, recognized for academic distinction, innovative teaching methodologies, and a commitment to producing well-rounded individuals who contribute positively to society."
          });
        }
      }, (error) => {
        console.error("Error fetching website settings:", error);
      });


      return () => {
        unsubscribeTeachers();
        unsubscribeNotices();
        unsubscribeGallery();
        unsubscribeHeroSlides(); // Cleanup hero slides subscription
        unsubscribeNotifications(); // Cleanup notifications subscription
        unsubscribeWebsiteSettings(); // Cleanup website settings subscription
      };
    }
  }, [db, appId, isAuthReady, currentFirebaseUserId]);

  // Slideshow logic
  useEffect(() => {
    if (heroSlides.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlideIndex((prevIndex) => 
          (prevIndex + 1) % heroSlides.length
        );
      }, 2800); // 2.8 seconds
      return () => clearInterval(interval);
    }
  }, [heroSlides]);

  // Language content
  const content = {
    en: {
      schoolName: "Monipur Uccha Bidyalaya & College",
      tagline: "Excellence in Education, Shaping Futures",
      home: {
        heroTitle: "Welcome to Monipur Uccha Bidyalaya & College",
        heroSubtitle: "A Legacy of Learning and Achievement since 1969.",
        learnMore: "Learn More",
        whyChooseUs: "Why Choose Us?",
        qualityEducation: "Quality Education",
        qualityEducationDesc: "Providing top-tier education from Class 1 to 12.",
        experiencedFaculty: "Experienced Faculty",
        experiencedFacultyDesc: "Dedicated and highly qualified teachers.",
        holisticDevelopment: "Holistic Development",
        holisticDevelopmentDesc: "Focus on academic, moral, and co-curricular growth.",
        ourTeachers: "Our Teachers",
        viewAllTeachers: "View All Teachers",
        ourGallery: "Our Gallery",
        viewFullGallery: "View Full Gallery",
        latestNewsNotices: "Latest News & Notices",
        viewAllNotices: "View All Notices",
        readMore: "Read More",
      },
      about: {
        title: "About Monipur Uccha Bidyalaya & College",
        // Use websiteSettings for about content, with fallback to hardcoded English defaults
        history: websiteSettings.aboutHistory || "Monipur Uccha Bidyalaya & College (MUBC) was established in 1969 by the late Hazi Noor Mohammad with a vision to provide quality education in Mirpur, Dhaka. Starting as a small primary school, it gradually expanded to include secondary and higher secondary levels, becoming one of the most renowned educational institutions in Bangladesh. Over the decades, MUBC has consistently achieved outstanding results in various public examinations, including PSC, JSC, SSC, and HSC, earning a reputation for academic excellence and holistic student development. We are committed to fostering a conducive learning environment that nurtures intellectual, moral, and social growth.",
        mission: websiteSettings.aboutMission || "Our mission is to empower students with knowledge, skills, and values to become responsible citizens and future leaders. We strive to provide a comprehensive education that encourages critical thinking, creativity, and a lifelong love for learning.",
        vision: websiteSettings.aboutVision || "To be a leading educational institution in Bangladesh, recognized for academic distinction, innovative teaching methodologies, and a commitment to producing well-rounded individuals who contribute positively to society."
      },
      academics: {
        title: "Academic Information",
        sections: [
          {
            name: "Classes Offered",
            description: "We offer education from Class I to Class XII in both Bengali and English mediums.",
            details: [
              "Class I - Class V (Primary Section)",
              "Class VI - Class X (Secondary Section)",
              "Class XI - Class XII (College Section - Science, Business Studies, Humanities)"
            ]
          },
          {
            name: "Curriculum",
            description: "Our curriculum is aligned with the National Curriculum and Textbook Board (NCTB) guidelines, focusing on a balanced approach to theoretical knowledge and practical application.",
            details: [
              "Comprehensive syllabus for all subjects.",
              "Regular assessments and examinations.",
              "Emphasis on concept clarity and problem-solving skills."
            ]
          },
          {
            name: "Examination & Results",
            description: "We conduct regular internal examinations and prepare students thoroughly for public examinations.",
            details: [
              "Mid-term and Annual examinations.",
              "Model tests for public exams (PSC, JSC, SSC, HSC).",
              "Online result publication through student portal."
            ]
          }
        ]
      },
      contact: {
        title: "Contact Us",
        address: "Monipur, Mirpur-2, Dhaka-1216, Bangladesh",
        phone: "+88 017XXXXXXX", 
        email: "info@mubc.edu.bd", 
        mapEmbed: websiteSettings.mapEmbedUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.080517924719!2d90.3546736746979!3d23.82137688469399!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c0c915f7a297%3A0x6a0f4a7c8c3c1e2e!2sMonipur%20High%20School%20and%20College!5e0!3m2!1sen!2sbd!4v1678901234567!5m2=1sen!2sbd"
      },
      nav: {
        home: "Home",
        aboutUs: "About Us",
        academics: "Academics",
        teachers: "Teachers", 
        contactUs: "Contact Us", 
        notices: "Notices", 
        gallery: "Gallery", 
        notifications: "Notifications", // Added translation
        admin: "Admin",
        more: "More",
        logout: "Logout",
        login: "Login",
        adminPanel: "Admin Panel"
      },
      admin: {
        loginTitle: "Admin Login",
        email: "Email",
        password: "Password",
        loginBtn: "Login",
        cancelBtn: "Cancel",
        loginFailed: "Login failed. Incorrect email or password.",
        loginSuccess: "Successfully logged in!",
        accessDenied: "You do not have admin access.",
        dbNotReady: "Database not ready or user not logged in.",
        dataNotPersistent: "Important: This data is stored under your app's public data in Firestore database.",
        manageTeachers: "Manage Teachers",
        teacherName: "Name",
        teacherDesignation: "Designation",
        teacherSubject: "Subject",
        teacherImageUrl: "Image URL",
        teacherBio: "Short Biography",
        addTeacher: "Add New Teacher",
        updateTeacher: "Update Teacher",
        cancelEdit: "Cancel Edit",
        currentTeachers: "Current Teachers",
        actions: "Actions",
        confirmDeleteTeacher: "Are you sure you want to delete this teacher?",
        teacherAdded: "Teacher added successfully!",
        teacherUpdated: "Teacher updated successfully!",
        teacherDeleteFailed: "Failed to delete teacher.",
        manageNotices: "Manage Notices",
        noticeTitle: "Title",
        noticeContent: "Content",
        noticeImageUrl: "Image URL (Optional)", // Added
        addNotice: "Add New Notice",
        updateNotice: "Update Notice",
        currentNotices: "Current Notices",
        date: "Date",
        noticeAdded: "Notice added successfully!",
        noticeUpdated: "Notice updated successfully!",
        noticeDeleteFailed: "Failed to delete notice.",
        manageGallery: "Manage Gallery",
        galleryImageUrl: "Image URL",
        galleryImageAlt: "Alt Text",
        addGalleryImage: "Add New Gallery Image",
        updateGalleryImage: "Update Gallery Image", // Added
        currentGalleryImages: "Current Gallery Images",
        confirmDeleteGalleryImage: "Are you sure you want to delete this gallery image?",
        galleryImageAdded: "Gallery image added successfully!",
        galleryImageUpdated: "Gallery image updated successfully!", // Added
        galleryImageDeleteFailed: "Failed to delete gallery image.",
        manageHeroSlides: "Manage Hero Slideshow Images",
        heroSlideImageUrl: "Slide Image URL",
        heroSlideCaption: "Caption (Optional)",
        addHeroSlide: "Add New Slide Image",
        updateHeroSlide: "Update Slide Image",
        currentHeroSlides: "Current Slideshow Images",
        confirmDeleteHeroSlide: "Are you sure you want to delete this slideshow image?",
        heroSlideAdded: "Slide image added successfully!",
        heroSlideUpdated: "Slide image updated successfully!",
        heroSlideDeleteFailed: "Failed to delete slide image.",
        manageNotifications: "Manage Notifications", // Added
        notificationThumbnail: "Thumbnail URL", // Added
        notificationHeading: "Heading", // Added
        notificationDetails: "Details", // Added
        sendNotification: "Send Notification", // Added
        notificationSent: "Notification sent successfully!", // Added
        notificationFailed: "Failed to send notification.", // Added
        currentNotifications: "Current Notifications", // Added
        confirmDeleteNotification: "Are you sure you want to delete this notification?", // Added
        notificationDeleteFailed: "Failed to delete notification.", // Added
        uploadImage: "Upload Image from Device", // Added
        or: "OR", // Added
        manageWebsiteSettings: "Manage Website Settings", // New
        mapEmbedUrl: "Map Embed URL", // New
        aboutHistory: "About History", // New
        aboutMission: "About Mission", // New
        aboutVision: "About Vision", // New
        websiteSettingsUpdated: "Website settings updated successfully!", // New
        websiteSettingsUpdateFailed: "Failed to update website settings.", // New
      },
      confirm: {
        logout: "Are you sure you want to log out?",
        yes: "Yes",
        no: "No"
      },
      noData: {
        teachers: "No teacher information found.",
        notices: "No notices found.",
        gallery: "No images found.",
        slides: "No slideshow images found.",
        notifications: "No notifications found." // Added
      },
      loading: "Loading data, please wait...",
      footer: {
        rightsReserved: "All rights reserved.",
        privacyPolicy: "Privacy Policy",
        termsOfService: "Terms of Service"
      }
    },
    bn: {
      schoolName: "মনিপুর উচ্চ বিদ্যালয় ও কলেজ",
      tagline: "শিক্ষার উৎকর্ষ, ভবিষ্যতের রূপদান",
      home: {
        heroTitle: "মনিপুর উচ্চ বিদ্যালয় ও কলেজে স্বাগতম",
        heroSubtitle: "১৯৬৯ সাল থেকে শিক্ষা ও অর্জনের এক ঐতিহ্য।",
        learnMore: "আরও জানুন",
        whyChooseUs: "কেন আমাদের বেছে নেবেন?",
        qualityEducation: "গুণগত শিক্ষা",
        qualityEducationDesc: "১ম থেকে ১২শ শ্রেণি পর্যন্ত উচ্চমানের শিক্ষা প্রদান।",
        experiencedFaculty: "অভিজ্ঞ শিক্ষকবৃন্দ",
        experiencedFacultyDesc: "নিবেদিত এবং উচ্চ যোগ্যতাসম্পন্ন শিক্ষক।",
        holisticDevelopment: "সার্বিক বিকাশ",
        holisticDevelopmentDesc: "একাডেমিক, নৈতিক এবং সহ-পাঠ্যক্রমিক বিকাশে মনোযোগ।",
        ourTeachers: "আমাদের শিক্ষকবৃন্দ",
        viewAllTeachers: "সকল শিক্ষক দেখুন",
        ourGallery: "আমাদের গ্যালারি",
        viewFullGallery: "সম্পূর্ণ গ্যালারি দেখুন",
        latestNewsNotices: "সর্বশেষ খবর ও নোটিশ",
        viewAllNotices: "সকল নোটিশ দেখুন",
        readMore: "আরও পড়ুন",
      },
      about: {
        title: "মনিপুর উচ্চ বিদ্যালয় ও কলেজ সম্পর্কে",
        // Use websiteSettings for about content, with fallback to hardcoded Bengali defaults
        history: websiteSettings.aboutHistory || "মনিপুর উচ্চ বিদ্যালয় ও কলেজ (MUBC) প্রতিষ্ঠাতা মরহুম হাজী নূর মোহাম্মদ কর্তৃক ১৯৬৯ সালে প্রতিষ্ঠিত হয়, যার লক্ষ্য ছিল ঢাকার মিরপুরে মানসম্মত শিক্ষা প্রদান করা। একটি ছোট প্রাথমিক বিদ্যালয় হিসেবে শুরু হয়ে এটি ধীরে ধীরে মাধ্যমিক ও উচ্চ মাধ্যমিক স্তর অন্তর্ভুক্ত করে, বাংলাদেশের অন্যতম স্বনামধন্য শিক্ষা প্রতিষ্ঠানে পরিণত হয়। কয়েক দশক ধরে, MUBC ধারাবাহিকভাবে PSC, JSC, SSC, এবং HSC সহ বিভিন্ন পাবলিক পরীক্ষায় অসামান্য ফলাফল অর্জন করেছে, যা একাডেমিক শ্রেষ্ঠত্ব এবং শিক্ষার্থীদের সার্বিক বিকাশের জন্য খ্যাতি অর্জন করেছে। আমরা একটি অনুকূল শিক্ষার পরিবেশ গড়ে তুলতে প্রতিশ্রুতিবদ্ধ যা বুদ্ধিবৃত্তিক, নৈতিক এবং সামাজিক বিকাশকে উৎসাহিত করে।",
        mission: websiteSettings.aboutMission || "আমাদের লক্ষ্য হল শিক্ষার্থীদের জ্ঞান, দক্ষতা এবং মূল্যবোধ দিয়ে ক্ষমতায়ন করা যাতে তারা দায়িত্বশীল নাগরিক এবং ভবিষ্যতের নেতা হতে পারে। আমরা একটি ব্যাপক শিক্ষা প্রদানের চেষ্টা করি যা সমালোচনামূলক চিন্তাভাবনা, সৃজনশীলতা এবং শেখার প্রতি আজীবন ভালোবাসাকে উৎসাহিত করে।",
        vision: websiteSettings.aboutVision || "বাংলাদেশের একটি শীর্ষস্থানীয় শিক্ষা প্রতিষ্ঠান হওয়া, যা একাডেমিক শ্রেষ্ঠত্ব, উদ্ভাবনী শিক্ষাদান পদ্ধতি এবং সমাজে ইতিবাচক অবদান রাখে এমন সুশিক্ষিত ব্যক্তি তৈরির প্রতিশ্রুতির জন্য স্বীকৃত।"
      },
      academics: {
        title: "একাডেমিক তথ্য",
        sections: [
          {
            name: "শ্রেণি সমূহ",
            description: "আমরা ১ম থেকে ১২শ শ্রেণি পর্যন্ত বাংলা ও ইংরেজি উভয় মাধ্যমে শিক্ষা প্রদান করি।",
            details: [
              "১ম - ৫ম শ্রেণি (প্রাথমিক শাখা)",
              "৬ষ্ঠ - ১০ম শ্রেণি (মাধ্যমিক শাখা)",
              "১১শ - ১২শ শ্রেণি (কলেজ শাখা - বিজ্ঞান, ব্যবসায় শিক্ষা, মানবিক)"
            ]
          },
          {
            name: "Curriculum",
            description: "Our curriculum is aligned with the National Curriculum and Textbook Board (NCTB) guidelines, focusing on a balanced approach to theoretical knowledge and practical application.",
            details: [
              "Comprehensive syllabus for all subjects.",
              "Regular assessments and examinations.",
              "Emphasis on concept clarity and problem-solving skills."
            ]
          },
          {
            name: "Examination & Results",
            description: "We conduct regular internal examinations and prepare students thoroughly for public examinations.",
            details: [
              "Mid-term and Annual examinations.",
              "Model tests for public exams (PSC, JSC, SSC, HSC).",
              "Online result publication through student portal."
            ]
          }
        ]
      },
      contact: {
        title: "যোগাযোগ করুন",
        address: "মনিপুর, মিরপুর-২, ঢাকা-১২১৬, বাংলাদেশ",
        phone: "+৮৮ ০১৭XXXXXXX", 
        email: "info@mubc.edu.bd", 
        mapEmbed: websiteSettings.mapEmbedUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.080517924719!2d90.3546736746979!3d23.82137688469399!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c0c915f7a297%3A0x6a0f4a7c8c3c1e2e!2sMonipur%20High%20School%20and%20College!5e0!3m2!1sen!2sbd!4v1678901234567!5m2=1sen!2sbd"
      },
      nav: {
        home: "হোম",
        aboutUs: "আমাদের সম্পর্কে",
        academics: "একাডেমিক",
        teachers: "শিক্ষকবৃন্দ", 
        contactUs: "যোগাযোগ", 
        notices: "নোটিশ", 
        gallery: "গ্যালারি", 
        notifications: "নোটিফিকেশন", // Added translation
        admin: "অ্যাডমিন",
        more: "আরও",
        logout: "লগআউট",
        login: "লগইন",
        adminPanel: "অ্যাডমিন প্যানেল"
      },
      admin: {
        loginTitle: "অ্যাডমিন লগইন",
        email: "ইমেল",
        password: "পাসওয়ার্ড",
        loginBtn: "লগইন",
        cancelBtn: "বাতিল করুন",
        loginFailed: "লগইন ব্যর্থ হয়েছে। ভুল ইমেল বা পাসওয়ার্ড।",
        loginSuccess: "সফলভাবে লগইন করা হয়েছে!",
        accessDenied: "আপনার অ্যাডমিন অ্যাক্সেস নেই।",
        dbNotReady: "ডেটাবেস প্রস্তুত নয়।",
        dataNotPersistent: "গুরুত্বপূর্ণ: এই ডেটা Firestore ডেটাবেসে আপনার অ্যাপের পাবলিক ডাটার অধীনে সংরক্ষিত হয়।",
        manageTeachers: "শিক্ষক পরিচালনা করুন",
        teacherName: "নাম",
        teacherDesignation: "পদবি",
        teacherSubject: "বিষয়",
        teacherImageUrl: "ছবির URL",
        teacherBio: "সংক্ষিপ্ত পরিচিতি",
        addTeacher: "নতুন শিক্ষক যোগ করুন",
        updateTeacher: "শিক্ষক আপডেট করুন",
        cancelEdit: "বাতিল করুন",
        currentTeachers: "বর্তমান শিক্ষকবৃন্দ",
        actions: "কার্যক্রম",
        confirmDeleteTeacher: "আপনি কি এই শিক্ষককে মুছে ফেলতে নিশ্চিত?",
        teacherAdded: "শিক্ষক সফলভাবে যোগ করা হয়েছে!",
        teacherUpdated: "শিক্ষক সফলভাবে আপডেট করা হয়েছে!",
        teacherDeleteFailed: "শিক্ষক মুছে ফেলতে ব্যর্থ।",
        manageNotices: "নোটিশ পরিচালনা করুন",
        noticeTitle: "শিরোনাম",
        noticeContent: "বিষয়বস্তু",
        noticeImageUrl: "ছবির URL (ঐচ্ছিক)", // Added
        addNotice: "নতুন নোটিশ যোগ করুন",
        updateNotice: "নোটিশ আপডেট করুন",
        currentNotices: "বর্তমান নোটিশসমূহ",
        date: "তারিখ",
        noticeAdded: "নোটিশ সফলভাবে যোগ করা হয়েছে!",
        noticeUpdated: "নোটিশ সফলভাবে আপডেট করা হয়েছে!",
        noticeDeleteFailed: "নোটিশ মুছে ফেলতে ব্যর্থ।",
        manageGallery: "গ্যালারি পরিচালনা করুন",
        galleryImageUrl: "ছবির URL",
        galleryImageAlt: "বিকল্প টেক্সট (Alt Text)",
        addGalleryImage: "নতুন গ্যালারি ইমেজ যোগ করুন",
        updateGalleryImage: "গ্যালারি ইমেজ আপডেট করুন", // Added
        currentGalleryImages: "বর্তমান গ্যালারি ইমেজসমূহ",
        confirmDeleteGalleryImage: "আপনি কি এই গ্যালারি ইমেজটি মুছে ফেলতে নিশ্চিত?",
        galleryImageAdded: "গ্যালারি ইমেজ সফলভাবে যোগ করা হয়েছে!",
        galleryImageUpdated: "গ্যালারি ইমেজ সফলভাবে আপডেট করা হয়েছে!", // Added
        galleryImageDeleteFailed: "গ্যালারি ইমেজ মুছে ফেলতে ব্যর্থ।",
        manageHeroSlides: "হিরো স্লাইডশো ইমেজ পরিচালনা করুন",
        heroSlideImageUrl: "স্লাইড ছবির URL",
        heroSlideCaption: "ক্যাপশন (ঐচ্ছিক)",
        addHeroSlide: "নতুন স্লাইড ইমেজ যোগ করুন",
        updateHeroSlide: "স্লাইড ইমেজ আপডেট করুন",
        currentHeroSlides: "বর্তমান স্লাইডশো ইমেজসমূহ",
        confirmDeleteHeroSlide: "আপনি কি এই স্লাইডশো ইমেজটি মুছে ফেলতে নিশ্চিত?",
        heroSlideAdded: "স্লাইড ইমেজ সফলভাবে যোগ করা হয়েছে!",
        heroSlideUpdated: "স্লাইড ইমেজ সফলভাবে আপডেট করা হয়েছে!",
        heroSlideDeleteFailed: "Failed to delete slide image.",
        manageNotifications: "নোটিফিকেশন পরিচালনা করুন", // Added
        notificationThumbnail: "থাম্বনেইল URL", // Added
        notificationHeading: "শিরোনাম", // Added
        notificationDetails: "বিস্তারিত", // Added
        sendNotification: "নোটিফিকেশন পাঠান", // Added
        notificationSent: "নোটিফিকেশন সফলভাবে পাঠানো হয়েছে!", // Added
        notificationFailed: "নোটিফিকেশন পাঠাতে ব্যর্থ হয়েছে।", // Added
        currentNotifications: "বর্তমান নোটিফিকেশনসমূহ", // Added
        confirmDeleteNotification: "আপনি কি এই নোটিফিকেশনটি মুছে ফেলতে নিশ্চিত?", // Added
        notificationDeleteFailed: "নোটিফিকেশন মুছে ফেলতে ব্যর্থ হয়েছে।", // Added
        uploadImage: "ডিভাইস থেকে ছবি আপলোড করুন", // Added
        or: "অথবা", // Added
        manageWebsiteSettings: "ওয়েবসাইট সেটিংস পরিচালনা করুন", // New
        mapEmbedUrl: "মানচিত্র এম্বেড URL", // New
        aboutHistory: "ইতিহাস", // New
        aboutMission: "মিশন", // New
        aboutVision: "দৃষ্টিভঙ্গি", // New
        websiteSettingsUpdated: "ওয়েবসাইট সেটিংস সফলভাবে আপডেট করা হয়েছে!", // New
        websiteSettingsUpdateFailed: "ওয়েবসাইট সেটিংস আপডেট করতে ব্যর্থ হয়েছে।", // New
      },
      confirm: {
        logout: "আপনি কি লগআউট করতে নিশ্চিত?",
        yes: "হ্যাঁ",
        no: "না"
      },
      noData: {
        teachers: "কোন শিক্ষক তথ্য পাওয়া যায়নি।",
        notices: "কোনো নোটিশ পাওয়া যায়নি।",
        gallery: "কোনো ছবি পাওয়া যায়নি।",
        slides: "কোনো স্লাইডশো ছবি পাওয়া যায়নি।",
        notifications: "কোনো নোটিফিকেশন পাওয়া যায়নি।" // Added
      },
      loading: "ডেটা লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...",
      footer: {
        rightsReserved: "সর্বস্বত্ব সংরক্ষিত।",
        privacyPolicy: "গোপনীয়তা নীতি",
        termsOfService: "পরিষেবার শর্তাবলী"
      }
    }
  };

  const t = content[language]; // 't' for translation helper

  // Data for the website sections (static content)
  const websiteData = {
    schoolName: t.schoolName,
    tagline: t.tagline,
    logoUrl: "https://www.moumachi.com.bd/images/listings/38962/profile/20232-monipur-high-school-college-logo.jpg",
    // thumbnailUrl will now be dynamically picked from heroSlides
    home: {
      heroTitle: t.home.heroTitle,
      heroSubtitle: t.home.heroSubtitle,
      features: [
        { icon: <GraduationCap size={24} />, title: t.home.qualityEducation, description: t.home.qualityEducationDesc },
        { icon: <Users size={24} />, title: t.home.experiencedFaculty, description: t.home.experiencedFacultyDesc },
        { icon: <Briefcase size={24} />, title: t.home.holisticDevelopment, description: t.home.holisticDevelopmentDesc },
      ],
    },
    about: {
      title: t.about.title,
      history: t.about.history,
      mission: t.about.mission,
      vision: t.about.vision
    },
    academics: {
      title: t.academics.title,
      sections: [
        {
          name: t.academics.sections[0].name,
          description: t.academics.sections[0].description,
          details: t.academics.sections[0].details
        },
        {
          name: t.academics.sections[1].name,
          description: t.academics.sections[1].description,
          details: t.academics.sections[1].details
        },
        {
          name: t.academics.sections[2].name,
          description: t.academics.sections[2].description,
          details: t.academics.sections[2].details
        }
      ]
    },
    contact: {
      title: t.contact.title,
      address: t.contact.address,
      phone: t.contact.phone, 
      email: t.contact.email, 
      mapEmbed: t.contact.mapEmbed // Now dynamically fetched
    }
  };

  // Navigation items
  const navItems = [
    { name: t.nav.home, icon: <Home size={20} />, page: 'home' },
    { name: t.nav.aboutUs, icon: <Info size={20} />, page: 'about' },
    { name: t.nav.academics, icon: <Book size={20} />, page: 'academics' },
    { name: t.nav.teachers, icon: <Users size={20} />, page: 'teachers' },
    { name: t.nav.contactUs, icon: <Phone size={20} />, page: 'contact' },
    { name: t.nav.notices, icon: <Calendar size={20} />, page: 'notices' },
    { name: t.nav.gallery, icon: <Image size={20} />, page: 'gallery' },
    { name: t.nav.notifications, icon: <Bell size={20} />, page: 'notifications' }, // Added notifications
    { name: t.nav.admin, icon: <Settings size={20} />, page: 'admin', authRequired: true },
  ];

  // Custom Confirmation Modal
  const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm text-center">
          <p className="text-xl font-semibold text-gray-800 mb-6">{message}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onConfirm}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition duration-300 transform hover:scale-105 shadow-md"
            >
              {t.confirm.yes}
            </button>
            <button
              onClick={onCancel}
              className="bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-400 transition duration-300 shadow-md"
            >
              {t.confirm.no}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleConfirm = (action) => {
    setConfirmMessage(action.message); // Set message from action object
    setConfirmAction(() => action.callback); // Set callback from action object
    setShowConfirmModal(true);
  };

  const executeConfirmAction = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  const cancelConfirmAction = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  // Function to handle admin login/logout (still hardcoded)
  const handleAdminAuth = () => {
    if (isAdminLoggedIn) {
      handleConfirm({
        message: t.confirm.logout,
        callback: () => {
          setIsAdminLoggedIn(false);
          setCurrentPage('home');
        }
      });
    } else {
      setShowAdminLogin(true);
    }
    setShowDesktopAdminMenu(false);
  };

  // Admin login modal content - USES HARDCODED CREDENTIALS
  const AdminLoginModal = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    const handleLogin = (e) => {
      e.preventDefault();
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        setIsAdminLoggedIn(true);
        setShowAdminLogin(false);
        setCurrentPage('admin');
        setLoginError('');
        // alert(t.admin.loginSuccess); // Replaced with custom modal
        setConfirmMessage(t.admin.loginSuccess);
        setShowConfirmModal(true);
        setConfirmAction(() => () => {}); // No action needed after success message
      } else {
        setLoginError(t.admin.loginFailed);
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{t.admin.loginTitle}</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="adminEmail" className="block text-gray-700 text-lg font-medium mb-2">{t.admin.email}</label>
              <input
                type="email"
                id="adminEmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.admin.email}
                required
              />
            </div>
            <div>
              <label htmlFor="adminPassword" className="block text-gray-700 text-lg font-medium mb-2">{t.admin.password}</label>
              <input
                type="password"
                id="adminPassword"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.admin.password}
                required
              />
            </div>
            {loginError && <p className="text-red-600 text-center">{loginError}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105 shadow-md"
            >
              {t.admin.loginBtn}
            </button>
            <button
              type="button"
              onClick={() => setShowAdminLogin(false)}
              className="w-full mt-2 bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold text-lg hover:bg-gray-400 transition duration-300 shadow-md"
            >
              {t.admin.cancelBtn}
            </button>
          </form>
        </div>
      </div>
    );
  };

  // Function to send a notification
  const sendNotification = async (thumbnail, heading, details, type) => {
    if (!db || !appId) {
      console.error("Database not ready for notification.");
      return;
    }
    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/notifications`), {
        thumbnail: thumbnail,
        heading: heading,
        details: details,
        timestamp: new Date(),
        type: type // 'manual', 'notice', 'gallery'
      });
      console.log("Notification sent successfully!");
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  };

  // Admin Panel Component - MANAGES DATA VIA FIRESTORE
  const AdminPanel = () => {
    const [newTeacher, setNewTeacher] = useState({ name: '', designation: '', subject: '', imageUrl: '', bio: '' });
    const [newNotice, setNewNotice] = useState({ title: '', content: '', imageUrl: '' }); // Added imageUrl
    const [newGalleryImage, setNewGalleryImage] = useState({ src: '', alt: '' });
    const [newHeroSlide, setNewHeroSlide] = useState({ src: '', caption: '' }); // New state for hero slide
    const [newNotification, setNewNotification] = useState({ thumbnail: '', heading: '', details: '' }); // New state for manual notifications
    const [currentWebsiteSettings, setCurrentWebsiteSettings] = useState(websiteSettings); // Local state for editing website settings

    useEffect(() => {
      setCurrentWebsiteSettings(websiteSettings); // Sync when parent state changes
    }, [websiteSettings]);

    // Function to handle image upload from device (placeholder)
    const handleDeviceImageUpload = (e, setImageState) => {
      const file = e.target.files[0];
      if (file) {
        // In a real application, you would upload this file to Firebase Storage
        // and get a downloadable URL. For this example, we'll just show a placeholder.
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageState(reader.result); // This will be a base64 string for preview
          // alert("Device image selected. In a real app, this would be uploaded to a storage service to get a URL.");
          handleConfirm({
            message: "Device image selected. In a real app, this would be uploaded to a storage service to get a URL.",
            callback: () => {}
          });
        };
        reader.readAsDataURL(file);
      }
    };

    const handleAddUpdateTeacher = async (e) => {
      e.preventDefault();
      if (!db || !appId) { 
        // alert(t.admin.dbNotReady);
        handleConfirm({ message: t.admin.dbNotReady, callback: () => {} });
        return;
      }
      try {
        if (editingTeacher) {
          await setDoc(doc(db, `artifacts/${appId}/public/data/teachers`, editingTeacher.id), newTeacher);
          // alert(t.admin.teacherUpdated);
          handleConfirm({ message: t.admin.teacherUpdated, callback: () => {} });
        } else {
          await addDoc(collection(db, `artifacts/${appId}/public/data/teachers`), newTeacher);
          // alert(t.admin.teacherAdded);
          handleConfirm({ message: t.admin.teacherAdded, callback: () => {} });
        }
        setNewTeacher({ name: '', designation: '', subject: '', imageUrl: '', bio: '' });
        setEditingTeacher(null);
      } catch (error) {
        console.error("শিক্ষক যোগ/আপডেট করতে ব্যর্থ:", error);
        // alert(t.admin.teacherDeleteFailed); // Reusing for general failure
        handleConfirm({ message: t.admin.teacherDeleteFailed, callback: () => {} });
      }
    };

    const handleDeleteTeacher = (id) => {
      handleConfirm({
        message: t.admin.confirmDeleteTeacher,
        callback: async () => {
          if (!db || !appId) {
            // alert(t.admin.dbNotReady);
            handleConfirm({ message: t.admin.dbNotReady, callback: () => {} });
            return;
          }
          try {
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/teachers`, id));
          } catch (error) {
            console.error("শিক্ষক মুছে ফেলতে ব্যর্থ:", error);
            // alert(t.admin.teacherDeleteFailed);
            handleConfirm({ message: t.admin.teacherDeleteFailed, callback: () => {} });
          }
        }
      });
    };

    const handleAddUpdateNotice = async (e) => {
      e.preventDefault();
      if (!db || !appId) {
        // alert(t.admin.dbNotReady);
        handleConfirm({ message: t.admin.dbNotReady, callback: () => {} });
        return;
      }
      try {
        if (editingNotice) {
          await setDoc(doc(db, `artifacts/${appId}/public/data/notices`, editingNotice.id), { ...newNotice, date: new Date() });
          // alert(t.admin.noticeUpdated);
          handleConfirm({ message: t.admin.noticeUpdated, callback: () => {} });
          // Send notification for updated notice
          sendNotification(newNotice.imageUrl || "https://placehold.co/50x50/4A90E2/FFFFFF?text=Notice", newNotice.title, newNotice.content, 'notice');
        } else {
          await addDoc(collection(db, `artifacts/${appId}/public/data/notices`), { ...newNotice, date: new Date() });
          // alert(t.admin.noticeAdded);
          handleConfirm({ message: t.admin.noticeAdded, callback: () => {} });
          // Send notification for new notice
          sendNotification(newNotice.imageUrl || "https://placehold.co/50x50/4A90E2/FFFFFF?text=Notice", newNotice.title, newNotice.content, 'notice');
        }
        setNewNotice({ title: '', content: '', imageUrl: '' }); // Reset imageUrl
        setEditingNotice(null);
      } catch (error) {
        console.error("নোটিশ যোগ/আপডেট করতে ব্যর্থ:", error);
        // alert(t.admin.noticeDeleteFailed);
        handleConfirm({ message: t.admin.noticeDeleteFailed, callback: () => {} });
      }
    };

    const handleDeleteNotice = (id) => {
      handleConfirm({
        message: t.admin.confirmDeleteNotice,
        callback: async () => {
          if (!db || !appId) {
            // alert(t.admin.dbNotReady);
            handleConfirm({ message: t.admin.dbNotReady, callback: () => {} });
            return;
          }
          try {
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/notices`, id));
          } catch (error) {
            console.error("নোটিশ মুছে ফেলতে ব্যর্থ:", error);
            // alert(t.admin.noticeDeleteFailed);
            handleConfirm({ message: t.admin.noticeDeleteFailed, callback: () => {} });
          }
        }
      });
    };

    const handleAddUpdateGalleryImage = async (e) => { // Renamed to handle both add and update
      e.preventDefault();
      if (!db || !appId) {
        handleConfirm({ message: t.admin.dbNotReady, callback: () => {} });
        return;
      }
      try {
        if (editingGalleryImage) {
          await setDoc(doc(db, `artifacts/${appId}/public/data/gallery`, editingGalleryImage.id), newGalleryImage);
          handleConfirm({ message: t.admin.galleryImageUpdated, callback: () => {} });
        } else {
          await addDoc(collection(db, `artifacts/${appId}/public/data/gallery`), newGalleryImage);
          handleConfirm({ message: t.admin.galleryImageAdded, callback: () => {} });
          // Send notification for new gallery image
          sendNotification(newGalleryImage.src, `নতুন ছবি: ${newGalleryImage.alt}`, `গ্যালারিতে একটি নতুন ছবি যোগ করা হয়েছে: ${newGalleryImage.alt}`, 'gallery');
        }
        setNewGalleryImage({ src: '', alt: '' });
        setEditingGalleryImage(null); // Clear editing state
      } catch (error) {
        console.error("গ্যালারি ইমেজ যোগ/আপডেট করতে ব্যর্থ:", error);
        handleConfirm({ message: t.admin.galleryImageDeleteFailed, callback: () => {} }); // Reusing for general failure
      }
    };

    const handleDeleteGalleryImage = (id) => {
      handleConfirm({
        message: t.admin.confirmDeleteGalleryImage,
        callback: async () => {
          if (!db || !appId) {
            // alert(t.admin.dbNotReady);
            handleConfirm({ message: t.admin.dbNotReady, callback: () => {} });
            return;
          }
          try {
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/gallery`, id));
          } catch (error) {
            console.error("গ্যালারি ইমেজ মুছে ফেলতে ব্যর্থ:", error);
            // alert(t.admin.galleryImageDeleteFailed);
            handleConfirm({ message: t.admin.galleryImageDeleteFailed, callback: () => {} });
          }
        }
      });
    };

    // New: Handle Hero Slides
    const handleAddUpdateHeroSlide = async (e) => {
      e.preventDefault();
      if (!db || !appId) {
        // alert(t.admin.dbNotReady);
        handleConfirm({ message: t.admin.dbNotReady, callback: () => {} });
        return;
      }
      try {
        if (editingHeroSlide) {
          await setDoc(doc(db, `artifacts/${appId}/public/data/heroSlides`, editingHeroSlide.id), newHeroSlide);
          // alert(t.admin.heroSlideUpdated);
          handleConfirm({ message: t.admin.heroSlideUpdated, callback: () => {} });
        } else {
          await addDoc(collection(db, `artifacts/${appId}/public/data/heroSlides`), newHeroSlide);
          // alert(t.admin.heroSlideAdded);
          handleConfirm({ message: t.admin.heroSlideAdded, callback: () => {} });
        }
        setNewHeroSlide({ src: '', caption: '' });
        setEditingHeroSlide(null);
      } catch (error) {
        console.error("স্লাইড ইমেজ যোগ/আপডেট করতে ব্যর্থ:", error);
        // alert(t.admin.heroSlideDeleteFailed);
        handleConfirm({ message: t.admin.heroSlideDeleteFailed, callback: () => {} });
      }
    };

    const handleDeleteHeroSlide = (id) => {
      handleConfirm({
        message: t.admin.confirmDeleteHeroSlide,
        callback: async () => {
          if (!db || !appId) {
            // alert(t.admin.dbNotReady);
            handleConfirm({ message: t.admin.dbNotReady, callback: () => {} });
            return;
          }
          try {
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/heroSlides`, id));
          } catch (error) {
            console.error("স্লাইড ইমেজ মুছে ফেলতে ব্যর্থ:", error);
            // alert(t.admin.heroSlideDeleteFailed);
            handleConfirm({ message: t.admin.heroSlideDeleteFailed, callback: () => {} });
          }
        }
      });
    };

    // Handle manual notification sending
    const handleSendManualNotification = async (e) => {
      e.preventDefault();
      if (!db || !appId) {
        // alert(t.admin.dbNotReady);
        handleConfirm({ message: t.admin.dbNotReady, callback: () => {} });
        return;
      }
      try {
        await sendNotification(newNotification.thumbnail, newNotification.heading, newNotification.details, 'manual');
        // alert(t.admin.notificationSent);
        handleConfirm({ message: t.admin.notificationSent, callback: () => {} });
        setNewNotification({ thumbnail: '', heading: '', details: '' });
      } catch (error) {
        console.error("ম্যানুয়াল নোটিফিকেশন পাঠাতে ব্যর্থ:", error);
        // alert(t.admin.notificationFailed);
        handleConfirm({ message: t.admin.notificationFailed, callback: () => {} });
      }
    };

    const handleDeleteNotification = (id) => {
      handleConfirm({
        message: t.admin.confirmDeleteNotification,
        callback: async () => {
          if (!db || !appId) {
            // alert(t.admin.dbNotReady);
            handleConfirm({ message: t.admin.dbNotReady, callback: () => {} });
            return;
          }
          try {
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/notifications`, id));
          } catch (error) {
            console.error("নোটিফিকেশন মুছে ফেলতে ব্যর্থ:", error);
            // alert(t.admin.notificationDeleteFailed);
            handleConfirm({ message: t.admin.notificationDeleteFailed, callback: () => {} });
          }
        }
      });
    };

    // Handle Website Settings Update
    const handleUpdateWebsiteSettings = async (e) => {
      e.preventDefault();
      if (!db || !appId) {
        handleConfirm({ message: t.admin.dbNotReady, callback: () => {} });
        return;
      }
      try {
        const docRef = doc(db, `artifacts/${appId}/public/data/websiteSettings`, 'generalInfo');
        await setDoc(docRef, currentWebsiteSettings, { merge: true }); // Use merge to only update specified fields
        handleConfirm({ message: t.admin.websiteSettingsUpdated, callback: () => {} });
      } catch (error) {
        console.error("ওয়েবসাইট সেটিংস আপডেট করতে ব্যর্থ:", error);
        handleConfirm({ message: t.admin.websiteSettingsUpdateFailed, callback: () => {} });
      }
    };


    if (!isAdminLoggedIn) {
      return (
        <div className="text-center py-20">
          <p className="text-xl text-gray-700">{t.admin.accessDenied}</p>
          <button
            onClick={() => setShowAdminLogin(true)}
            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 shadow-md"
          >
            {t.admin.loginBtn}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center text-gray-800 mb-8">{t.nav.adminPanel}</h1>
        {currentFirebaseUserId && (
          <p className="text-center text-gray-600 text-sm mb-4">
            আপনার Firebase User ID: <span className="font-mono bg-gray-200 px-2 py-1 rounded-md">{currentFirebaseUserId}</span>
          </p>
        )}
        <p className="text-center text-red-600 font-bold text-lg">
          {t.admin.dataNotPersistent}
        </p>

        {/* Manage Website Settings Section */}
        <section className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-6">{t.admin.manageWebsiteSettings}</h2>
          <form onSubmit={handleUpdateWebsiteSettings} className="space-y-4 mb-8">
            {/* Map Embed URL */}
            <div>
              <label htmlFor="mapEmbedUrl" className="block text-gray-700 text-lg font-medium mb-2">{t.admin.mapEmbedUrl}</label>
              <textarea
                id="mapEmbedUrl"
                value={currentWebsiteSettings.mapEmbedUrl}
                onChange={(e) => setCurrentWebsiteSettings({ ...currentWebsiteSettings, mapEmbedUrl: e.target.value })}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.admin.mapEmbedUrl}
              ></textarea>
            </div>
            {/* About History */}
            <div>
              <label htmlFor="aboutHistory" className="block text-gray-700 text-lg font-medium mb-2">{t.admin.aboutHistory}</label>
              <textarea
                id="aboutHistory"
                value={currentWebsiteSettings.aboutHistory}
                onChange={(e) => setCurrentWebsiteSettings({ ...currentWebsiteSettings, aboutHistory: e.target.value })}
                rows="5"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.admin.aboutHistory}
              ></textarea>
            </div>
            {/* About Mission */}
            <div>
              <label htmlFor="aboutMission" className="block text-gray-700 text-lg font-medium mb-2">{t.admin.aboutMission}</label>
              <textarea
                id="aboutMission"
                value={currentWebsiteSettings.aboutMission}
                onChange={(e) => setCurrentWebsiteSettings({ ...currentWebsiteSettings, aboutMission: e.target.value })}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.admin.aboutMission}
              ></textarea>
            </div>
            {/* About Vision */}
            <div>
              <label htmlFor="aboutVision" className="block text-gray-700 text-lg font-medium mb-2">{t.admin.aboutVision}</label>
              <textarea
                id="aboutVision"
                value={currentWebsiteSettings.aboutVision}
                onChange={(e) => setCurrentWebsiteSettings({ ...currentWebsiteSettings, aboutVision: e.target.value })}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.admin.aboutVision}
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition duration-300 shadow-md"
            >
              {t.admin.websiteSettingsUpdated}
            </button>
          </form>
        </section>

        {/* Manage Hero Slides Section */}
        <section className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-6">{t.admin.manageHeroSlides}</h2>
          <form onSubmit={handleAddUpdateHeroSlide} className="space-y-4 mb-8">
            <div>
              <label htmlFor="heroSlideImageUrl" className="block text-gray-700 text-lg font-medium mb-2">{t.admin.heroSlideImageUrl}</label>
              <input
                type="url"
                id="heroSlideImageUrl"
                value={newHeroSlide.src}
                onChange={(e) => setNewHeroSlide({ ...newHeroSlide, src: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.admin.heroSlideImageUrl}
                required
              />
            </div>
            <div>
              <label htmlFor="heroSlideCaption" className="block text-gray-700 text-lg font-medium mb-2">{t.admin.heroSlideCaption}</label>
              <input
                type="text"
                id="heroSlideCaption"
                value={newHeroSlide.caption}
                onChange={(e) => setNewHeroSlide({ ...newHeroSlide, caption: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.admin.heroSlideCaption}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition duration-300 shadow-md"
            >
              {editingHeroSlide ? t.admin.updateHeroSlide : t.admin.addHeroSlide}
            </button>
            {editingHeroSlide && (
              <button
                type="button"
                onClick={() => { setEditingHeroSlide(null); setNewHeroSlide({ src: '', caption: '' }); }}
                className="w-full mt-2 bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-gray-500 transition duration-300 shadow-md"
              >
                {t.admin.cancelEdit}
              </button>
            )}
          </form>

          <h3 className="text-xl font-bold text-gray-800 mb-4">{t.admin.currentHeroSlides}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {heroSlides.map((slide) => (
              <div key={slide.id} className="relative group rounded-lg overflow-hidden shadow-md">
                <img
                  src={slide.src || "https://placehold.co/150x100/cccccc/ffffff?text=No+Img"}
                  alt={slide.caption}
                  className="w-full h-32 object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/150x100/cccccc/ffffff?text=No+Img"; }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                  {slide.caption}
                </div>
                <button
                  onClick={() => handleDeleteHeroSlide(slide.id)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  title={t.admin.confirmDeleteHeroSlide}
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={() => { setEditingHeroSlide(slide); setNewHeroSlide(slide); }}
                  className="absolute top-2 left-2 bg-blue-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  title={t.admin.updateHeroSlide}
                >
                  <Edit size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Manage Teachers Section */}
        <section className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-6">{t.admin.manageTeachers}</h2>
          <form onSubmit={handleAddUpdateTeacher} className="space-y-4 mb-8">
            <div>
              <label htmlFor="teacherName" className="block text-gray-700 text-lg font-medium mb-2">{t.admin.teacherName}</label>
              <input
                type="text"
                id="teacherName"
                value={newTeacher.name}
                onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.admin.teacherName}
                required
              />
            </div>
            <div>
              <label htmlFor="teacherDesignation" className="block text-gray-700 text-lg font-medium mb-2">{t.admin.teacherDesignation}</label>
              <input
                type="text"
                id="teacherDesignation"
                value={newTeacher.designation}
                onChange={(e) => setNewTeacher({ ...newTeacher, designation: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.admin.teacherDesignation}
                required
              />
            </div>
            <div>
              <label htmlFor="teacherSubject" className="block text-gray-700 text-lg font-medium mb-2">{t.admin.teacherSubject}</label>
              <input
                type="text"
                id="teacherSubject"
                value={newTeacher.subject}
                onChange={(e) => setNewTeacher({ ...newTeacher, subject: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.admin.teacherSubject}
                required
              />
            </div>
            <div>
              <label htmlFor="teacherImageUrl" className="block text-gray-700 text-lg font-medium mb-2">{t.admin.teacherImageUrl}</label>
              <input
                type="url"
                id="teacherImageUrl"
                value={newTeacher.imageUrl}
                onChange={(e) => setNewTeacher({ ...newTeacher, imageUrl: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.admin.teacherImageUrl}
              />
            </div>
            <div>
              <label htmlFor="teacherBio" className="block text-gray-700 text-lg font-medium mb-2">{t.admin.teacherBio}</label>
              <textarea
                id="teacherBio"
                value={newTeacher.bio}
                onChange={(e) => setNewTeacher({ ...newTeacher, bio: e.target.value })}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.admin.teacherBio}
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition duration-300 shadow-md"
            >
              {editingTeacher ? t.admin.updateTeacher : t.admin.addTeacher}
            </button>
            {editingTeacher && (
              <button
                type="button"
                onClick={() => { setEditingTeacher(null); setNewTeacher({ name: '', designation: '', subject: '', imageUrl: '', bio: '' }); }}
                className="w-full mt-2 bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-gray-500 transition duration-300 shadow-md"
              >
                {t.admin.cancelEdit}
              </button>
            )}
          </form>

          <h3 className="text-xl font-bold text-gray-800 mb-4">{t.admin.currentTeachers}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-md">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t.admin.teacherImageUrl}</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t.admin.teacherName}</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t.admin.teacherDesignation}</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t.admin.teacherSubject}</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t.admin.actions}</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="border-b border-gray-200 last:border-b-0">
                    <td className="py-3 px-4">
                      <img src={teacher.imageUrl || "https://placehold.co/50x50/cccccc/ffffff?text=No+Img"} alt={teacher.name} className="w-12 h-12 rounded-full object-cover" />
                    </td>
                    <td className="py-3 px-4 text-gray-800">{teacher.name}</td>
                    <td className="py-3 px-4 text-gray-800">{teacher.designation}</td>
                    <td className="py-3 px-4 text-gray-800">{teacher.subject}</td>
                    <td className="py-3 px-4 flex space-x-2">
                      <button
                        onClick={() => { setEditingTeacher(teacher); setNewTeacher(teacher); }}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50 transition duration-200"
                        title={t.admin.updateTeacher}
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(teacher.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50 transition duration-200"
                        title={t.admin.confirmDeleteTeacher}
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Manage Notices Section */}
        <section className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-6">{t.admin.manageNotices}</h2>
          <form onSubmit={handleAddUpdateNotice} className="space-y-4 mb-8">
            <div>
              <label htmlFor="noticeTitle" className="block text-gray-700 text-lg font-medium mb-2">{t.admin.noticeTitle}</label>
              <input
                type="text"
                id="noticeTitle"
                value={newNotice.title}
                onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.admin.noticeTitle}
                required
              />
            </div>
            <div>
              <label htmlFor="noticeContent" className="block text-gray-700 text-lg font-medium mb-2">{t.admin.noticeContent}</label>
              <textarea
                id="noticeContent"
                value={newNotice.content}
                onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                rows="5"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.admin.noticeContent}
                required
              ></textarea>
            </div>
            {/* Image URL for Notices */}
            <div>
              <label htmlFor="noticeImageUrl" className="block text-gray-700 text-lg font-medium mb-2">{t.admin.noticeImageUrl}</label>
              <input
                type="url"
                id="noticeImageUrl"
                value={newNotice.imageUrl}
                onChange={(e) => setNewNotice({ ...newNotice, imageUrl: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.admin.noticeImageUrl}
              />
              <p className="text-center text-gray-500 my-2">{t.admin.or}</p>
              <input
                type="file"
                id="noticeImageUpload"
                accept="image/*"
                onChange={(e) => handleDeviceImageUpload(e, (base64) => setNewNotice({ ...newNotice, imageUrl: base64 }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">{t.admin.uploadImage}</p>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition duration-300 shadow-md"
            >
              {editingNotice ? t.admin.updateNotice : t.admin.addNotice}
            </button>
            {editingNotice && (
              <button
                type="button"
                onClick={() => { setEditingNotice(null); setNewNotice({ title: '', content: '', imageUrl: '' }); }}
                className="w-full mt-2 bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-gray-500 transition duration-300 shadow-md"
              >
                {t.admin.cancelEdit}
              </button>
            )}
          </form>

          <h3 className="text-xl font-bold text-gray-800 mb-4">{t.admin.currentNotices}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-md">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t.admin.date}</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t.admin.noticeTitle}</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t.admin.noticeImageUrl}</th> {/* Added column */}
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t.admin.noticeContent}</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t.admin.actions}</th>
                </tr>
              </thead>
              <tbody>
                {notices.map((item) => ( // Corrected: using 'notices' state here
                  <tr key={item.id} className="border-b border-gray-200 last:border-b-0">
                    <td className="py-3 px-4 text-gray-800">
                      {item.date ? new Date(item.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US') : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-gray-800">{item.title}</td>
                    <td className="py-3 px-4">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.title} className="w-16 h-12 object-cover rounded-md" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/60x40/cccccc/ffffff?text=No+Img"; }} />
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-800">{item.content.substring(0, 50)}...</td>
                    <td className="py-3 px-4 flex space-x-2">
                      <button
                        onClick={() => { setEditingNotice(item); setNewNotice({ title: item.title, content: item.content, imageUrl: item.imageUrl }); }} // Pass imageUrl
                        className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50 transition duration-200"
                        title={t.admin.updateNotice}
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteNotice(item.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50 transition duration-200"
                        title={t.admin.confirmDeleteNotice}
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Manage Gallery Section */}
        <section className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-6">{t.admin.manageGallery}</h2>
          <form onSubmit={handleAddUpdateGalleryImage} className="space-y-4 mb-8"> {/* Changed onSubmit */}
            <div>
              <label htmlFor="galleryImageUrl" className="block text-gray-700 text-lg font-medium mb-2">{t.admin.galleryImageUrl}</label>
              <input
                type="url"
                id="galleryImageUrl"
                value={newGalleryImage.src}
                onChange={(e) => setNewGalleryImage({ ...newGalleryImage, src: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.admin.galleryImageUrl}
                required
              />
              <p className="text-center text-gray-500 my-2">{t.admin.or}</p>
              <input
                type="file"
                id="galleryImageUpload"
                accept="image/*"
                onChange={(e) => handleDeviceImageUpload(e, (base64) => setNewGalleryImage({ ...newGalleryImage, src: base64 }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">{t.admin.uploadImage}</p>
            </div>
            <div>
              <label htmlFor="galleryImageAlt" className="block text-gray-700 text-lg font-medium mb-2">{t.admin.galleryImageAlt}</label>
              <input
                type="text"
                id="galleryImageAlt"
                value={newGalleryImage.alt}
                onChange={(e) => setNewGalleryImage({ ...newGalleryImage, alt: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.admin.galleryImageAlt}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition duration-300 shadow-md"
            >
              {editingGalleryImage ? t.admin.updateGalleryImage : t.admin.addGalleryImage} {/* Dynamic button text */}
            </button>
            {editingGalleryImage && ( // Show cancel button if editing
              <button
                type="button"
                onClick={() => { setEditingGalleryImage(null); setNewGalleryImage({ src: '', alt: '' }); }}
                className="w-full mt-2 bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-gray-500 transition duration-300 shadow-md"
              >
                {t.admin.cancelEdit}
              </button>
            )}
          </form>

          <h3 className="text-xl font-bold text-gray-800 mb-4">{t.admin.currentGalleryImages}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryImages.map((image) => (
              <div key={image.id} className="relative group rounded-lg overflow-hidden shadow-md">
                <img
                  src={image.src || "https://placehold.co/150x100/cccccc/ffffff?text=No+Img"}
                  alt={image.alt}
                  className="w-full h-32 object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/150x100/cccccc/ffffff?text=No+Img"; }}
                />
                <button
                  onClick={() => handleDeleteGalleryImage(image.id)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  title={t.admin.confirmDeleteGalleryImage}
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={() => { setEditingGalleryImage(image); setNewGalleryImage(image); }} // Edit button
                  className="absolute top-2 left-2 bg-blue-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  title={t.admin.updateGalleryImage}
                >
                  <Edit size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Manage Notifications Section */}
        <section className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-6">{t.admin.manageNotifications}</h2>
          <form onSubmit={handleSendManualNotification} className="space-y-4 mb-8">
            <div>
              <label htmlFor="notificationThumbnail" className="block text-gray-700 text-lg font-medium mb-2">{t.admin.notificationThumbnail}</label>
              <input
                type="url"
                id="notificationThumbnail"
                value={newNotification.thumbnail}
                onChange={(e) => setNewNotification({ ...newNotification, thumbnail: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.admin.notificationThumbnail}
              />
              <p className="text-center text-gray-500 my-2">{t.admin.or}</p>
              <input
                type="file"
                id="notificationThumbnailUpload"
                accept="image/*"
                onChange={(e) => handleDeviceImageUpload(e, (base64) => setNewNotification({ ...newNotification, thumbnail: base64 }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">{t.admin.uploadImage}</p>
            </div>
            <div>
              <label htmlFor="notificationHeading" className="block text-gray-700 text-lg font-medium mb-2">{t.admin.notificationHeading}</label>
              <input
                type="text"
                id="notificationHeading"
                value={newNotification.heading}
                onChange={(e) => setNewNotification({ ...newNotification, heading: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.admin.notificationHeading}
                required
              />
            </div>
            <div>
              <label htmlFor="notificationDetails" className="block text-gray-700 text-lg font-medium mb-2">{t.admin.notificationDetails}</label>
              <textarea
                id="notificationDetails"
                value={newNotification.details}
                onChange={(e) => setNewNotification({ ...newNotification, details: e.target.value })}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t.admin.notificationDetails}
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition duration-300 shadow-md"
            >
              {t.admin.sendNotification}
            </button>
          </form>

          <h3 className="text-xl font-bold text-gray-800 mb-4">{t.admin.currentNotifications}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-md">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t.admin.notificationThumbnail}</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t.admin.notificationHeading}</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t.admin.notificationDetails}</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t.admin.date}</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t.admin.actions}</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200 last:border-b-0">
                    <td className="py-3 px-4">
                      <img src={item.thumbnail || "https://placehold.co/50x50/cccccc/ffffff?text=N/A"} alt={item.heading} className="w-12 h-12 rounded-md object-cover" />
                    </td>
                    <td className="py-3 px-4 text-gray-800">{item.heading}</td>
                    <td className="py-3 px-4 text-gray-800">{item.details.substring(0, 50)}...</td>
                    <td className="py-3 px-4 text-gray-800">
                      {item.timestamp ? new Date(item.timestamp).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US') : 'N/A'}
                    </td>
                    <td className="py-3 px-4 flex space-x-2">
                      <button
                        onClick={() => handleDeleteNotification(item.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50 transition duration-200"
                        title={t.admin.confirmDeleteNotification}
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  };

  // Teachers Page Component
  const TeachersPage = () => {
    return (
      <div className={`space-y-12 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-8">{t.home.ourTeachers}</h1>
        {loading ? (
          <p className="text-center text-xl">{t.loading}</p>
        ) : teachers.length === 0 ? (
          <p className="text-center text-xl">{t.noData.teachers}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {teachers.map((teacher) => (
              <div key={teacher.id} className={`p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center ${theme === 'dark' ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-900'}`}>
                <img
                  src={teacher.imageUrl || "https://placehold.co/150x150/cccccc/ffffff?text=No+Image"}
                  alt={teacher.name}
                  className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-blue-200 shadow-md"
                  onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/150x150/cccccc/ffffff?text=No+Image"; }}
                />
                <h3 className="text-xl font-semibold mb-1">{teacher.name}</h3>
                <p className="text-blue-400 font-medium mb-1">{teacher.designation}</p>
                <p className="text-sm mb-3">{teacher.subject}</p>
                <p className="text-base leading-relaxed">{teacher.bio}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Gallery Page Component
  const GalleryPage = () => {
    return (
      <div className={`space-y-12 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-8">{t.home.ourGallery}</h1>
        {loading ? (
          <p className="text-center text-xl">{t.loading}</p>
        ) : galleryImages.length === 0 ? (
          <p className="text-center text-xl">{t.noData.gallery}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {galleryImages.map((image) => (
              <div key={image.id} className={`p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                <img
                  src={image.src || "https://placehold.co/600x400/cccccc/ffffff?text=No+Image"}
                  alt={image.alt}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/cccccc/ffffff?text=No+Image"; }}
                />
                <p className="text-center">{image.alt}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Notices Page Component
  const NoticesPage = () => {
    return (
      <div className={`space-y-12 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-8">{t.home.latestNewsNotices}</h1>
        {loading ? (
          <p className="text-center text-xl">{t.loading}</p>
        ) : notices.length === 0 ? (
          <p className="text-center text-xl">{t.noData.notices}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {notices.map((item) => (
              <div key={item.id} className={`p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                {item.imageUrl && ( // Display image if available
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/cccccc/ffffff?text=No+Image"; }}
                  />
                )}
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 mb-3 flex items-center">
                  <Calendar size={16} className="mr-2" /> {item.date ? new Date(item.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US') : 'N/A'}
                </p>
                <p className="mb-4">{item.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Notifications Page Component
  const NotificationsPage = () => {
    return (
      <div className={`space-y-12 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-8">{t.nav.notifications}</h1>
        {loading ? (
          <p className="text-center text-xl">{t.loading}</p>
        ) : notifications.length === 0 ? (
          <p className="text-center text-xl">{t.noData.notifications}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {notifications.map((item) => (
              <div key={item.id} className={`p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                {item.thumbnail && (
                  <img
                    src={item.thumbnail}
                    alt={item.heading}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x200/cccccc/ffffff?text=No+Image"; }}
                  />
                )}
                <h3 className="text-xl font-semibold mb-2">{item.heading}</h3>
                <p className="text-sm text-gray-400 mb-3 flex items-center">
                  <Calendar size={16} className="mr-2" /> {item.timestamp ? new Date(item.timestamp).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US') : 'N/A'}
                </p>
                <p className="mb-4">{item.details}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };


  // Function to render page content based on currentPage state
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <div className="space-y-12">
            {/* Hero Section with Slideshow */}
            <section
              className={`relative bg-cover bg-center bg-no-repeat text-white py-20 px-4 sm:px-6 lg:px-8 rounded-xl shadow-lg overflow-hidden h-[400px] flex items-center justify-center transition-opacity duration-1000 ease-in-out ${heroSlides.length > 0 ? '' : 'bg-gray-600'}`}
              style={{ backgroundImage: heroSlides.length > 0 ? `url(${heroSlides[currentSlideIndex].src})` : `url(https://placehold.co/1200x400/4A90E2/FFFFFF?text=Welcome+to+MUBC)` }}
            >
              {/* Overlay for better text readability */}
              <div className="absolute inset-0 bg-black opacity-50 rounded-xl"></div>
              <div className="relative max-w-4xl mx-auto text-center z-10">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 animate-fade-in-down">
                  {websiteData.home.heroTitle}
                </h1>
                <p className="text-xl sm:text-2xl mb-8 animate-fade-in-up">
                  {heroSlides.length > 0 ? heroSlides[currentSlideIndex].caption : websiteData.home.heroSubtitle}
                </p>
                <a
                  href="#"
                  onClick={() => setCurrentPage('about')}
                  className="inline-block bg-white text-blue-700 hover:bg-blue-100 px-8 py-3 rounded-full font-semibold text-lg transition duration-300 transform hover:scale-105 shadow-md"
                >
                  {t.home.learnMore}
                </a>
              </div>
            </section>

            {/* Features Section */}
            <section className="px-4 sm:px-6 lg:px-8">
              <h2 className={`text-3xl sm:text-4xl font-bold text-center mb-10 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{t.home.whyChooseUs}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {websiteData.home.features.map((feature, index) => (
                  <div
                    key={index}
                    className={`p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center ${theme === 'dark' ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-900'}`}
                  >
                    <div className="text-blue-600 mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-base leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Teachers Section on Homepage */}
            <section className="px-4 sm:px-6 lg:px-8">
              <h2 className={`text-3xl sm:text-4xl font-bold text-center mb-10 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{t.home.ourTeachers}</h2>
              {loading ? (
                <p className={`text-center text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{t.loading}</p>
              ) : teachers.length === 0 ? (
                <p className={`text-center text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{t.noData.teachers}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  {teachers.slice(0, 3).map((teacher) => ( // Show first 3 teachers on homepage
                    <div key={teacher.id} className={`p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center ${theme === 'dark' ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-900'}`}>
                      <img
                        src={teacher.imageUrl || "https://placehold.co/150x150/cccccc/ffffff?text=No+Image"}
                        alt={teacher.name}
                        className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-blue-200 shadow-md"
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/150x150/cccccc/ffffff?text=No+Image"; }}
                      />
                      <h3 className="text-xl font-semibold mb-1">{teacher.name}</h3>
                      <p className="text-blue-400 font-medium mb-1">{teacher.designation}</p>
                      <p className="text-sm mb-3">{teacher.subject}</p>
                      <p className="text-base leading-relaxed">{teacher.bio.substring(0, 70)}...</p>
                    </div>
                  ))}
                </div>
              )}
              {teachers.length > 3 && (
                <div className="text-center mt-8">
                  <a
                    href="#"
                    onClick={() => setCurrentPage('teachers')}
                    className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105 shadow-md"
                  >
                    {t.home.viewAllTeachers}
                  </a>
                </div>
              )}
            </section>

            {/* Gallery Section on Homepage */}
            <section className="px-4 sm:px-6 lg:px-8">
              <h2 className={`text-3xl sm:text-4xl font-bold text-center mb-10 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{t.home.ourGallery}</h2>
              {loading ? (
                <p className={`text-center text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{t.loading}</p>
              ) : galleryImages.length === 0 ? (
                <p className={`text-center text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{t.noData.gallery}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  {galleryImages.slice(0, 3).map((image) => ( // Show first 3 images on homepage
                    <div key={image.id} className={`p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                      <img
                        src={image.src || "https://placehold.co/600x400/cccccc/ffffff?text=No+Image"}
                        alt={image.alt}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/cccccc/ffffff?text=No+Image"; }}
                      />
                      <p className="text-center">{image.alt}</p>
                    </div>
                  ))}
                </div>
              )}
              {galleryImages.length > 3 && (
                <div className="text-center mt-8">
                  <a
                    href="#"
                    onClick={() => setCurrentPage('gallery')}
                    className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105 shadow-md"
                  >
                    {t.home.viewFullGallery}
                  </a>
                </div>
              )}
            </section>

            {/* Latest News & Notices Section */}
            <section className="px-4 sm:px-6 lg:px-8">
              <h2 className={`text-3xl sm:text-4xl font-bold text-center mb-10 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{t.home.latestNewsNotices}</h2>
              {loading ? (
                <p className={`text-center text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{t.loading}</p>
              ) : notices.length === 0 ? (
                <p className={`text-center text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{t.noData.notices}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  {notices.slice(0, 3).map((item) => ( // Show only top 3 notices on homepage
                    <div key={item.id} className={`p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                      {item.imageUrl && ( // Display image if available
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                          onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/cccccc/ffffff?text=No+Image"; }}
                        />
                      )}
                      <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-400 mb-3 flex items-center">
                        <Calendar size={16} className="mr-2" /> {item.date ? new Date(item.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US') : 'N/A'}
                      </p>
                      <p className="mb-4">
                        {item.content.length > 100 ? `${item.content.substring(0, 100)}...` : item.content}
                      </p>
                      {item.content.length > 100 && (
                        <a href="#" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                          {t.home.readMore} <ChevronRight size={16} className="ml-1" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {notices.length > 3 && (
                <div className="text-center mt-8">
                  <a
                    href="#"
                    onClick={() => setCurrentPage('notices')} 
                    className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105 shadow-md"
                  >
                    {t.home.viewAllNotices}
                  </a>
                </div>
              )}
            </section>
          </div>
        );
      case 'about':
        return (
          <div className={`space-y-12 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-8">{websiteData.about.title}</h1>
            <section className={`p-8 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
              <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-4">{t.about.history}</h2>
              <p className="leading-relaxed text-lg">{websiteData.about.history}</p>
            </section>
            <section className={`p-8 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
              <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-4">{t.about.mission}</h2>
              <p className="leading-relaxed text-lg">{websiteData.about.mission}</p>
            </section>
            <section className={`p-8 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
              <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-4">{t.about.vision}</h2>
              <p className="leading-relaxed text-lg">{websiteData.about.vision}</p>
            </section>
          </div>
        );
      case 'academics':
        return (
          <div className={`space-y-12 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-8">{websiteData.academics.title}</h1>
            {websiteData.academics.sections.map((section, index) => (
              <section key={index} className={`p-8 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-4">{section.name}</h2>
                <p className="leading-relaxed text-lg mb-4">{section.description}</p>
                <ul className="list-disc list-inside space-y-2 text-lg">
                  {section.details.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        );
      case 'teachers':
        return <TeachersPage />;
      case 'contact':
        return (
          <div className={`space-y-12 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-8">{websiteData.contact.title}</h1>
            <section className={`p-8 rounded-xl shadow-lg grid grid-cols-1 md:grid-cols-2 gap-8 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-blue-700 mb-2">{t.contact.address}</h2>
                  <p className="text-lg">{websiteData.contact.address}</p>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-blue-700 mb-2">{t.contact.phone}</h2>
                  <p className="text-lg">{websiteData.contact.phone}</p>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-blue-700 mb-2">{t.contact.email}</h2>
                  <p className="text-lg">{websiteData.contact.email}</p>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-blue-700 mb-4">
                  {language === 'bn' ? 'মানচিত্র' : 'Map'}
                </h2>
                <div className="rounded-xl overflow-hidden shadow-md">
                  <iframe
                    src={websiteData.contact.mapEmbed}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="School Location Map"
                  ></iframe>
                </div>
              </div>
            </section>

            <section className={`p-8 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
              <h2 className="text-2xl font-bold text-blue-700 mb-4">{t.contact.title}</h2>
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-lg font-medium mb-2">{t.contact.title}</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                    placeholder={t.contact.title}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-lg font-medium mb-2">{t.admin.email}</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                    placeholder={t.admin.email}
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-lg font-medium mb-2">{t.contact.title}</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                    placeholder={t.contact.title}
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105 shadow-md"
                >
                  {t.contact.title}
                </button>
              </form>
            </section>
          </div>
        );
      case 'admin':
        return <AdminPanel />;
      case 'notices':
        return <NoticesPage />;
      case 'gallery':
        return <GalleryPage />;
      case 'notifications': // New case for notifications page
        return <NotificationsPage />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
          <p className="text-4xl font-extrabold text-blue-600 animate-pulse">MUBCIAN HERE</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-800'} font-inter`}>
      {/* Tailwind CSS CDN */}
      <script src="https://cdn.tailwindcss.com"></script>
      {/* Inter Font */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} shadow-md py-4 px-4 sm:px-6 lg:px-8 sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto flex flex-col">
          {/* Top line: Logo, School Name, and Mobile Menu/Auth */}
          <div className="flex justify-between items-center w-full">
            {/* Logo and School Name */}
            <div className="flex items-center flex-grow">
              <img
                src={websiteData.logoUrl}
                alt="School Logo"
                className="h-14 w-14 rounded-full mr-3 shadow-md object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/60x60/4A90E2/FFFFFF?text=MUBC"; }}
              />
              <span className="text-2xl sm:text-3xl font-bold leading-tight">
                {websiteData.schoolName}
              </span>
            </div>

            {/* Theme, Language, and Notifications Toggles */}
            <div className="flex items-center space-x-4 mr-4">
              {/* Notifications Button */}
              <button
                onClick={() => setCurrentPage('notifications')}
                className="p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
                title={t.nav.notifications}
              >
                <Bell size={24} className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} hover:text-blue-600`} />
              </button>
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
                title={language === 'bn' ? 'ডার্ক মোড' : 'লাইট মোড'}
              >
                {theme === 'light' ? <Moon size={24} className="text-gray-700 hover:text-gray-900" /> : <Sun size={24} className="text-yellow-400 hover:text-yellow-300" />}
              </button>
              <button
                onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
                className="p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
                title={language === 'bn' ? 'English' : 'বাংলা'}
              >
                <Globe size={24} className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} hover:text-blue-600`} />
              </button>
            </div>

            {/* Mobile Menu Button and Login/Logout (only visible on mobile) */}
            <div className="md:hidden flex items-center space-x-2">
              {isAdminLoggedIn ? (
                <button
                  onClick={handleAdminAuth}
                  className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-md p-2"
                  title={t.nav.logout}
                >
                  <LogOut size={24} />
                </button>
              ) : (
                <button
                  onClick={handleAdminAuth}
                  className="text-green-600 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-md p-2"
                  title={t.nav.login}
                >
                  <LogIn size={24} />
                </button>
              )}
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`${theme === 'dark' ? 'text-gray-100' : 'text-gray-700'} hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-2`}>
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>

          {/* Bottom Row: Desktop Navigation (Teachers, Contact Us, Notices, Gallery, and More dropdown) */}
          <nav className="hidden md:flex w-full justify-start space-x-8 mt-4 pt-4 border-t border-gray-200">
            {/* Direct navigation items */}
            {navItems.filter(item => ['teachers', 'contact', 'notices', 'gallery'].includes(item.page)).map((item) => (
              <a
                key={item.name}
                href="#"
                onClick={() => setCurrentPage(item.page)}
                className={`flex items-center px-3 py-2 rounded-md text-lg font-medium transition duration-300
                  ${currentPage === item.page ? 'bg-blue-100 text-blue-700' : `${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} hover:text-blue-600`}`}
              >
                {item.icon}
                <span className="ml-2">{item.name}</span>
              </a>
            ))}

            {/* More Options Dropdown - now after Gallery */}
            <div className="relative">
              <button
                onClick={() => setShowDesktopAdminMenu(!showDesktopAdminMenu)}
                className={`flex items-center px-3 py-2 rounded-md text-lg font-medium ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} hover:text-blue-600 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                title={t.nav.more}
              >
                <MoreVertical size={20} />
                <span className="ml-2">{t.nav.more}</span>
              </button>
              {showDesktopAdminMenu && (
                <div className={`absolute left-0 mt-2 w-48 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-md shadow-lg py-1 z-10`}>
                  {/* Home, About Us, Academics */}
                  {navItems.filter(item => ['home', 'about', 'academics'].includes(item.page)).map((item) => (
                    <a
                      key={item.name}
                      href="#"
                      onClick={() => { setCurrentPage(item.page); setShowDesktopAdminMenu(false); }}
                      className={`flex items-center w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition duration-300 rounded-md
                        ${currentPage === item.page ? 'bg-blue-100 text-blue-700' : `${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}`}
                    >
                      {item.icon}
                      <span className="ml-2">{item.name}</span>
                    </a>
                  ))}
                  {/* Admin Login/Logout/Panel */}
                  {isAdminLoggedIn ? (
                    <>
                      <button
                        onClick={handleAdminAuth}
                        className="flex items-center w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition duration-300 rounded-md"
                      >
                        <LogOut size={20} className="mr-2" />
                        {t.nav.logout}
                      </button>
                      <button
                        onClick={() => { setCurrentPage('admin'); setShowDesktopAdminMenu(false); }}
                        className={`flex items-center w-full text-left px-4 py-2 transition duration-300 rounded-md ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        <Settings size={20} className="mr-2" />
                        {t.nav.adminPanel}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleAdminAuth}
                      className="flex items-center w-full text-left px-4 py-2 text-green-600 hover:bg-green-50 transition duration-300 rounded-md"
                    >
                      <LogIn size={20} className="mr-2" />
                      {t.nav.login}
                    </button>
                  )}
                </div>
              )}
            </div>
          </nav>

          {/* Mobile Navigation Dropdown (from hamburger) */}
          {isMobileMenuOpen && (
            <nav className={`md:hidden mt-4 space-y-2 px-2 pb-3 w-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              {navItems.filter(item => item.page !== 'admin').map((item) => (
                <a
                  key={item.name}
                  href="#"
                  onClick={() => {
                    setCurrentPage(item.page);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center block px-3 py-2 rounded-md text-base font-medium transition duration-300
                    ${currentPage === item.page ? 'bg-blue-100 text-blue-700' : `${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}`}
                >
                  {item.icon}
                  <span className="ml-2">{item.name}</span>
                </a>
              ))}
              {/* Admin link for mobile, if logged in */}
              {isAdminLoggedIn && (
                <a
                  href="#"
                  onClick={() => { setCurrentPage('admin'); setIsMobileMenuOpen(false); }}
                  className={`flex items-center block px-3 py-2 rounded-md text-base font-medium transition duration-300
                    ${currentPage === 'admin' ? 'bg-blue-100 text-blue-700' : `${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}`}
                >
                  <Settings size={20} className="mr-2" />
                  {t.nav.adminPanel}
                </a>
              )}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`max-w-7xl mx-auto py-8 sm:py-12 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
        {renderPage()}
      </main>

      {/* Admin Login Modal */}
      {showAdminLogin && <AdminLoginModal />}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <ConfirmationModal
          message={confirmMessage}
          onConfirm={executeConfirmAction}
          onCancel={cancelConfirmAction}
        />
      )}

      {/* Footer */}
      <footer className={`${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-800 text-white'} py-8 px-4 sm:px-6 lg:px-8 mt-12 rounded-t-xl shadow-inner`}>
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-lg mb-4">© {new Date().getFullYear()} {websiteData.schoolName}. {t.footer.rightsReserved}</p>
          <div className="flex justify-center space-x-6">
            <a href="#" className="text-gray-300 hover:text-white transition duration-300">{t.footer.privacyPolicy}</a>
            <span className="text-gray-500">|</span>
            <a href="#" className="text-gray-300 hover:text-white transition duration-300">{t.footer.termsOfService}</a>
          </div>
        </div>
      </footer>

      {/* Custom CSS for animations and font */}
      <style>{`
        body {
          font-family: 'Inter', sans-serif;
          background-color: ${theme === 'dark' ? '#1a202c' : '#f9fafb'}; /* Apply base background color */
        }
        .animate-fade-in-down {
          animation: fadeInDown 1s ease-out;
        }
        .animate-fade-in-up {
          animation: fadeInUp 1s ease-out;
        }
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        /* Ensure scrollbar visibility if content overflows */
        body {
          overflow-y: auto;
        }
        /* Added for MUBCIAN HERE animation */
        .animate-pulse {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }
      `}</style>
    </div>
  );
};

export default App;

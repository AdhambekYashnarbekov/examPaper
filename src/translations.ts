export type Language = 'en' | 'uz' | 'ru';

export interface Translations {
  // App Header & Auth
  appName: string;
  tagline: string;
  signIn: string;
  register: string;
  createAccount: string;
  educationalCapacity: string;
  studentRole: string;
  teacherRole: string;
  adminRole: string;
  emailLabel: string;
  passwordLabel: string;
  fullNameLabel: string;
  institutionLabel: string;
  studentIdLabel: string;
  departmentLabel: string;
  signInBtn: string;
  createAccountBtn: string;
  demoProfiles: string;
  logout: string;
  welcome: string;

  // Common UI
  refresh: string;
  close: string;
  cancel: string;
  save: string;
  submit: string;
  loading: string;
  actions: string;
  status: string;
  active: string;
  inactive: string;
  approved: string;
  pending: string;
  rejected: string;

  // Accessibility Toolbar
  accessibilityBtn: string;
  screenReaderTitle: string;
  voiceSpeechAssistant: string;
  readAloudBtn: string;
  stopBtn: string;
  speechSpeed: string;
  textSize: string;
  standardSize: string;
  largeSize: string;
  xlargeSize: string;
  highContrast: string;
  themeLabel: string;
  lightTheme: string;
  darkTheme: string;
  on: string;
  off: string;
  keyboardGuide: string;
  interfaceLanguage: string;

  // Student Portal
  assignedExams: string;
  pastDiagnostics: string;
  enterExamRoom: string;
  accessPasswordRequired: string;
  enterRoomPassword: string;
  joinRoomBtn: string;
  waitingForTeacherApproval: string;
  approvalPendingDesc: string;
  score: string;
  questionsCount: string;
  timeLimit: string;
  minutes: string;
  aiDiagnosticReport: string;

  // Teacher Portal
  examRoomsTab: string;
  approvalLobbyTab: string;
  activityDeckTab: string;
  analyticsTab: string;
  createExamRoomBtn: string;
  newRoomTitle: string;
  roomTitleLabel: string;
  subjectLabel: string;
  passPercentageLabel: string;
  enableProctoring: string;
  requirePassword: string;
  addQuestionBtn: string;
  approveStudent: string;
  rejectStudent: string;
  candidateName: string;
  liveStudentsCount: string;

  // Admin Portal
  governancePanel: string;
  registeredAccounts: string;
  activeRoomsCount: string;
  totalSubmissionsCount: string;
  userDirectory: string;
  suspendAccount: string;
  restoreAccount: string;

  // Exam Screen
  questionOf: string;
  pointsWeight: string;
  readQuestionAloud: string;
  timeRemaining: string;
  submitExam: string;
  autosaved: string;
  proctorActive: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: "examPaper",
    tagline: "AI-Powered Academic Examination & Deep Learner Diagnostic Ecosystem.",
    signIn: "Sign In",
    register: "Create Account",
    createAccount: "Create Account",
    educationalCapacity: "Educational Capacity",
    studentRole: "Student",
    teacherRole: "Teacher / Lecturer",
    adminRole: "Administrator",
    emailLabel: "Institutional Email",
    passwordLabel: "Password",
    fullNameLabel: "Full Name",
    institutionLabel: "Institution Name",
    studentIdLabel: "Student ID Number",
    departmentLabel: "Department Name",
    signInBtn: "Sign In to examPaper",
    createAccountBtn: "Register Academic Account",
    demoProfiles: "Quick Sandbox Demo Profiles",
    logout: "Sign Out",
    welcome: "Welcome",

    refresh: "Refresh",
    close: "Close",
    cancel: "Cancel",
    save: "Save",
    submit: "Submit",
    loading: "Loading...",
    actions: "Actions",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    approved: "Approved",
    pending: "Pending Approval",
    rejected: "Rejected",

    accessibilityBtn: "Accessibility (Option ⌥ + A)",
    screenReaderTitle: "Screen Reader & macOS VoiceOver Controls",
    voiceSpeechAssistant: "Voice Speech Assistant",
    readAloudBtn: "Read Aloud (Option ⌥ + R)",
    stopBtn: "Stop",
    speechSpeed: "Speech Speed",
    textSize: "Text Sizing",
    standardSize: "Standard",
    largeSize: "Large (120%)",
    xlargeSize: "X-Large (140%)",
    highContrast: "High Contrast",
    themeLabel: "Color Theme",
    lightTheme: "Light Mode",
    darkTheme: "Dark Mode",
    on: "ON",
    off: "OFF",
    keyboardGuide: "Keyboard & Screen Reader Shortcuts",
    interfaceLanguage: "Interface Language",

    assignedExams: "Assigned Examinations",
    pastDiagnostics: "Past Session Diagnostics",
    enterExamRoom: "Enter Exam Room",
    accessPasswordRequired: "Access Password Required",
    enterRoomPassword: "Enter room security password",
    joinRoomBtn: "Join Examination",
    waitingForTeacherApproval: "Waiting for Educator Approval",
    approvalPendingDesc: "Your request to enter has been transmitted. Please wait while the educator approves your entry.",
    score: "Score",
    questionsCount: "Questions",
    timeLimit: "Time Limit",
    minutes: "min",
    aiDiagnosticReport: "AI Knowledge Diagnostic Report",

    examRoomsTab: "Examination Rooms",
    approvalLobbyTab: "Approval Waiting Lobby",
    activityDeckTab: "Real-time Activity Deck",
    analyticsTab: "Performance Analytics",
    createExamRoomBtn: "Create Examination Room",
    newRoomTitle: "Create New Examination Room",
    roomTitleLabel: "Room / Exam Title",
    subjectLabel: "Subject / Academic Discipline",
    passPercentageLabel: "Passing Threshold (%)",
    enableProctoring: "Enable AI Proctoring Protection",
    requirePassword: "Require Security Password",
    addQuestionBtn: "Add Question",
    approveStudent: "Approve Candidate",
    rejectStudent: "Reject Candidate",
    candidateName: "Candidate Name",
    liveStudentsCount: "Active Candidates",

    governancePanel: "Administrator Governance Panel",
    registeredAccounts: "Registered Accounts",
    activeRoomsCount: "Active Exam Rooms",
    totalSubmissionsCount: "Completed Submissions",
    userDirectory: "Platform Security Directories",
    suspendAccount: "Suspend",
    restoreAccount: "Restore",

    questionOf: "Question",
    pointsWeight: "Weight",
    readQuestionAloud: "Read Question Aloud (Alt+R)",
    timeRemaining: "Time Remaining",
    submitExam: "Submit Final Exam",
    autosaved: "Progress Auto-Saved",
    proctorActive: "Proctoring Active"
  },
  uz: {
    appName: "examPaper",
    tagline: "Sun'iy intellektga asoslangan akademik imtihon va bilim tahlili platformasi.",
    signIn: "Tizimga Kirish",
    register: "Ro'yxatdan O'tish",
    createAccount: "Hisob Yaratish",
    educationalCapacity: "Ta'lim Maqomi",
    studentRole: "Talaba",
    teacherRole: "O'qituvchi",
    adminRole: "Administrator",
    emailLabel: "Akademik Elektron Pochta",
    passwordLabel: "Parol",
    fullNameLabel: "To'liq Ism-Sharif",
    institutionLabel: "O'quv Muassasasi Nomi",
    studentIdLabel: "Talaba ID Raqami",
    departmentLabel: "Kafedra / Yo'nalish Nomi",
    signInBtn: "examPaper ga Kirish",
    createAccountBtn: "Akademik Hisob Yaratish",
    demoProfiles: "Tezkor Demo Profiler",
    logout: "Chiqish",
    welcome: "Xush kelibsiz",

    refresh: "Yangilash",
    close: "Yopish",
    cancel: "Bekor qilish",
    save: "Saqlash",
    submit: "Yuborish",
    loading: "Yuklanmoqda...",
    actions: "Amallar",
    status: "Holat",
    active: "Faol",
    inactive: "Nofaol",
    approved: "Tasdiqlangan",
    pending: "Kutilmoqda",
    rejected: "Rad etilgan",

    accessibilityBtn: "Maxsus imkoniyatlar (Option ⌥ + A)",
    screenReaderTitle: "Ekran o'quvchi va macOS VoiceOver sozlamalari",
    voiceSpeechAssistant: "Ovozli Yordamchi Tizim",
    readAloudBtn: "Ovozli O'qish (Option ⌥ + R)",
    stopBtn: "To'xtatish",
    speechSpeed: "O'qish tezligi",
    textSize: "Matn o'lchami",
    standardSize: "Standart",
    largeSize: "Katta (120%)",
    xlargeSize: "Juda Katta (140%)",
    highContrast: "Yuqori Kontrast",
    themeLabel: "Mavzu",
    lightTheme: "Yorug' rejim",
    darkTheme: "Qorong'u rejim",
    on: "YONIK",
    off: "O'CHIK",
    keyboardGuide: "Klaviatura va Ekran o'quvchi tugmalari",
    interfaceLanguage: "Tizim Tili",

    assignedExams: "Biriktirilgan Imtihonlar",
    pastDiagnostics: "O'tgan Imtihonlar Tarixi",
    enterExamRoom: "Imtihon Xonasiga Kirish",
    accessPasswordRequired: "Maxfiy Parol Talab Qilinadi",
    enterRoomPassword: "Xona xavfsizlik parolini kiriting",
    joinRoomBtn: "Imtihonga Kirish",
    waitingForTeacherApproval: "O'qituvchi Tasdig'i Kutilmoqda",
    approvalPendingDesc: "Kirish so'rovingiz yuborildi. O'qituvchi sizni imtihonga kiritishini kuting.",
    score: "Ball",
    questionsCount: "Savollar",
    timeLimit: "Vaqt Chegarasi",
    minutes: "daqiqa",
    aiDiagnosticReport: "AI Bilim Tahlili Hisoboti",

    examRoomsTab: "Imtihon Xonalari",
    approvalLobbyTab: "Tasdiqlash Kutish Xonasi",
    activityDeckTab: "Jonli Kuzatuv Paneli",
    analyticsTab: "Natijalar Tahlili",
    createExamRoomBtn: "Yangi Imtihon Xonasi Yaratish",
    newRoomTitle: "Yangi Imtihon Xonasini Sozlash",
    roomTitleLabel: "Imtihon / Fan Nomi",
    subjectLabel: "Akademik Fan",
    passPercentageLabel: "O'tish Bali (%)",
    enableProctoring: "AI Proktorlik Himoyasini Yoqish",
    requirePassword: "Parol Bilan Himoyalash",
    addQuestionBtn: "Savol Qo'shish",
    approveStudent: "Talabani Tasdiqlash",
    rejectStudent: "Talabani Rad Etish",
    candidateName: "Talaba Ismi",
    liveStudentsCount: "Faol Talabalar",

    governancePanel: "Administrator Boshqaruv Paneli",
    registeredAccounts: "Ro'yxatdan O'tgan Hisoblar",
    activeRoomsCount: "Faol Imtihon Xonalari",
    totalSubmissionsCount: "Tugallangan Imtihonlar",
    userDirectory: "Foydalanuvchilar Ro'yxati",
    suspendAccount: "Muzlatish",
    restoreAccount: "Tiklash",

    questionOf: "Savol",
    pointsWeight: "Ball",
    readQuestionAloud: "Savolni Ovozli O'qish (Alt+R)",
    timeRemaining: "Qolgan Vaqt",
    submitExam: "Imtihonni Yakunlash",
    autosaved: "Jarayon Avtomatik Saqlandi",
    proctorActive: "Proktorlik Yoqilgan"
  },
  ru: {
    appName: "examPaper",
    tagline: "Платформа академического тестирования и глубокой диагностики на базе ИИ.",
    signIn: "Вход в Систему",
    register: "Регистрация",
    createAccount: "Создать Аккаунт",
    educationalCapacity: "Категория",
    studentRole: "Студент",
    teacherRole: "Преподаватель / Профессор",
    adminRole: "Администратор",
    emailLabel: "Академическая Почта",
    passwordLabel: "Пароль",
    fullNameLabel: "Полное Имя (ФИО)",
    institutionLabel: "Учебное Заведение",
    studentIdLabel: "Номер Студенческого Билета",
    departmentLabel: "Кафедра / Факультет",
    signInBtn: "Войти в examPaper",
    createAccountBtn: "Зарегистрировать Аккаунт",
    demoProfiles: "Быстрый Вход в Демо-Профили",
    logout: "Выйти",
    welcome: "Добро пожаловать",

    refresh: "Обновить",
    close: "Закрыть",
    cancel: "Отмена",
    save: "Сохранить",
    submit: "Отправить",
    loading: "Загрузка...",
    actions: "Действия",
    status: "Статус",
    active: "Активен",
    inactive: "Неактивен",
    approved: "Одобрено",
    pending: "Ожидает Одобрения",
    rejected: "Отклонено",

    accessibilityBtn: "Специальные возможности (Option ⌥ + A)",
    screenReaderTitle: "Управление macOS VoiceOver и Диктором",
    voiceSpeechAssistant: "Голосовой Помощник",
    readAloudBtn: "Озвучить (Option ⌥ + R)",
    stopBtn: "Остановить",
    speechSpeed: "Скорость речи",
    textSize: "Размер текста",
    standardSize: "Стандартный",
    largeSize: "Крупный (120%)",
    xlargeSize: "Очень крупный (140%)",
    highContrast: "Высокая Контрастность",
    themeLabel: "Тема Оформления",
    lightTheme: "Светлый режим",
    darkTheme: "Тёмный режим",
    on: "ВКЛ",
    off: "ВЫКЛ",
    keyboardGuide: "Сочетания клавиш и экранный диктор",
    interfaceLanguage: "Язык Интерфейса",

    assignedExams: "Назначенные Экзамены",
    pastDiagnostics: "История Сессий и Диагностика",
    enterExamRoom: "Войти в Экзаменационный Зал",
    accessPasswordRequired: "Требуется Пароль Доступа",
    enterRoomPassword: "Введите пароль защиты экзамена",
    joinRoomBtn: "Приступить к Экзамену",
    waitingForTeacherApproval: "Ожидание Одобрения Преподавателя",
    approvalPendingDesc: "Запрос на вход отправлен. Пожалуйста, подождите, пока преподаватель подтвердит ваш доступ.",
    score: "Балл",
    questionsCount: "Вопросы",
    timeLimit: "Лимит Времени",
    minutes: "мин",
    aiDiagnosticReport: "Диагностический Отчет ИИ",

    examRoomsTab: "Экзаменационные Залы",
    approvalLobbyTab: "Зал Ожидания Допуска",
    activityDeckTab: "Мониторинг в Реальном Времени",
    analyticsTab: "Аналитика Успеваемости",
    createExamRoomBtn: "Создать Экзаменационный Зал",
    newRoomTitle: "Настройка Нового Экзамена",
    roomTitleLabel: "Название Экзамена / Дисциплины",
    subjectLabel: "Академический Предмет",
    passPercentageLabel: "Проходной Порог (%)",
    enableProctoring: "Включить Прокторинг ИИ",
    requirePassword: "Защитить Паролем",
    addQuestionBtn: "Добавить Вопрос",
    approveStudent: "Одобрить Студента",
    rejectStudent: "Отклонить Студента",
    candidateName: "Имя Кандидата",
    liveStudentsCount: "Активные Кандидаты",

    governancePanel: "Панель Административного Управления",
    registeredAccounts: "Зарегистрированные Аккаунты",
    activeRoomsCount: "Активные Экзамены",
    totalSubmissionsCount: "Завершенные Экзамены",
    userDirectory: "Реестр Пользователей",
    suspendAccount: "Заблокировать",
    restoreAccount: "Восстановить",

    questionOf: "Вопрос",
    pointsWeight: "Баллы",
    readQuestionAloud: "Озвучить Вопрос (Alt+R)",
    timeRemaining: "Оставшееся Время",
    submitExam: "Завершить Экзамен",
    autosaved: "Прогресс Сохранен",
    proctorActive: "Прокторинг Включен"
  }
};

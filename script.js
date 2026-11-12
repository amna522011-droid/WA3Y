
"use strict";

/* =========================================
   وَعْي | WA3Y
   Main JavaScript
========================================= */


/* =========================================
   1. HELPERS & ELEMENTS
========================================= */

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

const on = (element, event, callback) => {
    if (element) {
        element.addEventListener(event, callback);
    }
};

const TOTAL_LESSONS = 6;
const TOTAL_SCENARIOS = 3;
const STORAGE_KEY = "wa3yProgress";

const elements = {
    menuToggle: $("#menuToggle"),
    mainNav: $("#mainNav"),
    langToggle: $("#langToggle"),

    pages: $$(".page"),

    lessonsStat: $("#lessonsStat"),
    pointsStat: $("#pointsStat"),
    quizStat: $("#quizStat"),
    progressLabel: $("#progressLabel"),
    progressBar: $("#progressBar"),
    progressTrack: $("#progressTrack"),

    academyCompleted: $("#academyCompleted"),

    lessonViewer: $("#lessonViewer"),
    lessonLevel: $("#lessonLevel"),
    lessonTitle: $("#lessonTitle"),
    closeLesson: $("#closeLesson"),
    lessonContent: $("#lessonContent"),
    lessonQuiz: $("#lessonQuiz"),
    quizQuestion: $("#quizQuestion"),
    quizOptions: $("#quizOptions"),
    quizFeedback: $("#quizFeedback"),
    submitQuiz: $("#submitQuiz"),
    nextLesson: $("#nextLesson"),

    scenarioCount: $("#scenarioCount"),
    mailSubject: $("#mailSubject"),
    mailText: $("#mailText"),
    phishYes: $("#phishYes"),
    phishNo: $("#phishNo"),
    phishFeedback: $("#phishFeedback"),
    nextScenario: $("#nextScenario"),

    passwordInput: $("#passwordInput"),
    passwordToggle: $("#passwordToggle"),
    strengthBar: $("#strengthBar"),
    strengthLabel: $("#strengthLabel"),

    factProgressText: $("#factProgressText"),
    factProgress: $("#factProgress"),
    factProgressTrack: $("#factProgressTrack"),
    factReset: $("#factReset"),

    toast: $("#toast")
};


/* =========================================
   2. PROGRESS & LOCAL STORAGE
========================================= */

function createDefaultProgress() {
    return {
        lessons: [],
        quizCompleted: [],
        points: 0,
        phishingCompleted: [],
        currentScenarioIndex: 0
    };
}

function cleanNumberArray(value, maxValue) {
    if (!Array.isArray(value)) {
        return [];
    }

    return [...new Set(
        value
            .map(Number)
            .filter(number =>
                Number.isInteger(number) &&
                number >= 0 &&
                number < maxValue
            )
    )];
}

function loadProgress() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return createDefaultProgress();
        }

        const data = JSON.parse(saved);

        if (!data || typeof data !== "object") {
            return createDefaultProgress();
        }

        const lessons = cleanNumberArray(
            data.lessons,
            TOTAL_LESSONS
        );

        /*
         * توافق مع النسخة القديمة:
         * النسخة القديمة كانت لا تحفظ الاختبارات المكتملة
         * بشكل منفصل، لذلك نستخدم الدروس المكتملة كبداية.
         */

        const quizCompleted = Array.isArray(data.quizCompleted)
            ? cleanNumberArray(data.quizCompleted, TOTAL_LESSONS)
            : [...lessons];

        const points = Number(data.points);

        const currentScenarioIndex = Number(
            data.currentScenarioIndex
        );

        return {
            lessons,

            quizCompleted,

            points: Number.isFinite(points)
                ? Math.max(0, Math.floor(points))
                : 0,

            phishingCompleted: cleanNumberArray(
                data.phishingCompleted,
                TOTAL_SCENARIOS
            ),

            currentScenarioIndex:
                Number.isInteger(currentScenarioIndex)
                ? Math.min(
                    Math.max(currentScenarioIndex, 0),
                    TOTAL_SCENARIOS
                )
                : 0
        };

    } catch (error) {
        console.error("Error loading progress:", error);
        return createDefaultProgress();
    }
}

let progress = loadProgress();

function saveProgress() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(progress)
        );
    } catch (error) {
        console.error("Error saving progress:", error);
        showToast("تعذر حفظ التقدم على هذا الجهاز.");
    }
}


/* =========================================
   3. DASHBOARD
========================================= */

function updateDashboard() {
    const completedLessons = progress.lessons.length;
    const completedQuizzes = progress.quizCompleted.length;

    const percentage = Math.round(
        (completedLessons / TOTAL_LESSONS) * 100
    );

    if (elements.lessonsStat) {
        elements.lessonsStat.textContent = completedLessons;
    }

    if (elements.pointsStat) {
        elements.pointsStat.textContent = progress.points;
    }

    if (elements.quizStat) {
        elements.quizStat.textContent = completedQuizzes;
    }

    if (elements.progressLabel) {
        elements.progressLabel.textContent = `${percentage}%`;
    }

    if (elements.progressBar) {
        elements.progressBar.style.width = `${percentage}%`;
    }

    if (elements.progressTrack) {
        elements.progressTrack.setAttribute(
            "aria-valuenow",
            String(percentage)
        );
    }

    if (elements.academyCompleted) {
        elements.academyCompleted.textContent =
            `${completedLessons} / ${TOTAL_LESSONS}`;
    }

    updateCompletedLessonCards();
}

function updateCompletedLessonCards() {
    $$(".lesson-btn").forEach(button => {
        const lessonIndex = Number(button.dataset.lesson);
        const card = button.closest(".lesson-card");

        if (!card || !Number.isInteger(lessonIndex)) {
            return;
        }

        const completed = progress.lessons.includes(lessonIndex);

        card.classList.toggle("lesson-completed", completed);

        button.textContent = completed
            ? "إعادة الدرس"
            : "ابدأ الدرس";
    });
}


/* =========================================
   4. TOAST NOTIFICATIONS
========================================= */

let toastTimeout;

function showToast(message) {
    if (!elements.toast) {
        return;
    }

    elements.toast.textContent = message;
    elements.toast.hidden = false;

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        elements.toast.hidden = true;
    }, 2800);
}


/* =========================================
   5. PAGE NAVIGATION
========================================= */

function showPage(pageId) {
    const targetPage = document.getElementById(pageId);

    if (
        !targetPage ||
        !targetPage.classList.contains("page")
    ) {
        return;
    }

    elements.pages.forEach(page => {
        const isActive = page.id === pageId;

        page.classList.toggle("active", isActive);

        page.setAttribute(
            "aria-hidden",
            String(!isActive)
        );
    });

    $$("[data-page]").forEach(button => {
        const isActive = button.dataset.page === pageId;

        button.classList.toggle("active", isActive);

        if (button.matches(".nav-link")) {
            if (isActive) {
                button.setAttribute("aria-current", "page");
            } else {
                button.removeAttribute("aria-current");
            }
        }
    });

    elements.mainNav?.classList.remove("open");

    elements.menuToggle?.setAttribute(
        "aria-expanded",
        "false"
    );

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

$$("[data-page]").forEach(button => {
    on(button, "click", event => {
        event.preventDefault();
        showPage(button.dataset.page);
    });
});


/* =========================================
   6. MOBILE MENU
========================================= */

on(elements.menuToggle, "click", () => {
    if (!elements.mainNav) {
        return;
    }

    const isOpen = elements.mainNav.classList.toggle("open");

    elements.menuToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
    );
});

document.addEventListener("click", event => {
    if (!elements.mainNav || !elements.menuToggle) {
        return;
    }

    const clickedInsideMenu =
        elements.mainNav.contains(event.target) ||
        elements.menuToggle.contains(event.target);

    if (!clickedInsideMenu) {
        elements.mainNav.classList.remove("open");

        elements.menuToggle.setAttribute(
            "aria-expanded",
            "false"
        );
    }
});


/* =========================================
   7. LANGUAGE TOGGLE
========================================= */

/*
 * ملاحظة:
 * زر اللغة يترجم روابط القائمة فقط.
 * محتوى الدروس وباقي صفحات الموقع يظل بالعربية.
 * الترجمة الكاملة تحتاج نسخة إنجليزية لكل محتوى الموقع.
 */

let currentLanguage = "ar";

const navTranslations = {
    ar: [
        "الرئيسية",
        "لوحة التحكم",
        "الأكاديمية",
        "المختبر",
        "الخصوصية",
        "فحص الأخبار"
    ],

    en: [
        "Home",
        "Dashboard",
        "Academy",
        "Cyber Lab",
        "Privacy",
        "Fact Check"
    ]
};

function toggleLanguage() {
    const navLinks = $$(".nav-link");

    currentLanguage =
        currentLanguage === "ar" ? "en" : "ar";

    navLinks.forEach((link, index) => {
        const translation =
            navTranslations[currentLanguage][index];

        if (translation) {
            link.textContent = translation;
        }
    });

    document.documentElement.lang = currentLanguage;

    document.documentElement.dir =
        currentLanguage === "ar" ? "rtl" : "ltr";

    if (elements.langToggle) {
        elements.langToggle.textContent =
            currentLanguage === "ar" ? "EN" : "عربي";
    }

    showToast(
        currentLanguage === "en"
            ? "Navigation translated. The rest of the content remains Arabic."
            : "تمت إعادة القائمة للعربية. باقي المحتوى باللغة العربية."
    );
}

on(elements.langToggle, "click", toggleLanguage);


/* =========================================
   8. ACADEMY LESSONS
========================================= */

/*
 * ترتيب الدروس هنا مطابق لترتيب بطاقات HTML:
 *
 * 0 - مقدمة في الأمن الرقمي
 * 1 - التصيد الإلكتروني
 * 2 - كلمات المرور الآمنة
 * 3 - الخصوصية الرقمية
 * 4 - الأخبار المضللة
 * 5 - التصفح الآمن
 */

const lessons = [

    {
        title: "مقدمة في الأمن الرقمي",
        level: "المستوى الأول",

        content: `
            <h3>يعني إيه أمن رقمي؟</h3>

            <p>
                الأمن الرقمي هو مجموعة الممارسات والتقنيات
                التي تساعد على حماية الأجهزة والحسابات
                والشبكات والبيانات من الاختراق أو الاستخدام
                غير المصرح به.
            </p>

            <h3>إيه علاقته بحياتك اليومية؟</h3>

            <p>
                لما تستخدم حسابك على السوشيال ميديا،
                أو تلعب أونلاين، أو تشتري حاجة من الإنترنت،
                فأنت بتتعامل مع بيانات ومعلومات محتاجة حماية.
            </p>

            <h3>أهم أهداف الأمن الرقمي</h3>

            <ul>
                <li><strong>السرية:</strong> منع الأشخاص غير المصرح لهم من الوصول لمعلوماتك.</li>
                <li><strong>السلامة:</strong> الحفاظ على البيانات من التعديل أو التلف.</li>
                <li><strong>التوافر:</strong> ضمان الوصول للمعلومات والخدمات وقت الحاجة.</li>
            </ul>

            <div class="notice">
                الأمن الرقمي مش مسؤولية المتخصصين بس.
                كل شخص بيستخدم الإنترنت محتاج يعرف أساسيات حماية نفسه.
            </div>
        `,

        question: "ما المقصود بسرية المعلومات؟",

        options: [
            "إتاحة المعلومات للجميع",
            "منع الوصول غير المصرح به للمعلومات",
            "حذف المعلومات القديمة",
            "زيادة سرعة الإنترنت"
        ],

        answer: 1,

        explanation:
            "السرية تعني إن المعلومات تكون متاحة فقط للأشخاص المصرح لهم."
    },


    {
        title: "التصيد الإلكتروني",
        level: "المستوى الأول",

        content: `
            <h3>ما هو التصيد الإلكتروني؟</h3>

            <p>
                التصيد الإلكتروني هو محاولة خداعك برسالة أو رابط
                أو صفحة مزيفة للحصول على كلمة المرور أو بياناتك
                الشخصية أو معلوماتك المالية.
            </p>

            <h3>ممكن يظهر فين؟</h3>

            <ul>
                <li>رسالة بتقول إن حساب اللعبة هيتقفل لو ما ضغطتش على الرابط.</li>
                <li>حساب مزيف بيبعتلك جائزة ويطلب بياناتك.</li>
                <li>رسالة بتنتحل صفة منصة تواصل اجتماعي.</li>
                <li>رابط بيوعدك بمتابعين أو عملات مجانية داخل لعبة.</li>
            </ul>

            <h3>علامات الرسالة المشبوهة</h3>

            <ul>
                <li>استعجالك لاتخاذ قرار فوري.</li>
                <li>وعدك بجائزة غير منطقية.</li>
                <li>طلب كلمة المرور أو رمز التحقق.</li>
                <li>رابط عنوانه مختلف عن الموقع الرسمي.</li>
            </ul>

            <div class="notice">
                لو وصلك رابط غريب، ما تضغطش عليه.
                افتح التطبيق أو الموقع الرسمي بنفسك وتحقق من حسابك.
            </div>
        `,

        question: "وصلك رابط بيقول إنك كسبت عملات مجانية في لعبتك المفضلة، وبيطلب كلمة المرور. تعمل إيه؟",

        options: [
            "أدخل كلمة المرور بسرعة",
            "أبعت الرابط لأصحابي",
            "أتجاهل الرابط وأتحقق من الموقع الرسمي",
            "أرسل رمز التحقق لصاحب الرسالة"
        ],

        answer: 2,

        explanation:
            "العروض المجانية المشبوهة وطلب كلمات المرور من علامات التصيد. تحقق دائمًا من المصدر الرسمي."
    },


    {
        title: "كلمات المرور الآمنة",
        level: "المستوى الأول",

        content: `
            <h3>ليه كلمة المرور مهمة؟</h3>

            <p>
                كلمة المرور بتحمي حساباتك، سواء حساب الألعاب
                أو البريد الإلكتروني أو حسابات التواصل الاجتماعي.
                ولو كانت سهلة التخمين، ممكن تعرض حسابك للخطر.
            </p>

            <h3>إزاي تنشئ كلمة مرور أفضل؟</h3>

            <ul>
                <li>استخدم كلمة مرور طويلة وفريدة لكل حساب.</li>
                <li>تجنب اسمك وتاريخ ميلادك ورقم هاتفك.</li>
                <li>لا تستخدم كلمات شائعة أو متوقعة.</li>
                <li>لا تعيد استخدام نفس كلمة المرور في مواقع مختلفة.</li>
                <li>استخدم مدير كلمات مرور موثوقًا عند الحاجة.</li>
            </ul>

            <h3>المصادقة الثنائية</h3>

            <p>
                المصادقة الثنائية بتضيف خطوة تحقق إضافية
                عند تسجيل الدخول، وده بيساعد على حماية الحساب
                حتى لو كلمة المرور اتعرفت.
            </p>

            <div class="notice">
                لا تشارك كلمة مرورك أو رمز التحقق مع أي شخص،
                حتى لو قال إنه من الدعم الفني.
            </div>
        `,

        question: "أي اختيار يعتبر أفضل لكلمة مرور آمنة؟",

        options: [
            "12345678",
            "تاريخ ميلادك",
            "كلمة طويلة وفريدة يصعب تخمينها",
            "اسمك ورقم هاتفك"
        ],

        answer: 2,

        explanation:
            "كلمة المرور الطويلة والفريدة أصعب في التخمين، والأفضل أن تكون مختلفة لكل حساب."
    },


    {
        title: "الخصوصية الرقمية",
        level: "المستوى الثاني",

        content: `
            <h3>ما البيانات الشخصية؟</h3>

            <p>
                هي المعلومات التي يمكن استخدامها للتعرف عليك،
                مثل اسمك الكامل ورقم هاتفك وصورك وموقعك
                ومعلوماتك الخاصة.
            </p>

            <h3>خلي بالك من اللي بتشاركه</h3>

            <ul>
                <li>تجنب نشر عنوان منزلك أو موقعك المباشر.</li>
                <li>راجع إعدادات الخصوصية في حساباتك.</li>
                <li>لا تقبل طلبات الصداقة من حسابات مجهولة لمجرد الفضول.</li>
                <li>راجع صلاحيات التطبيقات قبل الموافقة عليها.</li>
                <li>فكر قبل نشر صورك أو صور الآخرين.</li>
            </ul>

            <h3>لو حد طلب منك معلومات خاصة؟</h3>

            <p>
                مش لازم ترد أو تشارك أي بيانات.
                ولو الطلب مريب أو فيه ضغط أو تهديد،
                احتفظ بالدليل واطلب مساعدة شخص بالغ موثوق.
            </p>

            <div class="notice">
                قبل نشر أي معلومة، اسأل نفسك:
                هل أنا مرتاح إن المعلومة دي تكون متاحة للآخرين؟
            </div>
        `,

        question: "ما التصرف الأفضل لو تطبيق طلب صلاحية للوصول لموقعك بدون سبب واضح؟",

        options: [
            "أوافق على كل الصلاحيات",
            "أراجع سبب الطلب وأرفض الصلاحية غير الضرورية",
            "أرسل موقعي لأصدقائي",
            "أشارك كلمة المرور مع التطبيق"
        ],

        answer: 1,

        explanation:
            "راجع الصلاحيات واسمح فقط بما يحتاجه التطبيق فعلًا لأداء وظيفته."
    },


    {
        title: "الأخبار المضللة",
        level: "المستوى الثاني",

        content: `
            <h3>ما خطورة الأخبار المضللة؟</h3>

            <p>
                المعلومات غير الصحيحة ممكن تنتشر بسرعة،
                وتؤثر على قرارات الناس وتسبب خوفًا أو ارتباكًا.
            </p>

            <h3>خطوات التحقق من أي خبر</h3>

            <ul>
                <li>تأكد من اسم المصدر وسمعته.</li>
                <li>ابحث عن الخبر في أكثر من مصدر مستقل.</li>
                <li>راجع تاريخ النشر والسياق.</li>
                <li>تحقق من الصور والفيديوهات ومصدرها الأصلي.</li>
                <li>اقرأ الخبر كاملًا، وليس العنوان فقط.</li>
            </ul>

            <h3>خلي بالك من العناوين المثيرة</h3>

            <p>
                بعض العناوين تُكتب بهدف جذب الانتباه
                أو إثارة الخوف والغضب، وليس نقل المعلومة بدقة.
            </p>

            <div class="notice">
                قبل ما تشارك خبرًا، تحقق منه.
                سرعة المشاركة مش أهم من صحة المعلومة.
            </div>
        `,

        question: "وصلك خبر صادم على مجموعة أصدقائك، ومفيش مصدر واضح. تعمل إيه؟",

        options: [
            "أشاركه فورًا",
            "أصدقه بسبب عدد المشاركات",
            "أبحث عن مصدر موثوق وأتحقق من التاريخ",
            "أحكم عليه من العنوان فقط"
        ],

        answer: 2,

        explanation:
            "التحقق من المصدر والتاريخ ومقارنة الخبر بمصادر مستقلة يساعدك على تقييم صحته."
    },


    {
        title: "التصفح الآمن",
        level: "المستوى الثالث",

        content: `
            <h3>إيه مخاطر التصفح غير الآمن؟</h3>

            <p>
                ممكن تتعرض لصفحات مزيفة أو ملفات ضارة
                أو محاولات سرقة بياناتك أثناء استخدام الإنترنت.
            </p>

            <h3>قواعد التصفح الآمن</h3>

            <ul>
                <li>تأكد من عنوان الموقع قبل إدخال أي بيانات.</li>
                <li>حمّل التطبيقات من المتاجر والمصادر الرسمية.</li>
                <li>لا تفتح الملفات المجهولة.</li>
                <li>حدّث نظام التشغيل والتطبيقات باستمرار.</li>
                <li>تجنب إدخال بيانات حساسة على شبكات عامة غير موثوقة.</li>
            </ul>

            <h3>هل علامة القفل تعني أن الموقع آمن؟</h3>

            <p>
                علامة القفل وHTTPS تعني أن الاتصال بالموقع مشفر،
                لكنها لا تضمن أن الموقع نفسه موثوق.
                ممكن موقع احتيالي يستخدم HTTPS أيضًا.
            </p>

            <div class="notice">
                راجع عنوان الموقع كاملًا، ولا تعتمد على شكل الصفحة
                أو علامة القفل وحدها.
            </div>
        `,

        question: "ما التصرف الأفضل قبل تحميل لعبة من رابط وصلك في رسالة؟",

        options: [
            "أحملها فورًا",
            "أرسل الرابط لكل أصدقائي",
            "أبحث عن اللعبة في المتجر الرسمي",
            "أعطل حماية الجهاز"
        ],

        answer: 2,

        explanation:
            "التحميل من المتاجر والمصادر الرسمية يقلل خطر تثبيت تطبيقات مزيفة أو ضارة."
    }

];


/* =========================================
   9. LESSON VIEWER
========================================= */

let currentLessonIndex = null;
let selectedAnswer = null;
let lessonAnswered = false;

function openLesson(index) {
    if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= lessons.length
    ) {
        return;
    }

    const lesson = lessons[index];

    currentLessonIndex = index;
    selectedAnswer = null;
    lessonAnswered = false;

    if (elements.lessonLevel) {
        elements.lessonLevel.textContent = lesson.level;
    }

    if (elements.lessonTitle) {
        elements.lessonTitle.textContent = lesson.title;
    }

    /*
     * المحتوى هنا ثابت ومكتوب داخل مصفوفة الدروس،
     * وليس مدخلًا من المستخدم.
     */

    if (elements.lessonContent) {
        elements.lessonContent.innerHTML = lesson.content;
    }

    if (elements.quizQuestion) {
        elements.quizQuestion.textContent = lesson.question;
    }

    if (elements.quizFeedback) {
        elements.quizFeedback.textContent = "";
        elements.quizFeedback.className = "";
        elements.quizFeedback.hidden = true;
    }

    if (elements.submitQuiz) {
        elements.submitQuiz.hidden = false;
        elements.submitQuiz.disabled = false;
    }

    if (elements.nextLesson) {
        elements.nextLesson.hidden = true;
    }

    if (elements.lessonQuiz) {
        elements.lessonQuiz.hidden = false;
    }

    if (elements.lessonViewer) {
        elements.lessonViewer.hidden = false;
    }

    renderQuizOptions(index);

    elements.lessonViewer?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function renderQuizOptions(index) {
    if (!elements.quizOptions) {
        return;
    }

    const lesson = lessons[index];

    elements.quizOptions.replaceChildren();

    lesson.options.forEach((option, optionIndex) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "quiz-option";
        button.textContent = option;

        button.addEventListener("click", () => {
            if (lessonAnswered) {
                return;
            }

            selectedAnswer = optionIndex;

            $$(".quiz-option", elements.quizOptions).forEach(item => {
                item.classList.remove("selected");
            });

            button.classList.add("selected");
        });

        elements.quizOptions.appendChild(button);
    });
}

function closeLesson() {
    if (elements.lessonViewer) {
        elements.lessonViewer.hidden = true;
    }

    currentLessonIndex = null;
    selectedAnswer = null;
    lessonAnswered = false;
}

$$(".lesson-btn").forEach(button => {
    on(button, "click", () => {
        const index = Number(button.dataset.lesson);
        openLesson(index);
    });
});

on(elements.closeLesson, "click", closeLesson);


/* =========================================
   10. QUIZ ANSWER CHECKING
========================================= */

function submitLessonAnswer() {
    if (
        currentLessonIndex === null ||
        lessonAnswered
    ) {
        return;
    }

    if (selectedAnswer === null) {
        showToast("اختاري إجابة الأول.");
        return;
    }

    const lesson = lessons[currentLessonIndex];

    const isCorrect =
        selectedAnswer === lesson.answer;

    const optionButtons = $$(".quiz-option", elements.quizOptions);

    if (isCorrect) {
        optionButtons.forEach((button, index) => {
            button.disabled = true;

            if (index === lesson.answer) {
                button.classList.add("correct");
            }
        });

        lessonAnswered = true;

        const alreadyCompleted =
            progress.lessons.includes(currentLessonIndex);

        const quizAlreadyCompleted =
            progress.quizCompleted.includes(currentLessonIndex);

        if (!alreadyCompleted) {
            progress.lessons.push(currentLessonIndex);
            progress.points += 10;
        }

        if (!quizAlreadyCompleted) {
            progress.quizCompleted.push(currentLessonIndex);
        }

        saveProgress();
        updateDashboard();

        showQuizFeedback(
            `إجابة صحيحة! ${lesson.explanation}`,
            true
        );

        showToast(
            alreadyCompleted
                ? "إجابة صحيحة! الدرس مكتمل بالفعل."
                : "ممتاز! حصلتِ على 10 نقاط."
        );

        if (elements.submitQuiz) {
            elements.submitQuiz.hidden = true;
        }

        if (elements.nextLesson) {
            elements.nextLesson.hidden = false;

            elements.nextLesson.textContent =
                currentLessonIndex === TOTAL_LESSONS - 1
                    ? "إنهاء الأكاديمية"
                    : "الدرس التالي";
        }

    } else {
        optionButtons.forEach((button, index) => {
            if (index === selectedAnswer) {
                button.classList.add("wrong");
            }

            if (index === lesson.answer) {
                button.classList.add("correct");
            }
        });

        showQuizFeedback(
            `الإجابة مش صحيحة. ${lesson.explanation}`,
            false
        );

        showToast("راجعي الدرس واختاري إجابة تانية.");

        /*
         * السماح بإعادة المحاولة.
         * لا يتم إنهاء السؤال عند الإجابة الخاطئة.
         */

        selectedAnswer = null;

        optionButtons.forEach(button => {
            button.disabled = false;
            button.classList.remove("selected");
        });
    }
}

function showQuizFeedback(message, isCorrect) {
    if (!elements.quizFeedback) {
        return;
    }

    elements.quizFeedback.textContent = message;

    elements.quizFeedback.className =
        isCorrect ? "feedback correct" : "feedback wrong";

    elements.quizFeedback.hidden = false;
}

on(elements.submitQuiz, "click", submitLessonAnswer);

on(elements.nextLesson, "click", () => {
    if (
        currentLessonIndex === null ||
        !lessonAnswered
    ) {
        return;
    }

    if (currentLessonIndex < TOTAL_LESSONS - 1) {
        openLesson(currentLessonIndex + 1);
    } else {
        closeLesson();

        showToast("مبروك! خلصتِ جميع دروس الأكاديمية.");

        updateDashboard();
    }
});


/* =========================================
   11. PHISHING SIMULATION
========================================= */

const scenarios = [

    {
        subject: "تنبيه عاجل: حسابك في اللعبة هيتقفل!",

        text: `
مرحبًا باللاعب،

تم رصد مشكلة في حسابك.
اضغط على الرابط المرفق وأدخل كلمة المرور
ورمز التحقق خلال 15 دقيقة لتجنب إيقاف الحساب.

فريق الدعم
        `,

        isPhishing: true,

        explanation:
            "الرسالة بتستخدم التخويف والاستعجال وبتطلب كلمة المرور ورمز التحقق. دي علامات واضحة للتصيد."
    },

    {
        subject: "تحديث جديد متاح للتطبيق",

        text: `
مرحبًا،

يتوفر إصدار جديد من التطبيق.
يمكنك فتح متجر التطبيقات الرسمي على جهازك
والبحث عن اسم التطبيق للتحقق من التحديث.

شكرًا لاستخدامك خدمتنا.
        `,

        isPhishing: false,

        explanation:
            "الرسالة بتوجهك للمتجر الرسمي بدل طلب بياناتك أو الضغط على رابط مجهول. ومع ذلك، تحقق دائمًا من مصدر الرسالة."
    },

    {
        subject: "مبروك! ربحت جائزة وعملات مجانية!",

        text: `
تهانينا!

تم اختيار حسابك للفوز بجائزة.
للحصول عليها، أرسل كلمة المرور
ورمز التحقق الذي وصلك على هاتفك.

العرض ينتهي خلال دقائق!
        `,

        isPhishing: true,

        explanation:
            "طلب كلمة المرور ورمز التحقق مقابل جائزة علامة خطيرة جدًا على الاحتيال. لا تشارك الرموز مع أي شخص."
    }

];

let currentScenarioIndex =
    progress.currentScenarioIndex;

let scenarioAnswered = false;

function saveScenarioProgress() {
    progress.currentScenarioIndex =
        currentScenarioIndex;

    saveProgress();
}

function loadScenario() {
    if (!elements.mailSubject || !elements.mailText) {
        return;
    }

    if (currentScenarioIndex >= scenarios.length) {
        elements.mailSubject.textContent = "انتهت المحاكاة";

        elements.mailText.textContent =
            "أحسنت! انتهت جميع سيناريوهات محاكاة التصيد.";

        if (elements.scenarioCount) {
            elements.scenarioCount.textContent =
                `${TOTAL_SCENARIOS} / ${TOTAL_SCENARIOS}`;
        }

        if (elements.phishYes) {
            elements.phishYes.disabled = true;
        }

        if (elements.phishNo) {
            elements.phishNo.disabled = true;
        }

        if (elements.nextScenario) {
            elements.nextScenario.hidden = true;
        }

        if (elements.phishFeedback) {
            elements.phishFeedback.hidden = false;
            elements.phishFeedback.className = "feedback correct";
            elements.phishFeedback.textContent =
                "انتهت جميع السيناريوهات. تذكر دائمًا التحقق من مصدر الرسالة قبل الضغط على أي رابط.";
        }

        return;
    }

    const scenario = scenarios[currentScenarioIndex];

    scenarioAnswered = false;

    elements.mailSubject.textContent = scenario.subject;
    elements.mailText.textContent = scenario.text;

    if (elements.scenarioCount) {
        elements.scenarioCount.textContent =
            `السيناريو ${currentScenarioIndex + 1} من ${TOTAL_SCENARIOS}`;
    }

    if (elements.phishFeedback) {
        elements.phishFeedback.textContent = "";
        elements.phishFeedback.className = "";
        elements.phishFeedback.hidden = true;
    }

    if (elements.phishYes) {
        elements.phishYes.disabled = false;
    }

    if (elements.phishNo) {
        elements.phishNo.disabled = false;
    }

    if (elements.nextScenario) {
        elements.nextScenario.hidden = true;

        elements.nextScenario.textContent =
            currentScenarioIndex === TOTAL_SCENARIOS - 1
                ? "إنهاء المحاكاة"
                : "السيناريو التالي";
    }
}

function answerScenario(userSaysPhishing) {
    if (scenarioAnswered) {
        return;
    }

    const scenario = scenarios[currentScenarioIndex];

    if (!scenario) {
        return;
    }

    scenarioAnswered = true;

    const isCorrect =
        userSaysPhishing === scenario.isPhishing;

    if (elements.phishYes) {
        elements.phishYes.disabled = true;
    }

    if (elements.phishNo) {
        elements.phishNo.disabled = true;
    }

    if (isCorrect) {
        const alreadyCompleted =
            progress.phishingCompleted.includes(currentScenarioIndex);

        if (!alreadyCompleted) {
            progress.phishingCompleted.push(currentScenarioIndex);
            progress.points += 5;
        }

        saveProgress();
        updateDashboard();

        showPhishingFeedback(
            `إجابة صحيحة! ${scenario.explanation}`,
            true
        );

        showToast(
            alreadyCompleted
                ? "إجابة صحيحة!"
                : "ممتاز! حصلتِ على 5 نقاط."
        );

    } else {
        showPhishingFeedback(
            `إجابة غير صحيحة. ${scenario.explanation}`,
            false
        );

        showToast("راجعي علامات التصيد قبل الانتقال.");
    }

    if (elements.nextScenario) {
        elements.nextScenario.hidden = false;
    }
}

function showPhishingFeedback(message, isCorrect) {
    if (!elements.phishFeedback) {
        return;
    }

    elements.phishFeedback.textContent = message;

    elements.phishFeedback.className =
        isCorrect ? "feedback correct" : "feedback wrong";

    elements.phishFeedback.hidden = false;
}

on(elements.phishYes, "click", () => {
    answerScenario(true);
});

on(elements.phishNo, "click", () => {
    answerScenario(false);
});

on(elements.nextScenario, "click", () => {
    if (!scenarioAnswered) {
        return;
    }

    currentScenarioIndex++;

    saveScenarioProgress();

    loadScenario();

    if (currentScenarioIndex >= TOTAL_SCENARIOS) {
        showToast("انتهت محاكاة التصيد. أحسنتِ!");
    }
});


/* =========================================
   12. PASSWORD STRENGTH CHECKER
========================================= */

/*
 * هذا الفاحص تعليمي وتقريبي فقط.
 * لا يقيس قوة كلمة المرور الحقيقية بشكل احترافي.
 * كلمة المرور لا تُحفظ في Local Storage.
 * الفحص يتم داخل المتصفح.
 */

const commonPasswords = [
    "password",
    "password123",
    "123456",
    "12345678",
    "qwerty",
    "admin",
    "letmein",
    "iloveyou",
    "welcome"
];

function checkPasswordStrength(password) {
    const characters = Array.from(password);

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasArabic = /[\u0600-\u06FF]/.test(password);
    const hasNumber = /\p{N}/u.test(password);
    const hasSymbol = /[^\p{L}\p{N}\s]/u.test(password);

    const hasLetterVariety =
        (hasLower && hasUpper) ||
        (hasArabic && (hasLower || hasUpper)) ||
        (hasArabic && hasNumber);

    const isCommon = commonPasswords.includes(
        password.toLowerCase()
    );

    const checks = {
        length: characters.length >= 12,

        variety: hasLetterVariety,

        number: hasNumber,

        symbol: hasSymbol,

        unique: password.length > 0 && !isCommon
    };

    let score = Object.values(checks)
        .filter(Boolean).length;

    if (isCommon) {
        score = 0;
    }

    return {
        checks,
        score,
        percentage: score * 20,
        isCommon
    };
}

function updatePasswordChecker() {
    if (!elements.passwordInput) {
        return;
    }

    const password = elements.passwordInput.value;

    const result = checkPasswordStrength(password);

    Object.entries(result.checks).forEach(([name, passed]) => {
        const requirement = $(`[data-check="${name}"]`);

        if (requirement) {
            requirement.classList.toggle("valid", passed);
        }
    });

    const labels = [
        "ضعيفة جدًا",
        "ضعيفة",
        "متوسطة",
        "جيدة",
        "أفضل نسبيًا",
        "ممتازة وفق المؤشرات"
    ];

    const colors = [
        "#ff647c",
        "#ff647c",
        "#ffc76b",
        "#ffc76b",
        "#4d9fff",
        "#35d49a"
    ];

    if (elements.strengthBar) {
        elements.strengthBar.style.width =
            `${result.percentage}%`;

        elements.strengthBar.style.backgroundColor =
            colors[result.score];
    }

    if (elements.strengthLabel) {
        if (password.length === 0) {
            elements.strengthLabel.textContent =
                "لم يتم الإدخال";

            elements.strengthLabel.style.color =
                "var(--text-muted)";

        } else if (result.isCommon) {
            elements.strengthLabel.textContent =
                "كلمة مرور شائعة وسهلة التخمين";

            elements.strengthLabel.style.color =
                "var(--danger)";

        } else {
            elements.strengthLabel.textContent =
                labels[result.score];

            elements.strengthLabel.style.color =
                colors[result.score];
        }
    }
}

on(
    elements.passwordInput,
    "input",
    updatePasswordChecker
);

on(elements.passwordToggle, "click", () => {
    if (!elements.passwordInput) {
        return;
    }

    const isPassword =
        elements.passwordInput.type === "password";

    elements.passwordInput.type =
        isPassword ? "text" : "password";

    elements.passwordToggle.textContent =
        isPassword ? "إخفاء" : "إظهار";

    elements.passwordToggle.setAttribute(
        "aria-pressed",
        String(isPassword)
    );

    elements.passwordToggle.setAttribute(
        "aria-label",
        isPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
    );
});


/* =========================================
   13. FACT CHECK CHECKLIST
========================================= */

function updateFactProgress() {
    const checkboxes = $$(
        '.fact-check input[type="checkbox"]'
    );

    if (!checkboxes.length) {
        return;
    }

    const checkedCount = checkboxes.filter(
        checkbox => checkbox.checked
    ).length;

    const total = checkboxes.length;

    const percentage = Math.round(
        (checkedCount / total) * 100
    );

    if (elements.factProgress) {
        elements.factProgress.style.width =
            `${percentage}%`;
    }

    if (elements.factProgressText) {
        elements.factProgressText.textContent =
            `${checkedCount} / ${total}`;
    }

    if (elements.factProgressTrack) {
        elements.factProgressTrack.setAttribute(
            "aria-valuenow",
            String(checkedCount)
        );
    }
}

$$('.fact-check input[type="checkbox"]').forEach(checkbox => {
    on(checkbox, "change", updateFactProgress);
});

on(elements.factReset, "click", () => {
    $$('.fact-check input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    updateFactProgress();

    showToast("تم إعادة ضبط قائمة التحقق.");
});


/* =========================================
   14. INITIALIZATION
========================================= */

function initializeApp() {
    updateDashboard();

    closeLesson();

    currentScenarioIndex =
        progress.currentScenarioIndex;

    loadScenario();

    updatePasswordChecker();

    updateFactProgress();

    showPage("home");
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeApp,
        { once: true }
    );
} else {
    initializeApp();
}

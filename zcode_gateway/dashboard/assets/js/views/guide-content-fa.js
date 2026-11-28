// نسخه فارسی (محاوره‌ای) راهنمای کاربری. ساختار دقیقاً مثل guide-content.js هست.
export const GUIDE = [
  { id: "start", title: "از اینجا شروع کن", desc: "اول یه برنامه متصل‌شده سالم داشته باش، بعد گزینه‌های پیش‌فرض رو تنظیم کن.", route: "server", items: [
    { title: "اولین درخواست موفق", tags: "setup quickstart client API", steps: [
      "برو تو بخش حساب‌ها، «ورود به Zcode» رو بزن. اگه خروجی گرفتن از حساب قابل اعتمادی داری، «وارد کردن حساب» رو استفاده کن. مطمئن شو حداقل یه اکانت با سهمیه قابل استفاده برای مدل مورد نظرت داری.",
      "برو تو بخش سرور. آدرس آدرس اصلی API و یه کلید دسترسی برنامه کپی کن و ببر توی اپلیکیشن OpenAI-compat یا Anthropic-compat خودت. از 0.0.0.0 به عنوان مقصد استفاده نکن.",
      "یه مدل ID از لیست بخش مدل‌ها انتخاب کن. یه درخواست کوتاه بفرست، بعد بیا تو بخش آمار و لاگ‌ها چک کن. بعضی مدل‌ها ممکنه به یه سرور واسطه برای شبکه‌ت نیاز داشته باشن؛ سرور واسطه نصب اختیاریه، شرط شروع کار نیست.",
    ] },
    { title: "Windows exe در برابر Linux VPS", tags: "platform install headless display", steps: [
      "Windows لانچر دسکتاپ و مرورگرهای قابل‌مشاهده رو اجرا میکنه. وارد کردن از اپ فقط وقتی کار میکنه که یه store اطلاعات ورود Zcode روی همین دستگاه وجود داشته باشه.",
      "Linux VPS درگاه رو به عنوان سرویس اجرا میکنه و اگه دسکتاپ نباشه، از headed Chromium روی یه Xvfb خصوصی استفاده میکنه. تو SSH هیچ پنجره مرورگرایی نیست که ببینی. کد امنیتی دستی نیاز به یه دسکتاپ واقعی داره.",
      "پیش‌فرضهای Linux تازه‌نصب فقط بررسی‌کننده هوش مصنوعی رو برای کد امنیتی و مدل بررسی‌کننده هوش مصنوعی استفاده میکنن. انتخاب‌های ذخیره‌شده داشبورد و تنظیمات موجود جایگزین میشن. پیش‌فرضهای Windows تغییر نمیکنن.",
    ] },
    { title: "کلید درست رو استفاده کن", tags: "admin password login client authorization bearer", steps: [
      "Admin key داشبورد و ایندهای اداری قوی رو باز میکنه. Client key فقط برای احراز هویت ریکвест‌های مدل. هرگز admin key رو به یه اپلیکیشن برنامه متصل‌شده نداده مگر اینکه واقعاً اون دسترسی بیشتر رو بخوای بدی.",
      "فیلد ورود انتظار admin key رو داره، نه sudo password، نه Cloudflare token، نه inbox secret، نه account JWT. برای دسترسی ریموت حتماً HTTPS استفاده کن.",
      "کلیدها تو بخش سرور و گزارش installer خصوصی نمایش داده میشن. تو Linux، `sudo autozcoder info` اطلاعات ورود رو نشون میده؛ خروجی‌ش رو تو لاگ‌های عمومی یا پیام‌های پشتیبانی وارد کردن نکن.",
    ] },
  ] },
  { id: "accounts", title: "حساب‌ها و اشتراک‌گذاری", desc: "بفهم چه چیزی ذخیره میشه، چه چیزی بررسی دوباره میشه، و اشتراک‌گذاری چه دسترسی میده.", route: "accounts", items: [
    { title: "ورود، وارد کردن، و خروجی گرفتن", tags: "JWT copy friend transfer Imported clipboard", steps: [
      "«ورود به Zcode» صفحه تأیید سرویس رو باز میکنه. تأیید رو تکمیل کن و برگرد. تأیید مرورگر رو میتونی روی کامپیوتر خودت انجام بدی حتی اگه درگاه روی VPS باشه.",
      "برای اشتراک‌گذاری یه اکانت، اکشن «کپی اکانت برای اشتراک‌گذاری» رو بزن و هشدار رو تأیید کن. رفیقت متن کپی‌شده رو تو بخش حساب‌ها > وارد کردن حساب > «والیدیت و وارد کردن» وارد می‌کنه. یه JWT خام Zcode CLI هم قبول میشه؛ label ایمیلیش اختیاریه.",
      "مقصد قبل از ذخیره اطلاعات ورود رو با Zcode چک میکنه. اگه account ID همون باشه، entry موجود آپدیت میشه. badge «Imported» بعد از راه‌اندازی دوباره هم میمونه.",
      "خروجی گرفتن شامل access token فعلی و metadata account/label/devic هست، نه admin key درگاه، mail secret، اکانت‌های دیگه، یا renewal دسترسی. متن ساده‌ست: هرکی ازش خبر داره میتونه اکانت رو استفاده کنه. هر دو نصب سهمیه، محدودیت‌های سرویس و concurrent usage رو مشترک دارن؛ اشتراک‌گذاری مجوز استفاده رو دو برابر نمیکنه.",
    ] },
    { title: "بررسی دوباره سهمیه ≠ نوان توکن", tags: "expiry long-lived revoked refresh JWT authentication", steps: [
      "داشبورد منظم plans، سهمیه و status رو بررسی دوباره میکنه. این یه access token جدید صادر نمیکنه. «انقضای اعلام‌نشده» یعنی JWT timestamp انقضای نداره، نه اینکه همیشگیه.",
      "«بررسی دوباره سهمیه» فقط read-only billing check انجام میده. اکشن بررسی دوباره هر اکانت اطلاعات ورودs ذخیره‌شده رو دوباره میخونه و میتونه توکن جدیدتر رو adopt کنه. «بارگذاری دوباره پول» account sourceها رو دوباره میخونه؛ اکانت‌های تغییر‌نکرده ممکنه داده‌های runtime فعلی‌شون رو حفظ کنن.",
      "اگه توکن انقضا کرده یا revoke شده و توکن جدیدتری ذخیره نشده، دوباره «ورود به Zcode» بزن یا یه خروجی گرفتن تازه وارد کردن کن. در حال حاضر هیچ unattended CLI-token renewal دسترسی پیاده‌سازی نشده.",
    ] },
    { title: "موقعیت، cap و پنجره دسترسی رو بخون", tags: "آماده در حال استراحت از کار افتاده capped starts reset plan مجوز استفاده", steps: [
      "«Ready» یعنی در سطح pool واجد شرایطه، نه اینکه هر مدل در دسترسه. یه model-specific cap میتونه کنار state آماده باشه. «Cooling» موقته؛ «از کار افتاده» یعنی اکانت الان نمیشه به‌طور عادی سرویس بده.",
      "سهمیه روزانه per-modele. سهمیه باقی‌مانده زنده دسترسیهای آینده رو شامل نمیشه (آنها جدا track میشن)؛ یه دسترسی آینده balance قابل استفاده فعلی رو بلاک نمیکنه. زمان reset و پایان plan با هم فرق دارن؛ حتماً زمان start/reset نمایشی رو چک کن.",
      "یه سهمیه check ناموفق خطا نشون میده و آخرین مقادیر رو نگه میداره. ممکنه قدیمی باشن. «بررسی دوباره سهمیه» رو بزن برای تکرار؛ اگه همچنان مشکل داره، لاگ‌ها رو ببین. «صفر bucket بعد از check موفق» با «checkی که هیچ‌وقت موفق نبوده» فرق داره.",
      "«فعال‌سازی» واجد شرایطی رو برمی‌گردونه ولی سهمیه نسازن، توکن revoke‌شده رو ترمیم نمیکنه، و محدودیت سرویس رو حذف نمیکنه. «Runs» فعالیت در جریان رو نشون میده، نه مجموع کل درخواست‌ها.",
    ] },
    { title: "حذف، purge و نسخه پشتیبان امن", tags: "delete destructive persistence snapshot restore", steps: [
      "«حذف» اکانت رو از pool اجرایی درمیکاره؛ snapshot ذخیره‌شده‌اش بعد از بارگذاری دوباره پول یا راه‌اندازی دوباره قابل بازگشته. فرض نکن که حذف، توکن سرویس رو هم revoke میکنه.",
      "«Purge drained» تخریبی‌ه: اکانت‌های از کار افتاده و کاملاً خالی رو حذف میکنه و ممکنه snapshotشون رو هم پاک کنه. قبل از تأیید حتماً نسخه پشتیبان بگیر.",
      "Snapshots شامل اطلاعات ورودs قابل استفاده‌ان. فولدر account و نسخه پشتیبان‌ها رو محرمانه نگه دار. یه خروجی گرفتن کپی‌شده با حذف روی همین دستگاه قابل پس‌گرفتن نیست؛ اگه لو رفته، از سرویس revoke کن.",
    ] },
  ] },
  { id: "generator", title: "ابزار ساخت و تنظیم AI", desc: "قبل از شروع ابزارها، مرورگر، صندوق و judge رو آماده کن.", route: "generator", items: [
    { title: "محیط رو آماده کن", tags: "python Chromium Playwright packages locate permission Xvfb", steps: [
      "اگه ازت خواسته شد، پوشه ZCODEAUTO رو که فایل‌های ابزار ساخت توشه پیدا کن. «تجهیزات محیط» Python، پکیج‌های لازم و دانلود Chromium Playwright رو چک میکنه. installer Linux اینا رو خودکار فراهم میکنه؛ نصب از source ممکنه نیاز به تنظیم داره.",
      "برای تست اول از یه مرورگر استفاده کن. فقط بعد از اینکه یه run کامل موفق شد افزایش بده. ابزارهای بیشتر memory، CPU، ظرفیت صندوق و سهمیه AI مصرف میکنن. یه installer موفق یا مرورگر خالی موفق یعنی signup سرویس هم موفق بوده، نه.",
      "مرحلات ابزار شامل signup، ایمیل تأیید، authorization CLI/device، ثبت اکانت، و دریافت plan اختیاریه. خطای فعلی رو از آخرین خطوط ابزار بیار تا بفهمی کجا گیر کرده.",
    ] },
    { title: "Auto Generate: ذخیره، شروع، و نظارت", tags: "automation goal attempts qualified cooldown concurrency pause resume interrupted safety budget", steps: [
      "اول محیط، صندوق و بررسی‌کننده هوش مصنوعی capable از تصویر رو آماده کن. Auto Generate همیشه فقط بررسی‌کننده هوش مصنوعی استفاده میکنه. هدف رو انتخاب کن: «موفقیت واجد‌شرایط» یا «تعداد ثابت امتحان‌های signup»؛ فقط Start Plan موفق واجدشرایط تازه شمارده، نه اکانت تکراری یا بدون plan.",
      "حتی تو goal mode، «حداکثر امتحان» رو بذار: این بودجه امنیتی اجباریه، نه وعده رسیدن به هدف. از ۱ تا ۳ جایگاه مرورگر شروع کن، cooldown هر جایگاه رو ثانیه بده، attempt timeout و limit تکرار خطا رو تنظیم کن. با یه مرورگر شروع کن و resource usage رو قبل از افزایش concurrency چک کن.",
      "«ذخیره تنظیمات» رو صریحاً بزن، بعد «Auto Generate». هر تغییر فیلد دوباره ذخیره خواست داره. «ذخیره تنظیمات» اجرا رو شروع نمیکنه. تنظیمات ذخیره‌شده بعد از راه‌اندازی دوباره درگاه زنده میمونه؛ اجرا فعال profile اولیه‌ش رو حفظ میکنه و قابل ویرایش درجا نیست.",
      "«مستقیم» یعنی بدون پروکسی انتخابی؛ VPN/TUN سیستم رو غیرفعال نمیکنه و routing OS رو تغییر نمیده. «فهرست پروکسی‌ها» عمداً انتخاب پروکسی داره. هیچ‌کدوم guarantee signup یا Start Plan نمیده.",
      "«توقف» (Pause) امتحانات جدید رو 막ه ولی امتحانات فعال تموم میشن. «ادامه» فقط بعد از اکشن صریح تو ادامه میده. «توقف اجرا» queue و امتحانات فعال رو cancel میکنه. دلیل رو ببین و تکراری/فاقد-plan/ناموفق رو جداگانه بشمار؛ راه‌اندازی دوباره درگاه نباید به‌صورت خاموش automation رو دوباره شروع کنه.",
    ] },
    { title: "کد امنیتی و مدل بررسی‌کننده هوش مصنوعی", tags: "ai auto classic manual strategy vision model default", steps: [
      "«کد امنیتی» mode تعامل رو انتخاب میکنه. «مدل بررسی‌کننده هوش مصنوعی» استراتژی حل رو انتخاب میکنه: فقط بررسی‌کننده هوش مصنوعی، vision کلاسیک، یا ترکیب auto. با وجود label، این dropdown ID مدل endpoint API نیست.",
      "Linux هر دو dropdown رو روی «فقط بررسی‌کننده هوش مصنوعی» دیفالت میکنه. این نیاز به یه endpoint AI capable از تصویر داره. بدون endpoint سفارشی، judge از اکانت‌های این درگاه استفاده میکنه (معمولاً GLM-5.3-Flash)؛ قبل از bootstrap یه اکانت قابل استفاده نیاز داری.",
      "برای judge سفارشی، «آدرس endpoint بررسی‌کننده هوش مصنوعی»، «ID مدل» و «API key» رو پر کن. origin، base با /v1، یا endpoint کامل /chat/completions قبول میشن. مطمئن شو مدل تصاویر رو قبول کنه؛ فقط text completion یعنی vision support نداره. خالی گذاشتن فیلد key یعنی مقدار ذخیره‌شده حفظ میشه.",
      "«دستی» یعنی خودت تو یه پنجره دسکتاپ حل میکنی. تو VPS بدون دسکتاپ در دسترس نیست. Retryها attempts recovery محدودن، نه guarantee موفقیت.",
    ] },
    { title: "نمایش مرورگر", tags: "headless visible desktop virtual WSLg Xvfb F001", steps: [
      "«خودکار» اگه display دسکتاپ موجود باشه ازش استفاده میکنه، اگه نباشه Xvfb رو شروع میکنه. «display مجازی (پشت‌صاف)» صریحاً یه صفحه Xvfb خصوصی انتخاب میکنه. «پنجره دسکتاپ» نیاز به DISPLAY قابل‌دسترس داره.",
      "پشت‌صاف Linux از headed Chromium روی Xvfb خصوصی استفاده میکنه. پشت‌صاف Windows از Chromium headless واقعی استفاده میکنه و مرورگر قابل مشاهده‌ای نیست؛ device check سرویس ممکنه reject کنه. برای کومپیوتیبل‌بودی/پیدا کردن خطا صریحاً «پنجره دسکتاپ» رو انتخاب کن. Auto Generate دیفالتاً پشت‌صافه؛ هرگز ساکت fallback قابل‌مشاهده باز نمیشه. تغییر display فقط ابزارهای جدید رو تأثیر میده.",
      "Xvfb گم، executable مرورگر گم، shared library گم، یا خطای permission مشکل محیطه. «تجهیزات محیط» رو اجرا کن یا وابستگی‌های Linux رو ترمیم کن قبل از تکرار؛ تغییر مدل AI مرورگری که launch نمیشه رو درست نمیکنه.",
    ] },
    { title: "منبع IP، تکرار و کنترل job", tags: "direct pinned فهرست پروکسی‌ها country SOCKS stop kill دریافت", steps: [
      "«شبکه من» route فعلی host رو استفاده میکنه شامل VPN/TUN سیستم. «فهرست پروکسی‌ها» از کاندیداهای تأییدشده استفاده میکنه؛ type/country فقط انتخاب pool رو محدود میکنه. «پین پروکسی» از پروکسی صریح واردشده استفاده میکنه.",
      "country خالی یا subset SOCKS با افزایش مرورگر درست نمیشه. pool رو چک کن، فیلتر رو بازتر کن، یه پین پروکسی معتبر استفاده کن، یا عمداً «شبکه من» رو انتخاب کن.",
      "«کشتن» (Kill) ابزار یا دریافت انتخابی رو متوقف میکنه. «توقف همه» فعلاً فقط signup ابزارها رو متوقف میکنه؛ دریافتs رو جدا متوقف کن. ردیف‌های تموم‌شده با «پاک کردن تموم‌شده» حذف میشن. متوقف کردن بعد از signup ممکنه اکانتی رو بذاره که منتظر تأیید ایمیل باشه.",
      "«Claim همه معلّق» signupهای موفق ذخیره‌شده روی همین دستگاه رو که دسترسی ثبت نشده دارن یه‌به‌یه پردازش میکنه. «مستقیم» (بدون پروکسی) دیفالته؛ «فهرست پروکسی‌ها، بعد مستقیم» اختیاریه. «توقف گروهی» queue و دریافت فعلی رو cancel میکنه ولی درگاه روشن میمونه. خط پیشرفت processed/دسترسیed/not-دسترسیed/skipped رو گزارش میکنه. preview خالی قطعی با preview/خطای شبکه فرق داره؛ هیچ mode دسترسی رو guarantee نمیکنه.",
      "Helper کد امنیتی بومی Start Plan مستقیم، HTTP(S) و پروکسی SOCKS رو ساپورت میکنه. SOCKS از یه loopback HTTP bridge داخلی استفاده میکنه؛ listener عمومی یا پورت فایروال اضافه لازم نیست. دریافت مستقیم روی پروکسی fallback نمیکنه ولی همچنان routing VPN/TUN سیستم رو رعایت میکنه.",
    ] },
  ] },
  { id: "mail", title: "ابزار ایمیل و روتینگ", desc: "احراز هویت ابزار، DNS routing و delivery سه چک جداگانه‌ان.", route: "generator", items: [
    { title: "Cloudflare رو درست تنظیم کن", tags: "API token permissions zone account ابزارs KV DNS routing", steps: [
      "از دامنه‌ای فعال استفاده کن که zone DNS توش تو account Cloudflare‌ته. تو «تنظیمات ایمیل» دامنه و یه Cloudflare API token سفارشی بده؛ اگه setup نتونه account رو انتخاب کنه، account ID رو مشخص کن. روتینگ خودکار ساب‌دامین ساپورت نمیشه؛ دستی تنظیمش کن.",
      "permissionهای لازم token: Account / Workers Scripts / Edit؛ Account / Workers KV Storage / Edit؛ Account / Account Settings / Read؛ Zone / Zone / Read؛ Zone / DNS / Edit؛ Zone / Email Routing Rules / Edit؛ Zone / Zone Settings / Edit. account و mail zone مورد نظر رو هم شامل کن.",
      "«نصب ایمیل» ابزار رو provision/ری‌استفاده میکنه، KV storage و inbox secret رو تنظیم میکنه، بعد Email Routing رو ست میده. اگه مرحله‌ای شکست خورد، لاگ setup رو نگه دار. هرگز API token، inbox secret، یا URL صندوق با توکن رو منتشر نکن.",
    ] },
    { title: "تغییرات روتینگ رو عمداً تأیید کن", tags: "catch-all confirmation fingerprint MX TXT existing mail", steps: [
      "Email Routing خودکار میتونه رکورد MX/TXT اضافه کنه. catch-all به ابزار همه ایمیل‌های نامتقابله دامنه رو میگیره. اول از یه دامنه اختصاصی استفاده کن یا تأثیر رو روی ایمیل موجود بفهم.",
      "اگه catch-all موجود مقصد واقعی داره، مقصد فعلی و پیشنهادی رو ببین. «جایگزینی routing» تأیید صریح میخواد؛ «حفظ routing فعلی» یعنی ایمیل تأیید ممکنه به این ابزار نرسه. قاعده address مشخص ممکنه اولویت داشته باشه.",
      "اگه قاعده بعد از مرور تغییر کرده، بررسی دوباره کن و دوباره ببین. تأیید قدیمی رو مکرراً تکرار نکن؛ fingerprint امنیتی عمداً تأییدهای قدیمی رو رد میکنه.",
    ] },
    { title: "صندوق و delivery رو جدا تست کن", tags: "401 unauthorized URL secret inbox poll mail missing email", steps: [
      "«تست صندوق ابزار» endpoint و secret ذخیره‌شده رو چک میکنه. این DNS، catch-all routing یا delivery واقعی رو اثبات نمیکنه. یه پیام واقعی به آدرس دامنه تنظیم‌شده بفرست تا delivery end-toend تأیید بشه.",
      "HTTP 401 inbox poll یعنی ابزار secret ذخیره‌شده رو reject کرده. pair دقیق /inbox URL و INBOX_SECRET رو چک کن. secret خام رو ذخیره کن، نه percent-encoded یا URL با ?k=. بعد از تغییر اطلاعات ورود jobها رو راه‌اندازی دوباره کن؛ children فعال تنظیمات قدیمی رو نگه میدارن.",
      "ابزار health 200 یعنی inbox auth سالم نیست. اگه secret ابزار مشترک rotate شده، همه نصب‌های استفاده‌کننده رو آپدیت کن. تا inbox auth خرابه signup تکراری رو متوقف کن.",
      "از «پیش‌رفته / بازیابی دستی» استفاده کن تا Cloudflare token ذخیره‌شده رو بدون redeploy جایگزین کنی، token رو پاک کنی، inbox URL/secret رو ست کنی، یا صندوق رو تست کنی. پاک کردن اطلاعات ورودs روی همین دستگاه ابزار deploy‌شده رو حذف نمیکنه و token رو تو Cloudflare revoke نمیکنه.",
    ] },
  ] },
  { id: "پروکسی", title: "فهرست پروکسی‌ها و شبکه TUN", desc: "یه اتصال TCP یعنی پروکسی سالم کار میکنه، نه.", route: "پروکسی", items: [
    { title: "اسکن، تأیید و نگهداری", tags: "scrape raw verified working failing latency timeout sources import", steps: [
      "«اسکن + تأیید» list کاندیداها رو دانلود و چک میکنه. «تأیید خام» list خام ذخیره‌شده رو چک میکنه. «بازچک پول» اعضای ذخیره‌شده رو دوباره تست میکنه. «وارد کردن» URL پروکسی یا خط IP:port قبول میکنه ولی entry‌های وارد کردن‌شده هنوز نیاز به تأیید دارن.",
      "تعداد «list خام» کاندیداهاست. «سالم/خراب/چک‌نشده» به ledger ذخیره‌شده اشاره دارن؛ fail خام لزوماً عضو ledger نمیشه. تعداد خام زیاد با صفر entry خراب ذخیره‌شده یعنی چک idle نیست.",
      "تأیید پروکسی negotiation، HTTPS/TLS، انتظار z.ai page، reachability captcha-host و latency رو چک میکنه. «شانس دوم» بعد از پاس اولیه اتفاق میفتاد؛ متوقف کردن زوده ممکنه skip بشه. TCP probes، «چک HTTPS»، concurrency و timeout کنترل‌های جداگانه‌ان.",
      "«منابع و وارد کردن» list چسبیده/فایل، ویرایش scrape-source، و yield هر منبع رو ساپورت میکنه. «نگهداری پول» میتونه cacheهای مصرف‌شده/خراب/مرده رو پاک و entry‌های قدیمی رو prune کنه؛ پاک کردن cache پروکسی خراب رو درست نمیکنه.",
      "«بازچک خودکار» پروکسیهای ذخیره‌شده رو در interval انتخابی تازه نگه میداره. «جستجوی کشور» metadata میده، نه تست کاربرد. پروکسیهای قابل اعتماد شناخته‌شده رو ترجیح بده، به‌جای اینکه list عمومی رو فقط به ایندلیل که یه‌بار TLS گذروند امن فرض کنی.",
      "«بازچک خودکار» پروکسیهای ذخیره‌شده رو در interval انتخابی تازه نگه میداره. «جستجوی کشور» metadata میده، نه تست کاربرد. پروکسیهای قابل اعتماد شناخته‌شده رو ترجیح بده، به‌جای اینکه list عمومی رو فقط به ایندلیل که یه‌بار TLS گذروند امن فرض کنی.",
    ] },
    { title: "هشدار Xray / VPN TUN", tags: "all ports open reset TCP interception 64 Windows tunnel timeout", steps: [
      "بعضی stack TUN روی همین دستگاه TCP رو قبل از موفقیت اتصال remote قبول میکنن. اگه probe reserved-address هم open باشن، چکر هشدار میده که نتایج TCP قابل اعتماد نیست و به handshake واقعی CONNECT/SOCKS رو سوییچ میکنه.",
      "این مسیر concurrency تأیید رو روی ۶۴ cap میکنه و تونل رو bypass یا route/firewall رو تغییر نمیده. همه endpoint open بودن یعنی کار میکنن، نه. نتیجه صفر قابل‌استفاده هم ممکنه.",
      "اگه handshake timeout، reset، CONNECT refuse یا TLS fail شد، یه VPN exit/routing policy دیگه یا یه پروکسی قابل‌کار شناخته‌شده رو مقایسه کن. مستقیم کار کردن chat.z.ai فقط HTTPS مستقیم رو اثبات میکنه؛ ثابت نمیکونه پروکسی عمومی میتونه به مقصد تونل بزنه.",
      "detector یه network heuristicه، نه اثبات ban بودن IP عمومی. تغییر IP ممکنه بعضی مسیر رو بهتر کنه ولی رفتار TCP-accept روی همین دستگاه تونل رو درست نمیکنه و پروکسیهای عمومی مرده رو زنده نمیکنه.",
    ] },
  ] },
  { id: "سرور واسطهs", title: "سرور واسطه و مدل‌ها", desc: "اگه لازمه ترافیک مدل رو route کن، بدون اینکه سرور واسطه رو با پروکسی signup اشتباه بگیری.", route: "models", items: [
    { title: "سرور واسطه رو فقط بعد از تنظیم فعال کن", tags: "Cloudflare Vercel Deno Netlify 405 unusual activity 3012", steps: [
      "سرور واسطه تو نصب تازه‌نصب خاموشه. تو «ابزار پروکسی» Cloudflare/Vercel/Deno/Netlify رو deploy کن یا URL و secret یه سرور واسطه موجود رو اضافه کن. تست کن، یه سرور واسطه فعال انتخاب کن، مدل‌های روت‌شده رو انتخاب کن، بعد routing رو فعال کن.",
      "deploy Cloudflare سرور واسطه نیاز به API token و account ID داره، با ابزارs.dev فعال. Deno نیاز به token و organization domain داره. برای Netlify از function URL تولیدشده که با /.netlify/functions/سرور واسطه تموم میشه استفاده کن. deployment protection و rate limit سرویس ممکنه هنوز دسترسی رو بلاک کنه؛ لاگ deployment رو ببین.",
      "«تک» فقط سرور واسطه فعال رو استفاده میکنه؛ «round robin» یا «random» سرور واسطههای واجدشرایط رو rotate میکنن. سرور واسطههای خراب temporary deprioritize میشن؛ اگه همه در حال استراحت باشن list کامل دوباره قابل استفاده‌ه. health test سرور واسطه یه inference test Zcode نیست و تغییر exit guarantee حذف محدودیت سرویس نمیده.",
      "سرور واسطه ترافیک API مدل رو carry میکنه، نه ترافیک مرورگر signup یا ایمیل. یه سرور واسطه سالم pool پروکسی signup رو پر نمیکنه. حذف سرور واسطه از این درگاه deployment سرویس رو پاک نمیکنه.",
    ] },
    { title: "دسترسی مدل و fallback", tags: "catalog sync default reasoning pacing capped reset", steps: [
      "«مدل‌ها» کاتالوگ و دسترسی استنباط‌شده از state اکانت، پنجره plan، سهمیه و capهای شناخته‌شده رو نشون میده. یه مدل رو expand کن تا دلیل per-account رو ببینی. «sync مدل‌ها» کاتالوگ سرویس رو بررسی دوباره میکنه، نه مجوز استفاده اکانت.",
      "تنظیمات مدل پیش‌فرض، reasoning effort، fallback اختیاری و pacing رو کنترل میکنه. Fallback میتونه مدل پاسخ رو تغییر بده؛ اگه خاصیت output مهمه، مدل واقعی رو چک کن.",
      "HTTP 405 با «unusual activity» یا کد 3012 میتونه model/IP-specific باشه. capها و تنظیمات سرور واسطه رو ببین. فقط به‌دلیل اینکه یه model موقتاً blocked بود همه اکانت‌ها رو reset یا snapshot رو purge نکن.",
    ] },
  ] },
  { id: "analytics", title: "آمار، لاگ و تنظیمات", desc: "قبل از تغییر اطلاعات ورود یا حذف داده، از شواهد درست استفاده کن.", route: "analytics", items: [
    { title: "اعداد آمار رو بفهم", tags: "usage stats 1h 6h 24h 7d 30d all CSV latency tokens errors", steps: [
      "آمار جایگزین صفحات جداگانه usage و stats شد. بازه ۱h، ۶h، ۲۴h، ۷d، ۳۰d یا «همه» رو انتخاب کن؛ خلاصه، chart و breakdown همون بازه رو share میکنن. لینک‌های قدیمی به ۳۰d یا «همه» redirect میشن.",
      "شمارها attempts ثبت‌شده upstream رو نشون میدن. Retry میتونه برای هر ریکвест برنامه متصل‌شده چند تا row بسازه و هر preflight/transport failure تو ledger وارد نمیشه. اینا لاگ ورودی کامل نیستن.",
      "ترافیک chart رو بین توکن، ریکWEST و خطا سوییچ کن. تفکیک model/account/API-key search، sort و export CSV رو ساپورت میکنه. search فقط breakdown/export رو فیلتر میکنه، نه summary یا chart. جزئیات account از pool امروز enrich میشن، تاریخچه ممکنه accountهای حذف‌شده رو شامل بشه.",
      "مقایسه با بازه قبل از interval مساوی قبل استفاده میکنه؛ «همه» مقایسه نداره. latency average شامل failها میشه؛ percentile فقط از نمونه‌های موفق. مدت ثبت‌شده time-to-first-token یا latency کل برنامه متصل‌شده نیست. label بکت‌ها از timezone مرورگر نمایشی استفاده میکنن.",
    ] },
    { title: "لاگ، بررسی دوباره و تنظیمات ذخیره‌شده", tags: "debug errors warnings restart cache old UI", steps: [
      "لاگ از ring buffer in-memory فرایند با فیلتر level/text میخونه. «پاک کردن» یه view watermark ست میکنه: رکورد جدیدتر همچنان میاد ولی filter تغییر کردن رکورد پاک‌شده قدیمی رو برنمیگردونه. لاگ سرور رو پاک نمیکنه. راه‌اندازی دوباره ring رو پاک میکنه؛ لاگ systemd Linux تو journalctl میمونه. قبل از اشتراک‌گذاری خط اطلاعات ورود رو محو کن.",
      "تنظیمات ردیف‌های ذخیره‌نشده رو نشون میده و فقط مقادیر تغییرکرده رو سیو میکنه. برای اعمال تنظیمات درگاه رو راه‌اندازی دوباره کن. «ثبت لاگ» prompt/response رو روی disk ذخیره میکنه. کنترل بازسازی کلید فعلاً به لانچر دسکتاپ ارجاع میده به‌جای اینکه خودش key رو rotate کنه. راه‌اندازی دوباره با بررسی دوباره داشبورد، بارگذاری دوباره پول، سهمیه check و sync کاتالوگ فرق داره.",
      "اگه بعد از آپدیت کنترل‌ها گم باشن یا label قدیمی باشن، با Ctrl+Shift+R hard-refresh کن یا در پنجره خصوصی تست کن. JavaScript مرورگر ممکنه حتی وقتی binary سرور آپدیت شده cache بمونه.",
    ] },
    { title: "آپدیت امن روی Windows و Linux", tags: "updater download restart apply checksum backup rollback release", steps: [
      "برای چک دستی release از «تنظیمات > بررسی آپدیت الان» استفاده کن. build بسته Windows «دانلود آپدیت» رو داره و بعد یه اکشن جداگانه «راه‌اندازی دوباره برای اعمال». دانلود کار رو متوقف نمیکنه؛ اعمال نیاز داره generator، دریافت گروهی، اسکن پروکسی و ریکWEST برنامه متصل‌شده idle باشن.",
      "helper Windows checksum staged رو دوباره چک میکنه، منتظر اپ و bootloader میمونه، launch arg/تنظیمات/working directory رو حفظ میکنه و نسخه پشتیبان نگه میداره. نیاز داره health response با nonce هر launch در ۶۰ ثانیه تطبیق داشته باشه؛ startup fail یا timeout rollback میکنه. این startup رو تأیید میکنه، نه inference یا generator. اگه relaunch fail شد helper private update.log رو ببین.",
      "اعلان Linux info release رو نشون میده، نه دانلود exe ویندوزی. بعد از متوقف کردن کار `sudo autozcoder update` رو بزن. manager asset gateway/manager متناظرت رو از یه release stage میکنه، checksum رو چک میکنه و اگه restart یا health fail شد فایل deploy رو rollback میکنه. account/تنظیمات حفظ میشن؛ یه نسخه پشتیبان جداگانه محرمانه نگه دار.",
      "build منتشرشده Linux نیاز به x86_64 و glibc 2.35+ داره. نصب source/custom supervisor به build/runtime سازگار خودش و policy راه‌اندازی دوباره دستی نیاز داره. اگه بعد از staging وابستگی generator ناسازگار شد، محیط رو ترمیم کن به‌جای غیرفعال کردن چک‌ها. هیچ‌کدوم از updaterها به خروجی گرفتن از حساب یا Cloudflare token تو نیاز ندارن.",
    ] },
  ] },
  { id: "linux", title: "نصب Linux، manager و نسخه پشتیبان", desc: "installer runtime رو provision میکنه؛ mail ابزار رو deploy یا account رو برای تو اضافه نمیکنه.", route: "server", items: [
    { title: "سایزینگ VPS عملی برای generator", tags: "minimum requirements RAM CPU memory vCPU hardware server steal swap capacity", steps: [
      "برای یه مرورگر، ۱ vCPU قابل اعتماد و ۲ گیگ RAM حداقل مطلقه با headroom محدود. برای استفاده راحت کنار درگاه، با ۲ vCPU کم-رقت و ۴ گیگ RAM شروع کن. اینها تخمین planن، نه guarantee اندازه‌گیری‌شده.",
      "برای ۲ مرورگر هم‌زمان، حدود ۴ vCPU و ۶ تا ۸ گیگ RAM plan کن. برای ۳ تا ۴، حدود ۴ تا ۶ vCPU و ۸ تا ۱۲ گیگ. با یه ابزار شروع کن و فقط بعد از اندازه‌گیری run کامل موفق افزایش بده.",
      "برآورد تقریبی RAM یه مرورگر: ۴۰۰-۷۰۰ MB برای OS، ۳۰۰-۶۰۰ MB برای درگاه/Python، ۶۰۰ MB تا ۱.۵ گیگ برای Chromium/Xvfb/ابزار، به‌علاوه ۵۰۰ MB تا ۱ گیگ safety margin. این با فرض remote بررسی‌کننده هوش مصنوعیه؛ روی همین دستگاه host کردن مدل AI resource اضافه میخواد.",
      "vCPU قابل اعتماد یا dedicated رو ترجیح بده به coreهای oversold شدید. CPU steal بالا یعنی hypervisor CPU time رو محروم میکنه: پاسخ‌گویی کم مرورگر حتی با RAM خالی ممکنه. یه page load آروم به‌تنهایی exhaustion resource رو اثبات نمیکنه؛ لاگ، OOM event و رفتار شبکه رو ببین.",
      "۱-۲ گیگ swap پیک memory کوتاه رو جذب میکنه ولی capacity مرورگر نیست. روی VPS کوچک اسکن پروکسی بزرگ یا build آپدیت هم‌زمان رو اجتناب کن. فقط درگاه بدون generator میتونه روی hostهای کوچک‌تر بچپه.",
      "تو نصب تازه، یه CPU یا حدود ۲ گیگ RAM کمتر یه warning قبل از نصب وابستگی نشون میده. «همچنان ادامه» دیفالت «نه» هست. نصب unattended نیاز به `ZGW_ALLOW_LOW_RESOURCES=1` صریح داره، یا `ZGW_SKIP_GENERATOR=1` برای skip مرورگر. نصب‌های موجود دوباره prompt نمیشن.",
    ], sizing: [
      ["۱ مرورگر (حداقل مطلق)", "۱ vCPU قابل اعتماد", "۲ گیگ", "headroom محدود؛ کار آروم انتظاره"],
      ["۱ مرورگر (توصیه‌شده)", "۲ vCPU قابل اعتماد", "۴ گیگ", "نقطه شروع راحت"],
      ["۲ مرورگر", "۴ vCPU", "۶-۸ گیگ", "قبل از افزایش پیک رو اندازه بگیر"],
      ["۳-۴ مرورگر", "۴-۶ vCPU", "۸-۱۲ گیگ", "وابسته به workload و رقت"],
    ], commands: ["free -h", "nproc", "vmstat 1 5"] },
    { title: "نصب و مدیریت سرویس", tags: "autozcoder install status start stop restart update cert uninstall TLS HTTPS firewall 80 8443", steps: [
      "installer Linux gateway رو build/دانلود میکنه، generator Python رو provision میکنه، Chromium/Xvfb، Node/Wrangler، HTTPS مستقیم، سرویس non-root و renewal رو ست میده. HTTPS دیفالتاً پورت ۸۴۴۳؛ issuance ممکنه به self-signed TLS fallback بزنه، پس گزارش نهایی رو بخون. nginx لازم نیست. build/دانلود ممکنه چند دقیقه طول بکشه.",
      "`sudo autozcoder` رو برای منو manager بزن. status/logs inspectن؛ start/stop/restart روی availability تأثیر دارن؛ update binary رو عوض و restart/health رو چک میکنه. آپدیت source به یه source tree staged بهروز نیاز داره، نه فقط checkout قدیمی روی سرور.",
      "sert bare-IP قابل اعتماد issuance کوتاه‌عمر و renewal خودکار دارن. پورت ۸۰ برای standalone validation قابل‌دسترس باشه؛ قانون فایروال/سرویس رو با پورت داشبورد انتخابی هماهنگ نگه دار. اگه renewal fail شد، timer و لاگ installer رو ببین به‌جای درخواست مکرر sert.",
      "`sudo autozcoder cert` یه جفت sert/key رو stage و validate میکنه، health درگاه رو زیر systemd چک میکنه و اگه تغییر fail شد حالت TLS/تنظیمات/revenue قبلی رو restore میکنه. mode TLS انتخابی بعد از reinstall هم میمونه، شامل self-signed یا loopback HTTP. commandهای manager به‌جز help نیاز به root دارن.",
      "سرویس معمولاً به‌عنوان autozcoder اجرا میشه، نه root. binary و Node خصوصی root-owned میمونن؛ نگهداری generator/browser/npm از یه tooling user بدون‌privilege استفاده میکنه. بعد از کپی دستی، ownership رو چک کن به‌جای chmod 777 یا اجرای root. `ZGW_SKIP_SYSTEMD=1` شروع و renewal رو به supervisor تو میسپاره. uninstall state runtime رو پاک میکنه؛ اول نسخه پشتیبان بگیر.",
    ], commands: ["sudo autozcoder", "sudo autozcoder status", "sudo autozcoder logs", "sudo systemctl status autozcoder-renew.timer", "sudo tail -n 80 /var/log/autozcoder-install.log"] },
    { title: "داده کجا هست و چی نسخه پشتیبان بگیر", tags: "root opt config YAML database snapshots mail سرور واسطهs generator-data paths", steps: [
      "ریشه بسته Linux پیش‌فرض: /opt/zcodegateway (قابل override با ZGW_INSTALL_DIR). config.yaml کلیدها/تنظیمات گیت‌وئه؛ accounts/ snapshotهاست؛ gateway.db تاریخچه usageه؛ generator-data/ گزینه‌ها، mail_config.json، سرور واسطهs.json و داده پروکسی/job داره.",
      "mail-ابزار/ source/تنظیمات ابزار رو نگه میداره؛ certs/ ماده TLS رو؛ genenv/، pw-browsers/، node/ و home/ وابستگی‌های runtime/cache رو. state installer /etc/autozcoder.env هست. /root/AutoZCoder معمولاً staging source است، نه storage account زنده.",
      "نسخه پشتیبان‌ها شامل توکن account، admin/client key و mail secretن. محرمانه نگه‌شون دار. برای نسخه پشتیبان کامل هم‌خوان، اول سرویس رو متوقف کن یا ابزار نسخه پشتیبان SQLite-aware استفاده کن؛ کپی gateway.db در حین WAL write ممکنه داده جا بمونه.",
      "نصب source ممکنه generator/output به‌جای generator-data بسته‌بندی‌شده استفاده کنه. مسیرهای واقعاً تنظیمات‌شده رو تأیید کن. uninstall میتونه state اپ رو حذف کنه: قبل از تأیید نسخه پشتیبان بگیر و فرض نکن deployment Cloudflare رو پاک میکنه.",
    ] },
  ] },
];

export const ERRORS = [
  { title: "finish_signup HTTP 500 / اکانت بعد از تأیید تأیید نشده", tags: "captcha passed email verified internal error final signup recovery", route: "generator", steps: [
    "موفقیت کد امنیتی و تأیید ایمیل یعنی account ساخته شده. اگه finish_signup خطای سرور داد و token غیر-guest نرسید، account یا plan قابل استفاده‌ای تأیید نشده.",
    "Auto Generate `finish_signup_failed` گزارش میکنه و جایگزینی رو pause میکنه. جزئیات recovery خصوصی تو `recovery_accounts.txt` برای آدرس تأییدشده ذخیره میشه. این fail رو با «فاقد plan» اشتباه نگیر، اطلاعات ورود recovery رو لو نده، و فرض نکن تغییر display mode HTTP 500 سمت سرویس رو درست میکنه.",
  ] },
  { title: "health سرور واسطه fail / deployment protection / function URL اشتباه", tags: "Cloudflare Vercel Deno Netlify سرور واسطه secret 401 403 404", route: "پروکسی", steps: [
    "URL deploy‌شده سرور واسطه و secret متناظرش رو چک کن، نه inbox secret mail-ابزار رو. برای Netlify از function endpoint استفاده کن. deployment protection سرویس میتونه ریکWEST رو بلاک کنه حتی وقتی صفحه اصلی سایت لود میشه.",
    "سرور واسطه انتخابی رو تست کن، لاگ deployment سرویس و rate limit رو ببین، و چک کن چه مدل‌هایی روت شدن. health سرور واسطه connection به test target رو اثبات میکنه، نه مجوز استفاده مدل یا inference موفق. اگه عمداً می‌خوای مسیر مستقیم رو مقایسه کنی، routing رو غیرفعال کن.",
  ] },
  { title: "503 waf_block / HTML 403 از edge سرویس", tags: "WAF CDN shared egress circuit Retry-After", route: "پروکسی", steps: [
    "HTML edge block با JSON مجوز استفاده rejection فرق داره. درگاه ترافیک متأثر رو pause و recovery رو probe میکنه؛ به Retry-After احترام بذار به‌جای اضافه کردن اکانت یا توفان retry.",
    "egress و routing سرور واسطه رو چک کن. block IP/CDN مشترک با rotate snapshot account درست نمیشه. JSON 403 ممکنه محدودیت مجوز استفاده مدل باشه؛ stage پاسخ رو تو لاگ ببین.",
  ] },
  { title: "529 / 1305 / model overload", tags: "busy retry backoff model provider", route: "models", steps: [
    "یعنی model شلوغه، لزوماً اکانت بد نیست. درگاه قبل از output با backoff retry میکنه. صبر کن، concurrency رو کم کن، یا عمداً model دیگه‌ای انتخاب کن.",
    "برای overload response account purge یا reauthenticate مکرر نکن. بعد از شروع stream، خطا میتونه به‌صورت event برسه حتی اگه HTTP response اولیه ۲۰۰ بوده.",
  ] },
  { title: "502 transport_error / سرور واسطه_transport_error / stream truncat", tags: "empty invalid stream socket timeout network", route: "logs", steps: [
    "ببین transport خراب مستقیم upstreamه، سرور واسطه hostه، یا connection برنامه متصل‌شدهه. model، stage، status و حداقل خط لاگ محو‌شده رو جمع کن. فرض نکن سهمیه تموم شده.",
    "read timeout رو فقط برای پاسخ آروم اثبات‌شده زیاد کن. connection خراب، format stream نامعتبر و سرور واسطه در دسترس نبودن remedial جدا دارن؛ اول test سرور واسطه و کنترل شبکه رو ببین.",
  ] },
  { title: "Start Plan 3007 / 1001 / 1003 / 1005", tags: "Aliyun material offer gone alآماده دریافتed limit unavailable mint", route: "generator", steps: [
      "3007 نیاز به material تأیید کد امنیتی Aliyun داره: output native captcha-mint/sidecar یا مسیر مرورگر ساپورت‌شده رو ببین. rotate پروکسی روش تعیین‌شده برای material گم نیست.",
      "1001 میتونه offer حذف شده باشه؛ 1003 قبلاً دریافت شده؛ 1005 limit/در دسترس نبودن. پاسخ دریافت و مجوز استفاده billing فعلی رو بخون. «قبلاً دریافت شده» به‌تنهایی سهمیه قابل استفاده رو اثبات نمیکنه و این کد دریافت با fail inference فرق دارن.",
  ] },
  { title: "SIGNUP_RATE_LIMITED / HTTP 451 / exhaustion connection روی همین دستگاه", tags: "signup retry interval geo legal file descriptors sockets", route: "generator", steps: [
    "برای SIGNUP_RATE_LIMITED به retry interval و scope داده شده احترام بذار. attempts مکرر همون مسیر میتونه آدرس تأیید و کار کد امنیتی رو هدر بده. بعضی جزئیات signup ناقص ممکنه تو `recovery_accounts.txt` ذخیره بشه؛ داشبورد هر signup ناقصی رو به‌صورت خودکار recover نمیکنه.",
    "HTTP 451 یعنی محدودیت منطقه‌ای/قانونی؛ policy سرویس و model/path متأثر رو ببین. به‌عنوان خطای انقضای توکن جلوش نده.",
    "exhaustion file-descriptor/socket روی همین دستگاه مشکل capacity hostه: concurrency checker/ابزار رو کم کن و resource limit رو ببین. این یعنی همه پروکسی مرده، نه.",
  ] },
  { title: "داشبورد 401 / 403: admin key reject", tags: "auth login password remote forbidden origin host", route: "server", steps: [
    "از admin key این درگاه استفاده کن. Client key و account JWT داشبورد رو باز نمیکنن. روی host ریموت تنظیمات remote-admin و hostname/پورت HTTPS دقیق رو تأیید کن.",
    "اگه reverse پروکسی دخیله، config forwarded host/origin رو چک کن. origin protection رو برای دور زدن غیرفعال نکن و admin key رو منتشر نکن. یه پنجره خصوصی تازه قدیمی sessionStorage رو از reject سمت سرور جدا میکنه.",
  ] },
  { title: "ریکWEST مدل 401: اطلاعات ورود اکانت reject", tags: "revoked JWT expires login token refresh", route: "accounts", steps: [
    "تو لاگ، reject client key درگاه رو از reject account-token upstream تمایز بده. state اکانت رو چک و اطلاعات ورود ذخیره‌شده رو بررسی دوباره کن. اگه توکن جدیدی نیست، دوباره ورود کن یا یه خروجی گرفتن تازه وارد کردن کن.",
    "«انقضای اعلام‌نشده» یعنی اعتبار همیشگی نیست. کپی توکن فعلی یعنی کپی چیزی که درگاه نگه میداره؛ توکن جدید نمی‌سازه.",
  ] },
  { title: "402 / 1005 / سهمیه خالی / اکانت واجدشرایط نیست", tags: "credits plan lost balance capped no مجوز استفاده", route: "accounts", steps: [
    "سهمیه رو بررسی دوباره کن، model دقیق درخواستی رو ببین، و plan start/reset time رو چک کن. state از کار افتاده/در حال استراحت/model-cap رو ببین؛ تعداد آماده به‌تنهایی دسترسی این model رو اثبات نمیکنه.",
    "برای reset مکتوب صبر کن، اکانت واجدشرایط اضافه کن، یا model در دسترس انتخاب کن. فعال کردن اکانت، بارگذاری دوباره فایل یا راه‌اندازی دوباره درگاه credit سرویس نمیسازه.",
  ] },
  { title: "405 / 3012 / unusual activity", tags: "blocked model IP سرور واسطه", route: "پروکسی", steps: [
    "cap model/اکانت رو ببین. اگه منطقیه، قبل از فعال کردن یه سرور واسطه برای اون model تنظیمات و تست کن. محدودیت سرویس ممکنه بقیه بزنه و سرور واسطه universal bypass نیست.",
    "اگه پیام از پروکسی CONNECT حین اسکن اومده، اون پروکسی HTTPS tunneling رو رد کرده؛ این با ۴۰۵ endpoint model فرق داره.",
  ] },
  { title: "429 / overloaded / backoff مکرر", tags: "rate limit retries concurrency pacing", route: "settings", steps: [
    "ریکWEST/ابزار هم‌زمان رو کم کن و بذار backoff کار کنه. rate limit سرویس، اکانت‌های در دسترس و pacing model رو چک کن. retry بیشتر ممکنه load رو افزایش بده به‌جای اینکه درستش کنه.",
    "کنترل‌های connection/retry تنظیمات رو عمداً استفاده کن. client rate limit سطح درگاه با overload upstream سرویس علل جداگانه‌ان؛ stage خراب رو تو لاگ ببین.",
  ] },
  { title: "سهمیه check در دسترس نیست یا «منتظر سهمیه check»", tags: "HTTP billing timeout قدیمی refresh plans not checked", route: "accounts", steps: [
    "«بررسی دوباره سهمیه» رو بزن. خطای transport یه retry میگیره؛ check ناموفق آخرین داده رو نگه میداره و خطا نشون میده. billing HTTP 401 اول اطلاعات ورود جدیدتر ذخیره‌شده رو چک میکنه؛ auth fail حل‌نشده با ۳ strike متوالی به‌جای retirement فوری. billing HTTP 404 یعنی خطای check، نه اثبات اکانت مرده. check موفق زمان آخرین آپدیت رو نشون میده.",
    "اگه ادامه داشت، دسترس‌پذیری upstream/شبکه و لاگ رو ببین. interval سهمیه polling یه از کار افتادهline سخت per-account نیست: sweep آروم میتونه check بعد رو تأخیر بندازه. به‌دلیل timeout موقت billing اکانت حذف نکن.",
  ] },
  { title: "Inbox poll 401 / unauthorized", tags: "email secret INBOX_SECRET ابزار", route: "generator", steps: [
    "URL و secret صندوق با ابزار deploy‌شده نمی‌خورن. URL دقیق /inbox رو بدون query/fragment و secret خام deploy‌شده رو ذخیره کن، بعد صندوق رو تست کن. ابزار /health ۲۰۰ نیست تست auth.",
    "بعد از ذخیره generator job رو راه‌اندازی دوباره کن. اگه secret ابزار مشترک رو rotate کردی، همه نصب‌ها رو آپدیت کن؛ کپی تنظیمات قدیمی mismatch secret deploy‌شده رو درست نمیکنه.",
  ] },
  { title: "Inbox 404 / 503 یا ایمیل تأیید هیچ‌وقت نمیاد", tags: "routing MX catch-all KV health deployment", route: "generator", steps: [
    "404 میتونه endpoint/path اشتباه یا deployment گم باشه. 503 میتونه تنظیمات/binding ابزار گم رو نشون بده؛ لاگ setup ابزار رو ببین. قبل از signup بعدی صندوق احراز‌هویت‌شده رو تست کن.",
    "اگه auth صندوق سنده ولی ایمیل نیست، وضعیت Email Routing، DNS MX/TXT، catch-all ابزار target و قاعده نام‌دار رو ببین. یه پیام تست واقعی بفرست. پاسخ موفق signup فقط تأیید رو شروع میکنه؛ delivery ایمیل رو اثبات نمیکنه.",
  ] },
  { title: "Cloudflare 403 / permission denied / چند account", tags: "token scopes expired zone settings account ID wrangler", route: "generator", steps: [
    "هر هفت permission زیر «تنظیمات ایمیل» رو ببین، شامل Zone Settings Edit، resource scope، انقضای token و IP filter. tokenی که account/zone اشتباه رو میبینه نمیتونه اون دامنه رو deploy یا تنظیمات کنه.",
    "اگه لازم بود Cloudflare account ID مورد نظر رو ست کن. «ذخیره token فقط» اطلاعات ورودs روی همین دستگاه رو بدون redeploy جایگزین میکنه. API token رو تو لاگ یا shell command history وارد کردن نکن.",
  ] },
  { title: "Routing نیاز به تأیید داره / بعد از مرور تغییر کرده / مشغول", tags: "409 fingerprint catch-all race deploy lock", route: "generator", steps: [
    "مقصد catch-all موجود رو ببین و فقط تغییر پیشنهادی فعلی رو تأیید کن. اگه قاعده تغییر کرده، setup رو دوباره لود کن و fingerprint جدید رو ببین. اگه نمی‌خوای ایمیل نامتقابل diversion بشه، routing فعلی رو نگه دار.",
    "۴۰۹ مشغول یعنی یه عملیات ایمیل دیگه در جریانه. بذار تموم بشه؛ deploy/routing هم‌زمان رو اجرا نکن و guard تأیید رو غیرفعال نکن.",
  ] },
  { title: "بررسی‌کننده هوش مصنوعی در دسترس نیست / ریکWEST vision reject", tags: "captcha model images custom endpoint key no pool bootstrap", route: "generator", steps: [
    "حل فقط-AI یا یه اکانت vision-capable قابل استفاده از طریق این درگاه یا یه endpoint vision سفارشی تنظیمات‌شده نیاز داره. pool خالی یا cap‌شده نمیتونه judge پشت درگاه رو bootstrap کنه.",
    "URL endpoint، API key، ID مدل دقیق، ساپورت input تصویر و limit سرویس رو چک کن. مدل فقط-text نمیتونه screenshot رو judge کنه. خطای judge رو ببین؛ فرض نکن fail مرورگر یا fail ایمیل یه مشکل AIه.",
  ] },
  { title: "کد امنیتی fail / F001 / signup fail مکرر", tags: "Aliyun drag browser device verification retries", route: "generator", steps: [
    "ببین fail launch مرورگر، حل challenge، ارسال signup، تأیید ایمیل یا دریافت plانه. برای تشخیص یه ابزار نگه دار و از context مرورگر تنظیمات‌شده استفاده کن تا به مرحله برسی.",
    "F001 میتونه شامل device/browser verification باشه؛ pipeline از headed Chromium استفاده میکنه، شامل Xvfb. جایگزینی headless native، retry بیشتر یا تغییر judge guarantee موفقیت نیست. اگه مرحله پیش‌نیاز صندوق/شبکه خرابه، attempts مکرر رو متوقف کن.",
  ] },
  { title: "Generator پیدا نشد / Python گم / executable Chromium گم", tags: "environment packages Playwright install locate permission", route: "generator", steps: [
    "اسکریپت‌ها رو locate کن، «تجهیزات محیط» رو اجرا و خروجی کاملش رو ببین. تأیید کن Python و مرورگر تنظیمات‌شده مال این نصبه و user سرویس میتونه بخونه/اجرا کنه.",
    "روی Linux libraryهای مشترک، فضای disk در دسترس و Xvfb رو هم چک کن. helper .exe ویندوزی رو روی Linux کپی نکن؛ installer یه helper native برای معماری سرور رو bundle میکنه.",
  ] },
  { title: "تعامل دستی نیاز به DISPLAY / Xvfb گم", tags: "desktop virtual headless VPS browser window", route: "generator", steps: [
    "روی سرور Linux بدون display از حل AI/خودکار و display مجازی استفاده کن. «دستی» نیاز به دسکتاپ تعاملی واقعی داره؛ SSH به‌تنهایی هیچی نمیده. اگه launch پشت‌صاف Xvfb گم گفت، نصب/ترمیم کن.",
    "تنظیمات ذخیره‌شده مرورگر فقط روی ابزارهای جدید اعمال میشه. kill کردن ابزارهای موجود اخلال‌گره؛ تغییر dropdown پنجره در حال اجرای فعلی رو جابه‌جا نمیکنه.",
  ] },
  { title: "اسکن پروکسی: ۰ زنده / همه TCP open", tags: "TUN Xray reset timeout CONNECT SOCKS rejected", route: "پروکسی", steps: [
    "هشدار شبکه و counter واقعی هر stage پروتکل رو بخون. مسیر TUN ممکنه همه TCP connect روی همین دستگاه رو قبول کنه؛ checker بعد handshake پروکسی رو لازم داره و concurrency رو cap میکنه. این تونل رو bypass نمیکنه.",
    "یه پروکسی قابل‌کار شناخته‌شده رو به‌عنوان control استفاده کن و exit/routing policy دیگه رو مقایسه کن. listهای عمومی ممکنه قدیمی باشن، CONNECT رو رد کنن، auth بخواهن یا در دسترس نباشن. افزایش concurrency اینا رو درست نمیکنه.",
  ] },
  { title: "Proxy TLS / certificate / MITM / auth fail", tags: "CA HTTPS 407 socks اطلاعات ورودs unsafe", route: "پروکسی", steps: [
    "پروتکل، پورت، auth پروکسی و اعتبار certificate رو چک کن. entry بد/MITM عمداً exclude میشن. certificate TLS interception یعنی کاندیدای امن نیست، نه.",
    "برای بالا بردن تعداد «سالم» TLS validation رو غیرفعال نکن. اگه شبکه‌ات عمداً TLS رو inspect میکنه، trust و policy رو با صاحب شبکه حل کن به‌جای اعتماد به certificate پروکسی تصادفی.",
  ] },
  { title: "JWT import reject / خروجی گرفتن ناسازگار / منقضی", tags: "share account version invalid malformed missing label", route: "accounts", steps: [
    "خروجی گرفتن کامل اکانت رو کپی کن، نه اسکرین‌شات، توکن masked، پیام truncat، یا کل snapshot فایل. وارد کردن یا version bundle ساپورت‌شده یا یه JWT CLI خام رو قبول میکنه.",
    "توکن باید validation سرویس رو پاس بده و account ID‌اش با bundle بخوره. اگه منقضی/revoke شده، از صاحب بخواه خروجی گرفتن جدید بده یا دوباره ورود کن. outage سرویس یعنی هیچی import نمیشه؛ بعد از بازگشت connectivity دوباره امتحان کن.",
    "fail clipboard روی HTTP ریموت ساده ممکنه security restriction مرورگر باشه. HTTPS استفاده کن؛ بعضی مرورگرها ممکنه access clipboard رو رد کنن. خروجی گرفتن رو تو پیام پشتیبانی منتشر نکن.",
  ] },
  { title: "درگاه در دسترس نیست / startup fail / TLS منقضی", tags: "service port firewall cert renew bind 8443 health", route: "server", steps: [
    "host/پورت و HTTPS config‌شده، health سرویس، فایروال و rule شبکه سرویس رو تأیید کن. bind 127.0.0.1 روی VPS نیاز به SSH tunnel داره؛ public در دسترس نیست.",
    "روی Linux `systemctl status zcodegateway` و `journalctl -u zcodegateway` رو ببین. برای TLS timer renewal، مسیر/مالکیت cert و reachability پورت ۸۰ رو ببین. داشبورد admin ریموت رو به‌عنوان راه‌حل معمولی روی HTTP ساده قرار نده.",
    "بعد از آپدیت، hard-refresh UI asset cache رو درست میکنه، نه سرویس متوقف‌شده. binary rollback رو نگه دار و قبل از تکرار آپدیت خطای startup رو ببین.",
  ] },
  { title: "Plan دریافت در دسترس نیست / giveaway برداشته شده / job متوقف", tags: "Start Plan 100M 500M global build issued false", route: "generator", steps: [
    "نتیجه دریافت رو ببین: تموم job با issued دسترسی فرق داره. سرویس میتونه کمپین رو برداره یا مجوز استفاده رو رد کنه. labelهای قدیمی ۱۰۰M/۵۰۰M guarantee نمیدن که offer هنوز در دسترسه.",
    "بعد از دریافت موفق plans/سهمیه رو بررسی دوباره کن. اگه در دسترس نیست، از retry روی IPهای مختلف دست بردار: offer برداشته‌شده رو نمیسازه. به‌دلیل fail یه دریافت اختیاری اکانت رو purge نکن.",
  ] },
];

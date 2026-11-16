# نشر وِصال من الهاتف

## 1) رفع الملفات إلى GitHub
1. نزّل كل الملفات (15 ملفاً) إلى هاتفك.
2. في GitHub: New repository، الاسم `wisal`، اجعله **Private**.
3. اضغط **uploading an existing file** (أو Add file > Upload files).
4. اختر **كل الملفات معاً** (الملفات كلها في المجلد الرئيسي، بدون مجلدات).
5. اضغط Commit changes.

## 2) النشر على Vercel
1. افتح vercel.com وسجّل بحساب GitHub.
2. Add New > Project، واختر مستودع `wisal`.
3. Framework Preset: Vite (يُكتشف تلقائياً).
4. في **Environment Variables** أضف:
   - `VITE_SUPABASE_URL` = رابط مشروعك (https://xxxx.supabase.co)
   - `VITE_SUPABASE_ANON_KEY` = المفتاح العام anon public
   ممنوع إضافة service_role.
5. اضغط Deploy، وستحصل على رابط للتطبيق.

## 3) إعداد Supabase
- Authentication > URL Configuration: ضع رابط Vercel في Site URL.
- Authentication > Providers > Phone: فعّله. بدون مزوّد SMS استخدم **Test Phone Numbers**
  (رقم مع رمز ثابت) للتجربة فقط.

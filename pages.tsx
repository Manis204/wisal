import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from './supabase'
import { useAuth } from './auth'
import { friendlyError, isValidArabicName, toE164 } from './utils'

function ThemeToggle() {
  const [dark, setDark] = useState(document.documentElement.classList.contains('dark'))
  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }
  return (
    <button aria-label="تبديل الوضع الفاتح والداكن" className="btn-ghost" onClick={toggle}>
      {dark ? '☀️' : '🌙'}
    </button>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="fixed top-3 left-3">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}

function Logo() {
  return (
    <div className="text-center mb-6">
      <div className="mx-auto mb-3 h-16 w-16 rounded-2xl bg-brand-600 text-white grid place-items-center text-3xl font-black">
        و
      </div>
      <h1 className="text-2xl font-black">وِصال</h1>
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  if (!msg) return null
  return (
    <p
      role="alert"
      className="rounded-xl bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm p-3"
    >
      {msg}
    </p>
  )
}

export function Loading() {
  return (
    <Shell>
      <p className="text-center text-slate-500">جارٍ التحميل...</p>
    </Shell>
  )
}

export function Welcome() {
  return (
    <Shell>
      <Logo />
      <div className="card space-y-3 text-center">
        <p className="text-slate-600 dark:text-slate-300">
          مساحة تواصل خاصة وآمنة. الانضمام يتم بعد موافقة الإدارة.
        </p>
        <Link to="/register" className="btn block">
          إنشاء حساب
        </Link>
        <Link to="/login" className="btn-ghost block">
          لدي حساب، تسجيل الدخول
        </Link>
      </div>
    </Shell>
  )
}

export function Register() {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setErr('')
    const n = name.trim().replace(/\s+/g, ' ')
    if (!isValidArabicName(n))
      return setErr('الاسم المستعار يجب أن يكون بالعربية فقط (حروف وتشكيل ومسافات، من 2 إلى 30 حرفاً).')
    const p = toE164(phone)
    if (!p) return setErr('رقم الهاتف غير صحيح. مثال: 0612345678')
    if (pw.length < 8) return setErr('كلمة المرور يجب ألا تقل عن 8 أحرف.')
    setBusy(true)
    const { error } = await supabase.auth.signUp({
      phone: p,
      password: pw,
      options: { data: { display_name: n } },
    })
    setBusy(false)
    if (error) return setErr(friendlyError(error.message))
    sessionStorage.setItem('wisal_phone', p)
    nav('/verify')
  }

  return (
    <Shell>
      <Logo />
      <form onSubmit={submit} className="card space-y-3">
        <h2 className="font-bold text-lg">إنشاء حساب</h2>
        <input
          className="input"
          placeholder="الاسم المستعار (بالعربية)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          autoComplete="nickname"
        />
        <input
          className="input text-left"
          dir="ltr"
          inputMode="tel"
          placeholder="06XXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
        />
        <input
          className="input text-left"
          dir="ltr"
          type="password"
          placeholder="كلمة المرور (8 أحرف على الأقل)"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="new-password"
        />
        <ErrorBox msg={err} />
        <button className="btn" disabled={busy}>
          {busy ? 'جارٍ الإرسال...' : 'متابعة'}
        </button>
        <p className="text-sm text-center">
          لديك حساب؟{' '}
          <Link to="/login" className="link">
            تسجيل الدخول
          </Link>
        </p>
      </form>
    </Shell>
  )
}

export function Verify() {
  const nav = useNavigate()
  const phone = sessionStorage.getItem('wisal_phone')
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  if (!phone) {
    return (
      <Shell>
        <div className="card text-center space-y-3">
          <p>لا يوجد رقم قيد التحقق.</p>
          <Link to="/login" className="link">
            العودة لتسجيل الدخول
          </Link>
        </div>
      </Shell>
    )
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setErr('')
    setInfo('')
    setBusy(true)
    const { error } = await supabase.auth.verifyOtp({
      phone: phone as string,
      token: code.trim(),
      type: 'sms',
    })
    setBusy(false)
    if (error) return setErr('الرمز غير صحيح أو منتهي الصلاحية.')
    sessionStorage.removeItem('wisal_phone')
    nav('/')
  }

  async function resend() {
    setErr('')
    setInfo('')
    const { error } = await supabase.auth.resend({ type: 'sms', phone: phone as string })
    if (error) setErr(friendlyError(error.message))
    else setInfo('تم إرسال رمز جديد.')
  }

  return (
    <Shell>
      <Logo />
      <form onSubmit={submit} className="card space-y-3">
        <h2 className="font-bold text-lg">تأكيد رقم الهاتف</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          أرسلنا رمزاً إلى <span dir="ltr">{phone}</span>
        </p>
        <input
          className="input text-center tracking-widest text-xl"
          dir="ltr"
          inputMode="numeric"
          placeholder="------"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={8}
          autoComplete="one-time-code"
        />
        <ErrorBox msg={err} />
        {info && <p className="text-sm text-brand-700 dark:text-brand-500">{info}</p>}
        <button className="btn" disabled={busy || code.trim().length < 4}>
          {busy ? 'جارٍ التحقق...' : 'تأكيد'}
        </button>
        <button type="button" className="btn-ghost w-full" onClick={resend}>
          إعادة إرسال الرمز
        </button>
      </form>
    </Shell>
  )
}

export function Login() {
  const nav = useNavigate()
  const [phone, setPhone] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setErr('')
    const p = toE164(phone)
    if (!p) return setErr('رقم الهاتف غير صحيح. مثال: 0612345678')
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ phone: p, password: pw })
    setBusy(false)
    if (error) {
      if (/not confirmed/i.test(error.message)) {
        sessionStorage.setItem('wisal_phone', p)
        await supabase.auth.resend({ type: 'sms', phone: p })
        return nav('/verify')
      }
      return setErr(friendlyError(error.message))
    }
  }

  return (
    <Shell>
      <Logo />
      <form onSubmit={submit} className="card space-y-3">
        <h2 className="font-bold text-lg">تسجيل الدخول</h2>
        <input
          className="input text-left"
          dir="ltr"
          inputMode="tel"
          placeholder="06XXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
        />
        <input
          className="input text-left"
          dir="ltr"
          type="password"
          placeholder="كلمة المرور"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="current-password"
        />
        <ErrorBox msg={err} />
        <button className="btn" disabled={busy}>
          {busy ? 'جارٍ الدخول...' : 'دخول'}
        </button>
        <p className="text-sm text-center">
          ليس لديك حساب؟{' '}
          <Link to="/register" className="link">
            إنشاء حساب
          </Link>
        </p>
      </form>
    </Shell>
  )
}

function SignOutButton() {
  return (
    <button className="btn-ghost w-full" onClick={() => supabase.auth.signOut()}>
      تسجيل الخروج
    </button>
  )
}

export function Pending() {
  const { profile, refreshProfile } = useAuth()
  const [busy, setBusy] = useState(false)
  async function refresh() {
    setBusy(true)
    await refreshProfile()
    setBusy(false)
  }
  return (
    <Shell>
      <Logo />
      <div className="card space-y-3 text-center">
        <div className="text-4xl">⏳</div>
        <h2 className="font-bold text-lg">أهلاً {profile?.display_name}</h2>
        <p className="text-slate-600 dark:text-slate-300">
          تم إرسال طلبك إلى الإدارة وهو الآن قيد المراجعة. ستتمكن من الدخول بعد الموافقة.
        </p>
        <button className="btn" onClick={refresh} disabled={busy}>
          {busy ? 'جارٍ التحديث...' : 'تحديث الحالة'}
        </button>
        <SignOutButton />
      </div>
    </Shell>
  )
}

export function Rejected() {
  const [reason, setReason] = useState('')
  useEffect(() => {
    supabase
      .from('access_requests')
      .select('reject_reason')
      .maybeSingle()
      .then(({ data }) => setReason(data?.reject_reason ?? ''))
  }, [])
  return (
    <Shell>
      <Logo />
      <div className="card space-y-3 text-center">
        <h2 className="font-bold text-lg">تعذر قبول طلبك</h2>
        {reason && <p className="text-slate-600 dark:text-slate-300">{reason}</p>}
        <SignOutButton />
      </div>
    </Shell>
  )
}

export function Blocked() {
  return (
    <Shell>
      <Logo />
      <div className="card space-y-3 text-center">
        <h2 className="font-bold text-lg">الحساب غير متاح</h2>
        <p className="text-slate-600 dark:text-slate-300">
          حسابك موقوف أو معطل حالياً. تواصل مع الإدارة.
        </p>
        <SignOutButton />
      </div>
    </Shell>
  )
}

export function NoProfile() {
  return (
    <Shell>
      <div className="card space-y-3 text-center">
        <p>تعذر تحميل بيانات حسابك.</p>
        <SignOutButton />
      </div>
    </Shell>
  )
}

// صفحة رئيسية مؤقتة: تعرض المجموعات المسموح بها فقط (RLS يضمن ذلك من الخادم)
export function Home() {
  const { profile } = useAuth()
  const [groups, setGroups] = useState<{ id: string; name: string; description: string | null }[] | null>(null)

  useEffect(() => {
    supabase
      .from('groups')
      .select('id,name,description')
      .order('name')
      .then(({ data }) => setGroups(data ?? []))
  }, [])

  return (
    <Shell>
      <Logo />
      <div className="card space-y-4">
        <h2 className="font-bold text-lg">مرحباً {profile?.display_name}</h2>
        <div>
          <h3 className="font-semibold mb-2">مجموعاتي</h3>
          {groups === null && <p className="text-slate-500">جارٍ التحميل...</p>}
          {groups?.length === 0 && <p className="text-slate-500">لا توجد مجموعات.</p>}
          <ul className="space-y-2">
            {groups?.map((g) => (
              <li key={g.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="font-semibold">{g.name}</div>
                {g.description && (
                  <div className="text-sm text-slate-500">{g.description}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-slate-500">
          هذه واجهة الأساس فقط. المحادثات والمنشورات تأتي في الخطوات التالية.
        </p>
        <SignOutButton />
      </div>
    </Shell>
  )
}

import Link from "next/link";

function LineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386a.631.631 0 0 1-.629-.629V8.108c0-.345.284-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016a.63.63 0 0 1-.629.629.624.624 0 0 1-.512-.264l-2.443-3.317v2.952a.627.627 0 0 1-.627.629.628.628 0 0 1-.63-.629V8.108a.63.63 0 0 1 .63-.63.626.626 0 0 1 .512.262l2.44 3.32V8.108a.627.627 0 0 1 .629-.63c.346 0 .63.285.63.63v4.771zm-5.741 0a.629.629 0 0 1-.629.629.628.628 0 0 1-.629-.629V8.108c0-.345.283-.63.629-.63.345 0 .629.285.629.63v4.771zm-2.466.629H4.917a.63.63 0 0 1-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-black-2 text-black-5">
      {/* main footer body */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* left — org name + tagline */}
          <div className="max-w-sm">
            <p className="text-sm font-semibold text-black-6">
              KOSEN-KMITL Student Council 2026
            </p>
            <p className="mt-2 text-xs leading-6 text-black-4">
              เว็บไซต์นี้จัดทำโดยสโมสรนักศึกษา KOSEN-KMITL ประจำปีการศึกษา 2026
              เพื่อเป็นศูนย์กลางในการเผยแพร่ข่าวสาร กิจกรรม
              และประกาศสำคัญของโรงเรียน พร้อมทั้งเป็นสื่อกลางในการสื่อสาร
              ระหว่างโรงเรียน สโมสรนักศึกษา และนักศึกษา
              เพื่อให้ทุกคนสามารถเข้าถึงข้อมูลได้อย่างสะดวก รวดเร็ว และทั่วถึง
            </p>
          </div>

          {/* right — social links */}
          <div className="flex items-center gap-3 sm:pt-1">
            <Link
              href="https://line.me"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LINE"
              className="flex size-9 items-center justify-center rounded-full border border-black-4 text-black-4 transition-colors hover:border-black-6 hover:text-black-6"
            >
              <LineIcon />
            </Link>
            <Link
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex size-9 items-center justify-center rounded-full border border-black-4 text-black-4 transition-colors hover:border-black-6 hover:text-black-6"
            >
              <InstagramIcon />
            </Link>
          </div>
        </div>
      </div>

      {/* copyright bar */}
      <div className="border-t border-black-3/30 px-6 py-4">
        <p className="text-center text-xs text-black-4">
          @2026 KOSEN-KMITL student association. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

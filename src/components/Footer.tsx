import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/Logo";
import {
  FacebookIcon,
  InstagramIcon,
  SnapchatIcon,
  TikTokIcon,
  WhatsAppIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/SocialIcons";

// TODO: استبدل هذه الروابط بحسابات المنصة الفعلية قبل النشر
const socialLinks = [
  { name: "Instagram", href: "https://instagram.com/abdallahidris678", Icon: InstagramIcon },
  { name: "TikTok", href: "https://www.tiktok.com/@abdallahidris595?_r=1&_t=ZS-994aWre88Ht", Icon: TikTokIcon },
  { name: "X", href: "https://x.com/AbdallahId325", Icon: XIcon },
  { name: "Facebook", href: "https://www.facebook.com/abdallah.idris.545", Icon: FacebookIcon },
  { name: "WhatsApp", href: "https://wa.me/249967807618", Icon: WhatsAppIcon },
  { name: "Snapchat", href: "https://www.snapchat.com/add/b78341056", Icon: SnapchatIcon },
  { name: "YouTube", href: "https://www.youtube.com/@AbdallahIdris-p9i", Icon: YouTubeIcon },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-card/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Logo size={48} />
          <p className="mt-4 text-sm leading-7 text-muted-foreground">منصة وساطة عقارية تربط أصحاب العقارات التي تريد تأهيل وترميم أو تشطيب أو بناء أو الراغبين في إمتلاك عقار جديد مع أفضل شركات القطاع العقاري ، بإشراف كامل من إدارة المنصة

          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gold">المنصة</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/opportunities">المشاريع العقارية</Link>
            </li>
            <li>
              <Link to="/requests">طلباتي ومشاريعي</Link>
            </li>
            <li>
              <Link to="/account">حسابي ومستنداتي</Link>
            </li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-sm font-bold text-gold">تواصل معنا</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>support@synergy.com</li>
            <li dir="ltr" className="text-end">
              +249 96 780 7618
              <br />
              +249 11 930 2923
            </li>
            <li>الخرطوم-امدرمان-بحري، السودان</li>
          </ul>
          <div className="mt-4 flex items-center gap-3">
            {socialLinks.map(({ name, href, Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={name}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-gold hover:text-gold"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © 2026 Synergy — جميع الحقوق محفوظة
      </div>
    </footer>
  );
}
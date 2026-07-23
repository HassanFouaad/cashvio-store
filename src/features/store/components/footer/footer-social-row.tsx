import { buildStoreWhatsAppLink } from "@/lib/utils";
import {
  Facebook,
  Globe,
  Instagram,
  Mail,
  MessageCircle,
  Music2,
  Youtube,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { StoreFrontSocialMediaDto } from "../../types/store.types";

interface FooterSocialRowProps {
  socialMedia: StoreFrontSocialMediaDto;
  /** Center the icon row (CENTERED footer) */
  isCentered?: boolean;
}

/**
 * Social/contact icon row shared by every footer variant.
 */
export async function FooterSocialRow({
  socialMedia,
  isCentered,
}: FooterSocialRowProps) {
  const t = await getTranslations();
  const whatsAppLink = buildStoreWhatsAppLink(socialMedia);
  const linkClass =
    "text-muted-foreground hover:text-foreground transition-colors";

  return (
    <div
      className={`flex gap-3 sm:gap-4 ${isCentered ? "justify-center" : ""}`}
    >
      {whatsAppLink && (
        <a
          href={whatsAppLink}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          aria-label={t("contact.whatsapp")}
        >
          <MessageCircle className="h-5 w-5" />
        </a>
      )}
      {socialMedia.contactEmail && (
        <a
          href={`mailto:${socialMedia.contactEmail}`}
          className={linkClass}
          aria-label={t("contact.email")}
        >
          <Mail className="h-5 w-5" />
        </a>
      )}
      {socialMedia.facebook && (
        <a
          href={socialMedia.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          aria-label="Facebook"
        >
          <Facebook className="h-5 w-5" />
        </a>
      )}
      {socialMedia.instagram && (
        <a
          href={socialMedia.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          aria-label="Instagram"
        >
          <Instagram className="h-5 w-5" />
        </a>
      )}
      {socialMedia.tiktok && (
        <a
          href={socialMedia.tiktok}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          aria-label="TikTok"
        >
          <Music2 className="h-5 w-5" />
        </a>
      )}
      {socialMedia.youtube && (
        <a
          href={socialMedia.youtube}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          aria-label="YouTube"
        >
          <Youtube className="h-5 w-5" />
        </a>
      )}
      {socialMedia.website && (
        <a
          href={socialMedia.website}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          aria-label="Website"
        >
          <Globe className="h-5 w-5" />
        </a>
      )}
    </div>
  );
}

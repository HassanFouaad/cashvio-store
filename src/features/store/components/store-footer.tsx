import { resolveRequestTheme } from "@/lib/theme";
import {
  PublicStoreDto,
  StoreFrontThemeFooterVariant,
} from "../types/store.types";
import { FooterCentered } from "./footer/footer-centered";
import { FooterClassic } from "./footer/footer-classic";
import { FooterMinimal } from "./footer/footer-minimal";

interface StoreFooterProps {
  store: PublicStoreDto;
}

/**
 * Theme-aware footer dispatcher (server component — resolves the request
 * theme itself). Defaults to CLASSIC so stores without a theme render
 * exactly as before.
 */
export async function StoreFooter({ store }: StoreFooterProps) {
  const resolvedTheme = await resolveRequestTheme();

  switch (resolvedTheme.layout.footer) {
    case StoreFrontThemeFooterVariant.CENTERED:
      return <FooterCentered store={store} />;
    case StoreFrontThemeFooterVariant.MINIMAL:
      return <FooterMinimal store={store} />;
    case StoreFrontThemeFooterVariant.CLASSIC:
    default:
      return <FooterClassic store={store} />;
  }
}

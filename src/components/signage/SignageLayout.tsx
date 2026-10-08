import type { ReactNode } from "react";
export function SignageLayout({
  blueWhite = true,
  header,
  featured,
  media,
  ticker,
  footer,
}: {
  blueWhite?: boolean;
  header: ReactNode;
  featured: ReactNode;
  media: ReactNode;
  ticker: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className={`signage ${blueWhite ? "mercury-blue-white" : ""}`}>
      {header}
      <div className="content-area">
        {featured}
        {media}
      </div>
      {ticker}
      {footer}
    </main>
  );
}

import { Globe, ShieldCheck, Headphones } from "lucide-react";
import { company } from "../../config/company";
export function CompanyInfoStrip({ announcement }: { announcement?: string }) {
  return (
    <footer className="info-strip">
      <span>
        <Globe />
        {company.website}
      </span>
      <span className="announcement">{announcement}</span>
      <span>
        <ShieldCheck />
        Genuine products
      </span>
      <span>
        <Headphones />
        Expert support
      </span>
      {company.phone && <span>{company.phone}</span>}
      {company.address && <span>{company.address}</span>}
    </footer>
  );
}

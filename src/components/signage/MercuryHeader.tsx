import { useState } from "react";
import { company } from "../../config/company";
import { Radio } from "lucide-react";
import { DigitalClock } from "./DigitalClock";
import { signageConfig } from "../../config/signageConfig";
export function MercuryLogo({ loading = false }: { loading?: boolean } = {}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="brand-logo">
      {!failed ? (
        <img
          src={
            loading && company.loadingLogo ? company.loadingLogo : company.logo
          }
          alt="Mercury Computers Limited"
          onError={() => setFailed(true)}
        />
      ) : (
        <>
          <strong>
            mercury<span>®</span>
          </strong>
          <small>COMPUTERS LIMITED</small>
        </>
      )}
    </div>
  );
}
export function MercuryHeader() {
  return (
    <header className="header">
      <div className="channel">
        <span className="live-dot" />
        <span>MERCURY TV</span>
        <span className="channel-divider" />
        <small>YOUR TECHNOLOGY DESTINATION</small>
      </div>
      <div className="center-brand">
        <MercuryLogo />
      </div>
      <div className="header-right">
        <span className="showroom-label">
          <Radio size={15} /> SHOWROOM LIVE
        </span>
        {signageConfig.showClock && <DigitalClock />}
      </div>
    </header>
  );
}

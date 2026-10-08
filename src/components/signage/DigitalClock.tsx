import { useState, useEffect } from "react";
import { company } from "../../config/company";
export function DigitalClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="clock">
      <strong>
        {time.toLocaleTimeString("en-GB", {
          timeZone: company.timezone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}
      </strong>
      <span>
        {time.toLocaleDateString("en-GB", {
          timeZone: company.timezone,
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </span>
    </div>
  );
}

import type { Campaign, Announcement } from "../types/campaign";
export const mockCampaigns: Campaign[] = [
  {
    id: "business",
    eyebrow: "BUILT FOR YOUR NEXT BIG THING",
    title: "Big ideas.\nPowerful",
    accent: "possibilities.",
    description: "The technology to take your business further.",
    image: "/products/hero-laptop.png",
    tags: ["Premium laptops", "Expert advice", "Genuine products"],
  },
  {
    id: "back-to-school",
    eyebrow: "YOUR NEXT CHAPTER STARTS HERE",
    title: "Power up\nyour",
    accent: "semester.",
    description: "Learn, create and achieve more. All in one place.",
    image: "/products/laptop-2.png",
    tags: ["Laptops", "Printers", "Accessories"],
  },
  {
    id: "power",
    eyebrow: "BUSINESS WITHOUT INTERRUPTION",
    title: "Stay on.\nStay",
    accent: "ahead.",
    description: "Reliable power protection for everything that matters.",
    image: "/products/ups.png",
    tags: ["UPS systems", "Power protection", "Expert support"],
  },
  {
    id: "security",
    eyebrow: "CONNECTED. PROTECTED. READY.",
    title: "A smarter,\nsafer",
    accent: "business.",
    description: "Enterprise networking and security, built around you.",
    image: "/products/router.png",
    tags: ["Networking", "CCTV", "Cybersecurity"],
  },
];
export const mockAnnouncements: Announcement[] = [
  {
    id: "welcome",
    text: "Your next upgrade starts here. Speak to our team today.",
  },
  {
    id: "services",
    text: "IT infrastructure • Networking • Security • Maintenance • Technology leasing",
  },
];

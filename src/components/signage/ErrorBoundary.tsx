import { Component, type ReactNode } from "react";
import { mockProducts } from "../../data/mockProducts";
import { mockCampaigns } from "../../data/mockCampaigns";
import { CampaignSlide } from "./CampaignSlide";
import { useRotation } from "../../hooks/useRotation";
import { signageConfig } from "../../config/signageConfig";
function RecoveryDisplay() {
  const { index } = useRotation(
    mockProducts.length,
    signageConfig.campaignDuration,
  );
  const p = mockProducts[index];
  return (
    <div className="recovery-display">
      <CampaignSlide
        campaign={{
          ...mockCampaigns[0],
          title: p.name,
          accent: "Available at Mercury.",
          description: p.specifications?.join(" • ") || "",
          image: p.image,
        }}
      />
    </div>
  );
}
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.error("Mercury display recovered with bundled content", error);
  }
  render() {
    return this.state.failed ? <RecoveryDisplay /> : this.props.children;
  }
}

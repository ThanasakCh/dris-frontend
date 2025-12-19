import React from "react";

interface SkeletonLoaderProps {
  type?: "card" | "text" | "circle" | "rectangle";
  width?: string;
  height?: string;
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = "rectangle",
  width = "100%",
  height = "20px",
  count = 1,
}) => {
  const getSkeletonStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      backgroundColor: "#e5e7eb",
      borderRadius: type === "circle" ? "50%" : "8px",
      width,
      height,
      animation: "shimmer 1.5s infinite",
      backgroundImage:
        "linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)",
      backgroundSize: "200% 100%",
    };

    return baseStyle;
  };

  const skeletons = Array.from({ length: count }, (_, index) => (
    <div key={index} style={getSkeletonStyle()} />
  ));

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {skeletons}
      </div>
    </>
  );
};

export const FieldCardSkeleton: React.FC = () => {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-md)",
        marginBottom: "var(--space-md)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "120px 1fr auto",
          gap: "var(--space-md)",
          alignItems: "start",
        }}
      >
        {/* Thumbnail skeleton */}
        <SkeletonLoader type="rectangle" width="120px" height="90px" />

        {/* Content skeleton */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <SkeletonLoader width="60%" height="20px" />
          <SkeletonLoader width="40%" height="16px" />
          <SkeletonLoader width="80%" height="14px" />
        </div>

        {/* Action buttons skeleton */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <SkeletonLoader type="circle" width="32px" height="32px" />
          <SkeletonLoader type="circle" width="32px" height="32px" />
          <SkeletonLoader type="circle" width="32px" height="32px" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;

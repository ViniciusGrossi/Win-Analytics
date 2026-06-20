import { motion } from "framer-motion";

interface ScanOverlayProps {
  active: boolean;
}

export function ScanOverlay({ active }: ScanOverlayProps) {
  if (!active) return null;

  return (
    <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
      {/* Grid lines */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Corner markers */}
      {[
        "top-0 left-0 border-t-2 border-l-2",
        "top-0 right-0 border-t-2 border-r-2",
        "bottom-0 left-0 border-b-2 border-l-2",
        "bottom-0 right-0 border-b-2 border-r-2",
      ].map((classes, i) => (
        <div
          key={i}
          className={`absolute w-6 h-6 border-green-400 ${classes}`}
        />
      ))}

      {/* Scan beam */}
      <motion.div
        className="absolute left-0 right-0 h-0.5"
        style={{
          background: "linear-gradient(90deg, transparent, #22c55e, #4ade80, #22c55e, transparent)",
          boxShadow: "0 0 12px 4px rgba(34, 197, 94, 0.6)",
        }}
        animate={{ top: ["5%", "95%", "5%"] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Glow overlay */}
      <motion.div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, rgba(34,197,94,0.05) 0%, transparent 70%)" }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </div>
  );
}

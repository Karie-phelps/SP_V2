"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface AnimatedBackgroundProps {
  imagePath: string;
}

const AnimatedBackground = ({ imagePath }: AnimatedBackgroundProps) => {
  if (!imagePath || imagePath.trim() === "") {
    return (
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/70 to-black/90" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-2xl">
      <motion.div
        className="absolute inset-[-5%] w-[110%] h-[110%]"
        animate={{ x: ["0%", "-5%", "0%"], y: ["0%", "2%", "0%"] }}
        transition={{
          duration: 45,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      >
        <Image
          src={imagePath}
          alt="Forest Background"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-70"
        />
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
    </div>
  );
};

export default AnimatedBackground;

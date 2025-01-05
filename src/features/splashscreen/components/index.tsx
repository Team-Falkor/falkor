import bgImage from "@/assets/bg.png";
import logoImage from "@/assets/icon.png";
import "../styles.css";

const SplashScreen = () => {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background z-[9999]">
      <div className="splash-bg">
        <span />
        <img src={bgImage} alt="icon" />
      </div>

      <div className="splash-main">
        <img src={logoImage} alt="icon" />
      </div>
    </div>
  );
};

export default SplashScreen;

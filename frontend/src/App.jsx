import HeroSection from "./components/HeroSection/HeroSection.jsx";
import Footer from "./components/Footer/Footer.jsx";
import { AuthModalProvider } from "./context/AuthModalContext.jsx";
import "./index.css";

function App() {
  return (
    <AuthModalProvider>
      <main>
        <HeroSection />
        <Footer />
      </main>
    </AuthModalProvider>
  );
}

export default App;

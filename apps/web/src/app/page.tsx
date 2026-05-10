import Nav from "@/components/sections/Nav";
import Hero from "@/components/sections/Hero";
import Ticker from "@/components/sections/Ticker";
import Product from "@/components/sections/Product";
import HowItWorks from "@/components/sections/HowItWorks";
import Security from "@/components/sections/Security";
import ExtensionDemo from "@/components/sections/ExtensionDemo";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="top">
        <Hero />
        <Ticker />
        <Product />
        <HowItWorks />
        <Security />
        <ExtensionDemo />
      </main>
      <Footer />
    </>
  );
}

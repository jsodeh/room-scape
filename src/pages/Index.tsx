import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DesignStudio from "@/components/studio/DesignStudio";
export default function Index() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="page-width flex-1 pb-10 pt-8 sm:pt-10">
        <DesignStudio />
      </main>
      <Footer />
    </div>
  );
}

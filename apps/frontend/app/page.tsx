import { Navbar } from "@/components/common/Navbar";
import SearchBox from "@/components/common/SearchBox/SearchBox";
import Hero from "@/components/common/Hero";
import Footer from "@/components/common/Footer";
import { BackgroundPattern } from "@/components/background/BackgroundPattern";
import RoomCardList from "@/components/practicezoon/RoomCardList";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#111111]">
      <BackgroundPattern />

      <div className="relative flex min-h-screen flex-col">
        <Navbar />
        <Hero />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 sm:px-6 lg:px-8">
          <SearchBox />
          <RoomCardList />
        </main>

        <Footer />
      </div>
    </div>
  );
}
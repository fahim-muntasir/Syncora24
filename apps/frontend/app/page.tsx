import { Navbar } from "@/components/common/Navbar";
import SearchBox from "@/components/common/SearchBox/SearchBox";
import Hero from "@/components/common/Hero";
import { BackgroundPattern } from "@/components/background/BackgroundPattern";
import RoomCardList from "@/components/practicezoon/RoomCardList";



export default function Home() {
  return (
    <div className="min-h-screen  relative bg-[#1C1C1C]">
      <BackgroundPattern />
      <div className="relative">
        <Navbar />

        {/* Hero Section with Custom Illustration */}
        <Hero />

        {/* Rest of the content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <SearchBox />

          <RoomCardList />
        </div>
      </div>
    </div>
  );
}

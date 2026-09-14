import { ArrowRight } from 'lucide-react';

export function HeroSlider() {
  return (
    <div className="w-full h-[400px] bg-[#0A0A0A] rounded-2xl flex items-center border border-gray-800 relative overflow-hidden shadow-2xl">
      {/* Background Effects */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-red-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[500px] h-10 border-b-2 border-red-600/50 rounded-[100%] shadow-[0_0_50px_rgba(220,38,38,0.5)] pointer-events-none transform rotate-x-75" />
      
      <div className="relative z-10 grid grid-cols-2 gap-8 w-full h-full p-12">
        {/* Left Content */}
        <div className="flex flex-col justify-center">
          <p className="text-red-500 font-bold tracking-wider text-xs mb-3 uppercase">New Launch</p>
          <h1 className="text-5xl font-black text-white tracking-tight leading-[1.1] mb-2">
            Power Beyond
          </h1>
          <h2 className="text-5xl font-black text-red-600 tracking-tight mb-4">
            Limits
          </h2>
          <p className="text-gray-400 mb-8 max-w-sm text-sm leading-relaxed">
            Experience next gen performance with SUNX Technologies.
          </p>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <button className="bg-white text-gray-900 hover:bg-gray-100 px-6 py-2.5 rounded-full font-bold text-sm transition-colors flex items-center gap-2 w-fit">
              Shop Now
              <span className="bg-red-600 text-white rounded-full p-1 ml-1">
                <ArrowRight className="w-3 h-3" strokeWidth={3} />
              </span>
            </button>
            
            {/* Avatars */}
            <div className="flex items-center gap-3 border-l border-gray-800 pl-6">
              <div className="flex -space-x-3">
                <img className="w-8 h-8 rounded-full border-2 border-[#0A0A0A]" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&q=80" alt="Customer" />
                <img className="w-8 h-8 rounded-full border-2 border-[#0A0A0A]" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&q=80" alt="Customer" />
                <img className="w-8 h-8 rounded-full border-2 border-[#0A0A0A]" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&q=80" alt="Customer" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">10K+</div>
                <div className="text-gray-500 text-[10px]">Happy Customers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content (Laptop Image) */}
        <div className="relative flex items-center justify-center">
          <img 
            src="https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80" 
            alt="SX Laptop" 
            className="relative z-10 w-[90%] object-cover drop-shadow-2xl mix-blend-screen"
            style={{ filter: 'drop-shadow(0 0 30px rgba(220,38,38,0.2))' }}
          />
          {/* SX Overlay Text */}
          <div className="absolute right-10 top-20 text-8xl font-black italic text-white/5 tracking-tighter">
            SX
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-600"></div>
        <div className="w-2 h-2 rounded-full bg-gray-600"></div>
        <div className="w-2 h-2 rounded-full bg-gray-600"></div>
      </div>
    </div>
  );
}

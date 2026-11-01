import { Clock, MapPin, Truck } from 'lucide-react';
import { useBusinessStatus, RESTAURANT_INFO } from '../utils/businessHours';

export const AnnouncementBar = () => {
  const status = useBusinessStatus();

  return (
    <div className="bg-gradient-to-r from-[#DC2626] via-[#B91C1C] to-[#991B1B] text-white text-xs sm:text-sm py-2 px-4 shadow-md relative z-40 border-b border-red-700/50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Status Indicator */}
        <div className="flex items-center gap-2 font-medium">
          <span className="relative flex h-2.5 w-2.5">
            {status.isOpen ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-300"></span>
            )}
          </span>
          <span className="font-semibold text-amber-200">
            {status.statusText}
          </span>
          <span className="hidden sm:inline text-white/80">
            • {status.statusDetail}
          </span>
        </div>

        {/* Highlights */}
        <div className="hidden md:flex items-center gap-6 text-white/90 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span>Mar a Dom: 18:30 - 23:30 hrs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-300" />
            <span>{RESTAURANT_INFO.shortAddress}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-amber-300" />
            <span>Delivery & Retiro</span>
          </div>
        </div>
      </div>
    </div>
  );
};


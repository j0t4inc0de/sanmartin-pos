import { useState, useEffect } from 'react';
import { BusinessStatus } from '../types';

export const RESTAURANT_INFO = {
  name: 'Food Truck Sanguchería San Martín',
  slogan: 'Auténtico Sabor',
  address: 'Av. Gabriela Oriente #01216, Puente Alto, Región Metropolitana, Chile',
  shortAddress: 'Av. Gabriela Oriente #01216, Puente Alto',
  phone: '+56 9 8329 4514',
  phoneFormatted: '+56 9 8329 4514',
  whatsappNumber: '56983294514',
  instagram: '@foodtruck.sanmartin',
  instagramUrl: 'https://instagram.com/foodtruck.sanmartin',
  scheduleText: 'Martes a Domingo: 18:30 a 23:30 hrs',
  closedDayText: 'Lunes: Cerrado',
  googleMapsUrl: 'https://maps.google.com/?q=Av.+Gabriela+Oriente+01216,+Puente+Alto,+Regi%C3%B3n+Metropolitana,+Chile',
  wazeUrl: 'https://waze.com/ul?q=Av.+Gabriela+Oriente+01216,+Puente+Alto',
  pedidosYaUrl: 'https://www.pedidosya.cl',
  uberEatsUrl: 'https://www.ubereats.com'
};

export function getSantiagoTime(date: Date = new Date()): { day: number; currentMinutes: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(date);
  let weekdayStr = '';
  let hours = 0;
  let minutes = 0;

  for (const part of parts) {
    if (part.type === 'weekday') weekdayStr = part.value;
    else if (part.type === 'hour') hours = parseInt(part.value, 10);
    else if (part.type === 'minute') minutes = parseInt(part.value, 10);
  }
  if (hours === 24) hours = 0;

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const day = weekdayMap[weekdayStr] ?? 0;
  return { day, currentMinutes: hours * 60 + minutes };
}

export function getBusinessStatus(now: Date = new Date()): BusinessStatus {
  const { day, currentMinutes } = getSantiagoTime(now);

  const openMinutes = 18 * 60 + 30;  // 18:30 -> 1110 min
  const closeMinutes = 23 * 60 + 30; // 23:30 -> 1410 min

  const isMonday = day === 1;

  if (isMonday) {
    return {
      isOpen: false,
      statusText: 'Cerrado hoy lunes',
      statusDetail: 'Abrimos mañana martes a las 18:30 hrs',
      badgeColor: 'rose',
      nextOpenText: 'Martes 18:30 hrs'
    };
  }

  if (currentMinutes >= openMinutes && currentMinutes <= closeMinutes) {
    const remainingMin = closeMinutes - currentMinutes;
    const hoursLeft = Math.floor(remainingMin / 60);
    const minsLeft = remainingMin % 60;
    
    let timeRemainingStr = '';
    if (hoursLeft > 0) {
      timeRemainingStr = `(Cierra en ${hoursLeft}h ${minsLeft}m)`;
    } else {
      timeRemainingStr = `(Cierra en ${minsLeft}m)`;
    }

    return {
      isOpen: true,
      statusText: '¡Estamos Abiertos!',
      statusDetail: `Atendiendo hoy hasta las 23:30 hrs ${timeRemainingStr}`,
      badgeColor: 'emerald',
      nextOpenText: 'Hoy hasta las 23:30 hrs'
    };
  }

  if (currentMinutes < openMinutes) {
    return {
      isOpen: false,
      statusText: 'Cerrado por ahora',
      statusDetail: 'Abrimos hoy a las 18:30 hrs',
      badgeColor: 'amber',
      nextOpenText: 'Hoy 18:30 hrs'
    };
  }

  // After 23:30
  const isSunday = day === 0;
  return {
    isOpen: false,
    statusText: 'Cerrado por hoy',
    statusDetail: isSunday ? 'Abrimos el martes a las 18:30 hrs (lunes descansamos)' : 'Abrimos mañana a las 18:30 hrs',
    badgeColor: 'amber',
    nextOpenText: isSunday ? 'Martes 18:30 hrs' : 'Mañana 18:30 hrs'
  };
}

export function useBusinessStatus(): BusinessStatus {
  const [status, setStatus] = useState<BusinessStatus>(() => getBusinessStatus());

  useEffect(() => {
    setStatus(getBusinessStatus());
    const intervalId = setInterval(() => {
      setStatus(getBusinessStatus());
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  return status;
}

export function formatPriceCLP(price: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(price);
}

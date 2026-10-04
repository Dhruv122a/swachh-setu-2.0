// Mock Indore ward geometry in a 1000 x 700 SVG space.
export const BOUNDS = { minLat: 22.685, maxLat: 22.765, minLng: 75.825, maxLng: 75.915 };

export const project = (lat, lng) => ({
  x: ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 1000,
  y: ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 700,
});

export const WARDS = [
  { ward: 12, name: "Sudama Nagar", points: "0,0 520,0 500,90 180,180 160,320 220,450 360,520 300,700 0,700", label: [110, 610], center: { lat: 22.699, lng: 75.835 } },
  { ward: 9, name: "Vijay Nagar", points: "520,0 1000,0 1000,170 780,230 560,200 500,90", label: [700, 40], center: { lat: 22.7533, lng: 75.8937 } },
  { ward: 24, name: "Khajrana", points: "780,230 1000,170 1000,470 820,440 760,330", label: [870, 220], center: { lat: 22.734, lng: 75.905 } },
  { ward: 5, name: "Palasia", points: "560,200 780,230 760,330 820,440 700,500 520,460 500,300", label: [600, 250], center: { lat: 22.724, lng: 75.883 } },
  { ward: 17, name: "Shivaji Nagar", points: "180,180 500,90 560,200 500,300 520,460 360,520 220,450 160,320", label: [250, 230], center: { lat: 22.7196, lng: 75.8577 } },
  { ward: 21, name: "Bhawarkuan", points: "360,520 520,460 700,500 820,440 1000,470 1000,700 300,700", label: [600, 660], center: { lat: 22.693, lng: 75.868 } },
];

export const ROADS = [
  { d: "M 260 700 C 380 520, 560 360, 960 0", w: 7, name: "AB Road" },
  { d: "M 0 330 C 300 300, 650 260, 1000 330", w: 5, name: "Ring Road" },
  { d: "M 120 0 C 200 200, 300 400, 420 700", w: 4 },
  { d: "M 0 520 C 250 560, 650 520, 1000 600", w: 4 },
  { d: "M 520 0 C 540 200, 600 420, 640 700", w: 3 },
  { d: "M 700 120 C 800 260, 900 380, 1000 420", w: 3 },
];

export const RIVER = "M 0 455 C 160 420, 260 520, 400 470 S 640 380, 760 420 S 930 520, 1000 505";

export const LANDMARKS = [
  { x: 330, y: 420, label: "Community Park" },
  { x: 455, y: 545, label: "Holkar College" },
  { x: 760, y: 120, label: "C21 Mall" },
  { x: 880, y: 300, label: "Ganesh Mandir" },
];

export const nearestWard = (lat, lng) =>
  WARDS.reduce((best, w) => {
    const d = (w.center.lat - lat) ** 2 + (w.center.lng - lng) ** 2;
    return d < best.d ? { w, d } : best;
  }, { w: WARDS[4], d: Infinity }).w;

export const inCity = (lat, lng) =>
  lat >= BOUNDS.minLat && lat <= BOUNDS.maxLat && lng >= BOUNDS.minLng && lng <= BOUNDS.maxLng;

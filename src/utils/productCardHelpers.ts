import { 
  Keyboard, ShieldCheck, Wrench, Zap, Battery, Monitor, Database, Printer, Droplet,
  Cpu, HardDrive, CheckCircle2, Clock, Palette
} from 'lucide-react';

export const getBrandLogo = (productName: string, brandName?: string): string | null => {
  const searchable = (brandName || productName).toLowerCase();
  
  if (searchable.includes('dell')) return 'https://upload.wikimedia.org/wikipedia/commons/1/18/Dell_logo_2016.svg';
  if (searchable.includes('hp')) return 'https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg';
  if (searchable.includes('lenovo')) return 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Lenovo_logo_2015.svg';
  if (searchable.includes('asus')) return 'https://upload.wikimedia.org/wikipedia/commons/2/2e/ASUS_Logo.svg';
  if (searchable.includes('apple') || searchable.includes('macbook')) return 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg';
  if (searchable.includes('acer')) return 'https://upload.wikimedia.org/wikipedia/commons/0/00/Acer_2011.svg';
  if (searchable.includes('msi')) return 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Micro-Star_International_logo.svg';
  if (searchable.includes('kingston')) return 'https://upload.wikimedia.org/wikipedia/commons/3/36/Kingston_Technology_logo.svg';
  if (searchable.includes('transcend')) return 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Transcend_logo.svg';
  if (searchable.includes('wd ') || searchable.includes('western digital')) return 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Western_Digital_logo.svg';
  if (searchable.includes('seagate')) return 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Seagate_logo.svg';
  
  return null;
};

export const getQualityTag = (productName: string, categoryName: string = ''): string => {
  const searchable = (productName + ' ' + categoryName).toLowerCase();
  
  if (searchable.includes('keyboard') || searchable.includes('battery') || searchable.includes('screen') || searchable.includes('fan') || searchable.includes('adapter')) {
    if (searchable.includes('hp')) return "Original HP Part";
    if (searchable.includes('dell')) return "Genuine Dell Part";
    if (searchable.includes('lenovo')) return "Lenovo Original";
    return "Genuine Replacement";
  }
  
  if (searchable.includes('laptop')) return "Official Warranty";
  if (searchable.includes('ssd') || searchable.includes('ram')) return "High Performance";
  if (searchable.includes('ink') || searchable.includes('cartridge')) return "Vivid Colors";
  
  return "Premium Quality";
};

export const getProductFeatures = (productName: string, categoryName: string = '') => {
  const searchable = (productName + ' ' + categoryName).toLowerCase();
  
  // Keyboards
  if (searchable.includes('keyboard')) {
    return [
      { Icon: Keyboard, text: "Comfortable Typing" },
      { Icon: ShieldCheck, text: "Durable Build" },
      { Icon: Wrench, text: "Easy Install" }
    ];
  }
  // Batteries
  if (searchable.includes('battery')) {
    return [
      { Icon: Battery, text: "Long Life" },
      { Icon: ShieldCheck, text: "Safe & Reliable" },
      { Icon: Zap, text: "Stable Power" }
    ];
  }
  // RAM & CPU
  if (searchable.includes('ram') || searchable.includes('memory')) {
    return [
      { Icon: Cpu, text: "Fast Speeds" },
      { Icon: Zap, text: "Low Latency" },
      { Icon: CheckCircle2, text: "Compatible" }
    ];
  }
  // SSD / Storage
  if (searchable.includes('ssd') || searchable.includes('hdd') || searchable.includes('drive')) {
    return [
      { Icon: HardDrive, text: "High Capacity" },
      { Icon: Zap, text: "Fast Transfer" },
      { Icon: ShieldCheck, text: "Reliable" }
    ];
  }
  // Display / Screen
  if (searchable.includes('screen') || searchable.includes('display')) {
    return [
      { Icon: Monitor, text: "Crisp Display" },
      { Icon: Palette, text: "Vivid Colors" },
      { Icon: Wrench, text: "Exact Fit" }
    ];
  }
  // Ink
  if (searchable.includes('ink') || searchable.includes('cartridge')) {
    return [
      { Icon: Printer, text: "Clear Prints" },
      { Icon: Droplet, text: "High Yield" },
      { Icon: ShieldCheck, text: "No Smudging" }
    ];
  }
  // Laptops
  if (searchable.includes('laptop')) {
    return [
      { Icon: Zap, text: "Powerful" },
      { Icon: Monitor, text: "FHD Display" },
      { Icon: Battery, text: "All-day Battery" }
    ];
  }
  
  // Fallback
  return [
    { Icon: CheckCircle2, text: "High Quality" },
    { Icon: ShieldCheck, text: "Reliable" },
    { Icon: Clock, text: "Long Lasting" }
  ];
};

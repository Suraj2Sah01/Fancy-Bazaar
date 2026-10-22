export interface SpecField {
  key: string;
  label: string;
  placeholder: string;
  helper?: string;
}

export interface SpecGroup {
  id: string;
  title: string;
  iconName: 'Watch' | 'Monitor' | 'Cpu' | 'Wifi' | 'Camera' | 'Battery' | 'Activity' | 'Sparkles' | 'Package';
  description: string;
  fields: SpecField[];
}

export const SMARTWATCH_SPEC_GROUPS: SpecGroup[] = [
  {
    id: 'general',
    title: 'General & Design',
    iconName: 'Watch',
    description: 'Model, design, build quality, and body materials',
    fields: [
      { key: 'Model Name', label: 'Model Name / Series', placeholder: 'e.g. Ultra 4G Android Smartwatch' },
      { key: 'Brand', label: 'Brand', placeholder: 'e.g. Fancy Bazaar / Ultra Series' },
      { key: 'Dial Shape', label: 'Dial Shape', placeholder: 'e.g. Square / Round / Rectangular' },
      { key: 'Case / Body Material', label: 'Case / Dial Material', placeholder: 'e.g. Titanium Finish Alloy / Zinc Alloy' },
      { key: 'Strap Material', label: 'Strap Material & Type', placeholder: 'e.g. Ocean Band Silicone / Stainless Steel' },
      { key: 'Water Resistance', label: 'Water Resistance / IP Rating', placeholder: 'e.g. IP67 Splash & Sweat Proof' },
      { key: 'Ideal For', label: 'Ideal For / Gender', placeholder: 'e.g. Unisex, Men, Women, Teens' },
      { key: 'Weight', label: 'Weight', placeholder: 'e.g. 52 g' },
    ]
  },
  {
    id: 'display',
    title: 'Display & Touchscreen',
    iconName: 'Monitor',
    description: 'Screen size, resolution, panel type and display tech',
    fields: [
      { key: 'Display Size', label: 'Display Size', placeholder: 'e.g. 2.04 inch / 1.96 inch' },
      { key: 'Display Type', label: 'Display Type / Technology', placeholder: 'e.g. HD AMOLED / Super Retina IPS' },
      { key: 'Resolution', label: 'Screen Resolution', placeholder: 'e.g. 368 x 448 Pixels / 410 x 502 Pixels' },
      { key: 'Always On Display (AOD)', label: 'Always On Display (AOD)', placeholder: 'e.g. Yes / Supported' },
      { key: 'Touchscreen', label: 'Touchscreen Type', placeholder: 'e.g. Full Capacitive Multi-touch' },
      { key: 'Peak Brightness', label: 'Peak Brightness', placeholder: 'e.g. 800 nits / 1000 nits Sunlight Visible' },
      { key: 'Refresh Rate', label: 'Refresh Rate', placeholder: 'e.g. 60 Hz Smooth Display' },
      { key: 'Glass Protection', label: 'Glass Protection', placeholder: 'e.g. 2.5D Curved Scratch-Proof Glass' },
    ]
  },
  {
    id: 'performance',
    title: 'Processor, OS & Apps (Android)',
    iconName: 'Cpu',
    description: 'Android version, RAM, Storage (ROM), Chipset and App Support',
    fields: [
      { key: 'Operating System', label: 'Operating System (OS)', placeholder: 'e.g. Android 8.1 / Android 9.0 / Wear OS' },
      { key: 'RAM', label: 'RAM', placeholder: 'e.g. 1 GB / 2 GB / 4 GB' },
      { key: 'Internal Storage (ROM)', label: 'Internal Storage (ROM)', placeholder: 'e.g. 16 GB / 32 GB / 64 GB' },
      { key: 'Processor / CPU', label: 'Processor / CPU Chipset', placeholder: 'e.g. Quad-Core SC9832E High Speed' },
      { key: 'Google Play Store', label: 'Google Play Store Support', placeholder: 'e.g. Yes, Pre-installed Play Store' },
      { key: 'Supported Apps', label: 'Supported Apps', placeholder: 'e.g. WhatsApp, YouTube, Instagram, Facebook, Google Maps' },
    ]
  },
  {
    id: 'connectivity',
    title: 'Connectivity & Calling',
    iconName: 'Wifi',
    description: 'SIM card, 4G VoLTE, Wi-Fi, Bluetooth, and GPS navigation',
    fields: [
      { key: 'SIM Support', label: 'SIM Card Slot / Type', placeholder: 'e.g. Nano 4G SIM Card Slot' },
      { key: 'Network Type', label: 'Cellular Network', placeholder: 'e.g. 4G LTE, 3G, 2G, VoLTE Calling' },
      { key: 'Calling Function', label: 'Calling Support', placeholder: 'e.g. Direct 4G SIM Calling + Bluetooth Calling' },
      { key: 'Wi-Fi', label: 'Wi-Fi Support', placeholder: 'e.g. Yes, 2.4 GHz High-Speed Wi-Fi' },
      { key: 'Bluetooth Version', label: 'Bluetooth Version', placeholder: 'e.g. v5.2 / v5.0 Dual Mode' },
      { key: 'GPS Navigation', label: 'GPS Navigation', placeholder: 'e.g. Built-in Independent GPS / AGPS' },
      { key: 'Microphone & Speaker', label: 'Microphone & Speaker', placeholder: 'e.g. Built-in HD Mic & Loudspeaker' },
    ]
  },
  {
    id: 'camera',
    title: 'Camera & Video Calling',
    iconName: 'Camera',
    description: 'Camera resolution, placement, video call capabilities',
    fields: [
      { key: 'Camera', label: 'Camera Support', placeholder: 'e.g. Yes, Built-in Camera' },
      { key: 'Camera Resolution', label: 'Camera Resolution / Placement', placeholder: 'e.g. 5 MP 180° Rotating Camera / Dual Camera' },
      { key: 'Video Call / Recording', label: 'Video Call / Recording', placeholder: 'e.g. HD Video Calling on WhatsApp & Recording' },
    ]
  },
  {
    id: 'battery',
    title: 'Battery & Power',
    iconName: 'Battery',
    description: 'Capacity, battery backup, standby time and charging method',
    fields: [
      { key: 'Battery Capacity', label: 'Battery Capacity', placeholder: 'e.g. 800 mAh / 1000 mAh / 1280 mAh' },
      { key: 'Battery Backup', label: 'Battery Backup / Usage Time', placeholder: 'e.g. 1 - 2 Days Normal Use, 24 Hours on 4G' },
      { key: 'Standby Time', label: 'Standby Time', placeholder: 'e.g. Up to 5 - 7 Days' },
      { key: 'Charging Time', label: 'Charging Time', placeholder: 'e.g. 1.5 - 2 Hours' },
      { key: 'Charger Type', label: 'Charger Type', placeholder: 'e.g. Magnetic Pin Charging / Wireless Dock' },
    ]
  },
  {
    id: 'fitness',
    title: 'Health, Fitness & Sensors',
    iconName: 'Activity',
    description: 'Heart rate, SpO2, sleep monitor, step counter and fitness tracking',
    fields: [
      { key: 'Heart Rate Monitor', label: 'Heart Rate Monitor', placeholder: 'e.g. Real-Time 24/7 Optical Heart Rate' },
      { key: 'SpO2 Blood Oxygen', label: 'SpO2 Blood Oxygen', placeholder: 'e.g. Yes, Real-Time Blood Oxygen Tracking' },
      { key: 'Blood Pressure', label: 'Blood Pressure Tracker', placeholder: 'e.g. Optical BP Estimation' },
      { key: 'Sleep Tracker', label: 'Sleep Monitoring', placeholder: 'e.g. Deep & Light Sleep Analysis' },
      { key: 'Step Counter / Pedometer', label: 'Step Counter / Calorie Meter', placeholder: 'e.g. Yes, Accurate Daily Step & Calorie Tracking' },
      { key: 'Sports Modes', label: 'Sports & Workout Modes', placeholder: 'e.g. Multi-Sports: Running, Walking, Cycling, Gym' },
      { key: 'Built-in Sensors', label: 'Motion & Bio Sensors', placeholder: 'e.g. 3-Axis G-Sensor, Optical Heart Rate Sensor' },
    ]
  },
  {
    id: 'smartFeatures',
    title: 'Smart Features & Utilities',
    iconName: 'Sparkles',
    description: 'Voice assistant, media players, smart notifications and apps',
    fields: [
      { key: 'Voice Assistant', label: 'Voice Assistant', placeholder: 'e.g. Google Assistant / Siri Voice Command' },
      { key: 'Music Player & Storage', label: 'Music Player & Storage', placeholder: 'e.g. Local MP3 Music Storage & Playback' },
      { key: 'Video Player', label: 'Video Player', placeholder: 'e.g. Full HD Video Playback & YouTube' },
      { key: 'Smart Notifications', label: 'Smart Notifications', placeholder: 'e.g. WhatsApp, Calls, SMS, Social Media Alerts' },
      { key: 'Utility Apps', label: 'Utility Tools', placeholder: 'e.g. Calculator, Calendar, Alarm Clock, Stopwatch, Sound Recorder' },
      { key: 'Security Lock', label: 'Lock / Security', placeholder: 'e.g. PIN / Pattern Password Lock' },
    ]
  },
  {
    id: 'boxWarranty',
    title: 'In The Box & Warranty',
    iconName: 'Package',
    description: 'Package contents and warranty information',
    fields: [
      { key: 'Package Contents', label: 'Package Contents (In The Box)', placeholder: 'e.g. 1x Smart Watch, 1x Ocean Strap, 1x Magnetic Charging Cable, User Manual' },
      { key: 'Warranty Period', label: 'Warranty Period', placeholder: 'e.g. 6 Months / 1 Year Manufacturer Warranty' },
      { key: 'Warranty Type', label: 'Warranty Service Type', placeholder: 'e.g. Replacement / Repair Warranty' },
    ]
  }
];

export const SAMPLE_ANDROID_SMARTWATCH_SPECS: Record<string, Record<string, string>> = {
  'General & Design': {
    'Model Name': 'Ultra 4G Android Smart Watch',
    'Brand': 'Fancy Bazaar',
    'Dial Shape': 'Square',
    'Case / Body Material': 'Zinc Titanium Alloy',
    'Strap Material': 'Ocean Silicone Strap (Interchangeable)',
    'Water Resistance': 'IP67 Water & Dust Resistant',
    'Ideal For': 'Unisex (Men & Women)',
    'Weight': '52 g'
  },
  'Display & Touchscreen': {
    'Display Size': '2.04 inch',
    'Display Type': 'HD AMOLED Curved Display',
    'Resolution': '368 x 448 Pixels',
    'Always On Display (AOD)': 'Yes',
    'Touchscreen': 'Full Capacitive Multi-touch',
    'Peak Brightness': '800 nits',
    'Refresh Rate': '60 Hz',
    'Glass Protection': '2.5D Curved Scratch-Resistant Glass'
  },
  'Processor, OS & Apps (Android)': {
    'Operating System': 'Android 8.1 OS',
    'RAM': '2 GB',
    'Internal Storage (ROM)': '16 GB',
    'Processor / CPU': 'Quad-Core SC9832E High Speed Processor',
    'Google Play Store': 'Yes, Pre-installed Play Store',
    'Supported Apps': 'WhatsApp, YouTube, Instagram, Facebook, Google Maps, Chrome'
  },
  'Connectivity & Calling': {
    'SIM Support': 'Nano 4G SIM Card Slot',
    'Network Type': '4G LTE, 3G, 2G, VoLTE Calling',
    'Calling Function': 'Direct 4G SIM Calling + Bluetooth Calling',
    'Wi-Fi': 'Yes, 2.4 GHz High-Speed Wi-Fi',
    'Bluetooth Version': 'v5.2 Dual Mode',
    'GPS Navigation': 'Built-in Independent GPS / AGPS Navigation',
    'Microphone & Speaker': 'Built-in HD Microphone & High-Volume Loudspeaker'
  },
  'Camera & Video Calling': {
    'Camera': 'Yes, Built-in Camera',
    'Camera Resolution': '5 MP 180° Rotating Camera',
    'Video Call / Recording': 'HD WhatsApp Video Calling & Video Recording'
  },
  'Battery & Power': {
    'Battery Capacity': '800 mAh High-Density Polymer Battery',
    'Battery Backup': '1 - 2 Days (Normal Use), 24 Hours on 4G LTE',
    'Standby Time': 'Up to 5 - 7 Days',
    'Charging Time': '1.5 - 2 Hours',
    'Charger Type': 'Magnetic Pin Fast Charging'
  },
  'Health, Fitness & Sensors': {
    'Heart Rate Monitor': 'Real-Time 24/7 Optical Heart Rate Sensor',
    'SpO2 Blood Oxygen': 'Yes, Real-Time Blood Oxygen Monitoring',
    'Blood Pressure': 'Optical BP Estimation',
    'Sleep Tracker': 'Deep & Light Sleep Quality Analysis',
    'Step Counter / Pedometer': 'Accurate Daily Step, Distance & Calorie Tracker',
    'Sports Modes': 'Multi-Sports (Running, Walking, Cycling, Football, etc.)',
    'Built-in Sensors': '3-Axis G-Sensor, Optical Heart Rate Sensor'
  },
  'Smart Features & Utilities': {
    'Voice Assistant': 'Google Assistant & Voice Command Support',
    'Music Player & Storage': 'Local MP3 Storage & Bluetooth Audio Playback',
    'Video Player': 'Full HD Video Playback & YouTube Streaming',
    'Smart Notifications': 'WhatsApp, SMS, Call Alerts, App Notifications',
    'Utility Apps': 'Calculator, Calendar, Alarm Clock, Stopwatch, Sound Recorder',
    'Security Lock': 'PIN & Pattern Password Lock'
  },
  'In The Box & Warranty': {
    'Package Contents': '1x Smart Watch, 1x Ocean Strap, 1x Magnetic Charging Cable, User Manual',
    'Warranty Period': '6 Months Manufacturer Warranty',
    'Warranty Type': 'Repair / Replacement Warranty'
  }
};

/**
 * Filter and clean specifications so only non-empty values are returned.
 * Crucial rule: "aur admin jo details na dale wah customer ko na dikhe"
 */
export function cleanSpecifications(specs: any): Record<string, Record<string, string>> {
  if (!specs || typeof specs !== 'object') return {};
  const cleaned: Record<string, Record<string, string>> = {};

  for (const [sectionKey, sectionVal] of Object.entries(specs)) {
    if (typeof sectionVal === 'object' && sectionVal !== null) {
      const subCleaned: Record<string, string> = {};
      for (const [k, v] of Object.entries(sectionVal as Record<string, any>)) {
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          subCleaned[k] = String(v).trim();
        }
      }
      if (Object.keys(subCleaned).length > 0) {
        cleaned[sectionKey] = subCleaned;
      }
    } else if (typeof sectionVal === 'string' && (sectionVal as string).trim() !== '') {
      // Flat specification fallback
      if (!cleaned['General']) cleaned['General'] = {};
      cleaned['General'][sectionKey] = (sectionVal as string).trim();
    }
  }

  return cleaned;
}

/**
 * Check if the product has at least one valid specification to display.
 */
export function hasValidSpecifications(specs: any): boolean {
  const cleaned = cleanSpecifications(specs);
  return Object.keys(cleaned).length > 0;
}

/**
 * Get top highlights to display in top pills/badges (e.g. Display, RAM/ROM, SIM, Battery)
 */
export function getTopHighlights(specs: any): { label: string; value: string; icon: string }[] {
  const cleaned = cleanSpecifications(specs);
  const highlights: { label: string; value: string; icon: string }[] = [];

  // Helper to search across sections
  const findValue = (...keys: string[]) => {
    for (const section of Object.values(cleaned)) {
      for (const [k, v] of Object.entries(section)) {
        if (keys.some(searchKey => k.toLowerCase().includes(searchKey.toLowerCase()))) {
          return v;
        }
      }
    }
    return null;
  };

  const sim = findValue('SIM Support', 'SIM Card', 'Network');
  if (sim) highlights.push({ label: 'Network', value: sim, icon: 'Wifi' });

  const display = findValue('Display Size', 'Display Type');
  if (display) highlights.push({ label: 'Display', value: display, icon: 'Monitor' });

  const ram = findValue('RAM');
  const rom = findValue('Internal Storage', 'ROM');
  if (ram && rom) {
    highlights.push({ label: 'Storage', value: `${ram} + ${rom}`, icon: 'Cpu' });
  } else if (rom) {
    highlights.push({ label: 'ROM', value: rom, icon: 'Cpu' });
  } else if (ram) {
    highlights.push({ label: 'RAM', value: ram, icon: 'Cpu' });
  }

  const os = findValue('Operating System', 'Android');
  if (os) highlights.push({ label: 'OS', value: os, icon: 'Cpu' });

  const battery = findValue('Battery Capacity');
  if (battery) highlights.push({ label: 'Battery', value: battery, icon: 'Battery' });

  const camera = findValue('Camera Resolution', 'Camera');
  if (camera && camera.toLowerCase() !== 'no') highlights.push({ label: 'Camera', value: camera, icon: 'Camera' });

  return highlights.slice(0, 5);
}

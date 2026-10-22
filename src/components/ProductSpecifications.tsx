import { useState } from 'react';
import { 
  Watch, Monitor, Cpu, Wifi, Camera, Battery, Activity, Sparkles, 
  Package, ChevronDown, CheckCircle2, Shield, Info, Layers
} from 'lucide-react';
import { cleanSpecifications, getTopHighlights } from '../data/smartwatchSpecs';

interface Props {
  specifications: any;
  productName?: string;
}

const SECTION_ICONS: Record<string, any> = {
  'General & Design': Watch,
  'Display & Touchscreen': Monitor,
  'Processor, OS & Apps (Android)': Cpu,
  'Connectivity & Calling': Wifi,
  'Camera & Video Calling': Camera,
  'Battery & Power': Battery,
  'Health, Fitness & Sensors': Activity,
  'Smart Features & Utilities': Sparkles,
  'In The Box & Warranty': Package,
  'General': Layers,
  'Custom Details': Info
};

export default function ProductSpecifications({ specifications, productName }: Props) {
  const cleaned = cleanSpecifications(specifications);
  const sections = Object.keys(cleaned);

  // If admin did not enter any specification, DO NOT show anything
  if (sections.length === 0) return null;

  const [activeSection, setActiveSection] = useState<string>(sections[0]);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const highlights = getTopHighlights(specifications);

  // Count total filled specifications
  const totalSpecsCount = sections.reduce((acc, sec) => acc + Object.keys(cleaned[sec]).length, 0);

  const getIconForSection = (sectionName: string) => {
    return SECTION_ICONS[sectionName] || Layers;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-8 transition-colors">
      {/* Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Watch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                Specifications & Features
              </h2>
              <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                {totalSpecsCount} Verified Details
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Technical specifications and device capabilities
            </p>
          </div>
        </div>

        <button 
          type="button"
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-transform duration-200"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Key Highlights Quick Chips */}
          {highlights.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/60">
              {highlights.map((item, idx) => {
                const IconComponent = item.icon === 'Wifi' ? Wifi :
                  item.icon === 'Monitor' ? Monitor :
                  item.icon === 'Cpu' ? Cpu :
                  item.icon === 'Battery' ? Battery : Camera;

                return (
                  <div key={idx} className="flex items-center gap-2.5 p-2 bg-white dark:bg-gray-900 rounded-xl shadow-xs border border-gray-100 dark:border-gray-800">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">{item.label}</p>
                      <p className="text-xs font-black text-gray-900 dark:text-white truncate">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Section Navigation Tabs (Desktop & Tablet) */}
          {sections.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-100 dark:border-gray-800">
              {sections.map(section => {
                const IconComp = getIconForSection(section);
                const isActive = activeSection === section;
                return (
                  <button
                    key={section}
                    type="button"
                    onClick={() => setActiveSection(section)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    <span>{section}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {Object.keys(cleaned[section]).length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Section Specs Table */}
          {cleaned[activeSection] && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                {(() => {
                  const IconComp = getIconForSection(activeSection);
                  return (
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <IconComp className="w-4 h-4" />
                    </div>
                  );
                })()}
                <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                  {activeSection}
                </h3>
              </div>

              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                {Object.entries(cleaned[activeSection]).map(([label, value], idx) => (
                  <div 
                    key={label}
                    className={`grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 sm:gap-4 transition-colors ${
                      idx % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-900'
                    }`}
                  >
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 sm:col-span-1">
                      {label}
                    </span>
                    <span className="text-xs font-black text-gray-900 dark:text-white sm:col-span-2 break-words">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* If multiple sections, show a clean 'View All Specs' overview grid */}
          {sections.length > 1 && (
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="font-bold">Other Sections:</span>
                {sections.filter(s => s !== activeSection).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setActiveSection(s)}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                  >
                    {s} ({Object.keys(cleaned[s]).length})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Genuine Trust Footnote */}
          <div className="flex items-center gap-2 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl text-indigo-700 dark:text-indigo-300 text-xs">
            <Shield className="w-4 h-4 shrink-0" />
            <span>All specifications listed above are authentic device parameters verified by merchant.</span>
          </div>
        </div>
      )}
    </div>
  );
}

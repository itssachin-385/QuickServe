import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Info, 
  Plus, 
  Check, 
  Trash2,
  Sparkles
} from 'lucide-react';
import { HomeServiceCard } from '../data/homeServices';

interface ServiceScopeModalProps {
  service: HomeServiceCard | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleAdd: (service: HomeServiceCard) => void;
  onProceed?: (service: HomeServiceCard) => void;
  isAdded: boolean;
  lang?: 'en' | 'hi';
}

export const ServiceScopeModal: React.FC<ServiceScopeModalProps> = ({
  service,
  isOpen,
  onClose,
  onToggleAdd,
  onProceed,
  isAdded,
  lang = 'en'
}) => {
  const [activeTab, setActiveTab] = useState<'both' | 'included' | 'excluded'>('both');

  if (!isOpen || !service) return null;

  const isHindi = lang === 'hi';
  const title = isHindi ? service.title_hi : service.title;
  const includedList = isHindi && service.includedTasks_hi?.length ? service.includedTasks_hi : service.includedTasks;
  const excludedList = isHindi && service.excludedTasks_hi?.length ? service.excludedTasks_hi : service.excludedTasks;
  const note = isHindi && service.materialsNote_hi ? service.materialsNote_hi : service.materialsNote;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 my-auto flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white p-1.5 border border-slate-200/80 flex items-center justify-center shadow-xs flex-shrink-0">
              <img 
                src={service.image} 
                alt={title} 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {service.filterGroup === 'cleaning' ? 'Cleaning' : service.filterGroup === 'kitchen' ? 'Kitchen' : 'Repairs'}
                </span>
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {service.duration_mins}m
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug mt-0.5">
                {title}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {service.tagline}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors flex-shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View Scope Tabs */}
        <div className="px-4 sm:px-5 pt-3 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50">
          <div className="flex items-center gap-1.5 text-xs font-bold pb-2.5">
            <button
              onClick={() => setActiveTab('both')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'both' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isHindi ? 'पूरा स्कोप' : 'All Scope'}
            </button>
            <button
              onClick={() => setActiveTab('included')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'included' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isHindi ? 'क्या करवा सकते हैं (Do\'s)' : 'Included (Do\'s)'}</span>
            </button>
            <button
              onClick={() => setActiveTab('excluded')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'excluded' 
                  ? 'bg-rose-600 text-white shadow-xs' 
                  : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{isHindi ? 'क्या शामिल नहीं (Don\'ts)' : 'Excluded (Don\'ts)'}</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* WHAT IS INCLUDED (DO's) */}
          {(activeTab === 'both' || activeTab === 'included') && (
            <div className="rounded-2xl p-4 bg-emerald-50/50 border border-emerald-200/80 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-emerald-950">
                    {isHindi ? 'आप यह सब करवा सकते हैं (What\'s Included / Do\'s)' : 'What is Included (Do\'s)'}
                  </h3>
                  <p className="text-[10px] text-emerald-700 font-medium">
                    {isHindi ? 'प्रोफेशनल द्वारा दी जाने वाली सेवाएं' : 'Standard tasks covered in this visit'}
                  </p>
                </div>
              </div>

              <ul className="space-y-2 pt-1">
                {includedList.map((task, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* WHAT IS NOT INCLUDED (DON'TS) */}
          {(activeTab === 'both' || activeTab === 'excluded') && (
            <div className="rounded-2xl p-4 bg-rose-50/50 border border-rose-200/80 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-rose-950">
                    {isHindi ? 'यह शामिल नहीं है (What\'s NOT Included / Don\'ts)' : 'What is NOT Included (Don\'ts)'}
                  </h3>
                  <p className="text-[10px] text-rose-700 font-medium">
                    {isHindi ? 'इन कार्यों के लिए अलग व्यवस्था या चार्ज लगेगा' : 'Excluded tasks or requires separate specialist booking'}
                  </p>
                </div>
              </div>

              <ul className="space-y-2 pt-1">
                {excludedList.map((task, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-slate-800">
                    <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* MATERIALS & HARDWARE NOTE */}
          {note && (
            <div className="rounded-2xl p-3.5 bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-black text-amber-900 block">
                  {isHindi ? 'सामान और तैयारी संबंधी जानकारी:' : 'Materials & Hardware Guidelines:'}
                </span>
                <p className="text-[11px] text-amber-800 font-medium leading-relaxed mt-0.5">
                  {note}
                </p>
              </div>
            </div>
          )}

          {/* TRUST BADGE */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Background-Verified Pro</span>
            </div>
            <div className="flex items-center gap-1 font-bold text-slate-800">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Pay after satisfaction</span>
            </div>
          </div>

        </div>

        {/* Modal Sticky Footer CTA */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/95 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                {isHindi ? 'शुरुआती कीमत' : 'Starting Rate'}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-slate-900">
                  ₹{service.startingPrice}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  • {service.duration_mins} mins
                </span>
              </div>
            </div>

            {isAdded && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{isHindi ? 'कार्ट में शामिल' : 'Added to Cart'}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isAdded ? (
              <>
                <button
                  onClick={() => onToggleAdd(service)}
                  className="px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition-colors flex items-center gap-1.5"
                  title="Remove from Cart"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'हटाएं' : 'Remove'}</span>
                </button>

                <button
                  onClick={() => {
                    if (onProceed) onProceed(service);
                    else onClose();
                  }}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-500 hover:to-teal-700 text-white active:scale-98"
                >
                  <span>{isHindi ? 'आगे बढ़ें (Proceed to Book)' : `Proceed to Checkout (₹${service.startingPrice})`}</span>
                  <span className="text-sm font-extrabold">→</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onToggleAdd(service)}
                  className="px-4 py-2.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{isHindi ? '+ कार्ट में जोड़ें' : '+ Add to Cart'}</span>
                </button>

                <button
                  onClick={() => {
                    onToggleAdd(service);
                    if (onProceed) onProceed(service);
                    else onClose();
                  }}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-500 hover:to-teal-700 text-white active:scale-98"
                >
                  <span>{isHindi ? 'अभी बुक करें (Proceed)' : 'Book Now & Proceed'}</span>
                  <span className="text-sm font-extrabold">→</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};


import React from 'react';
import { SettingsIcon, UserIcon, DollarIcon, MapPinIcon, CalendarIcon } from './Icons';
import { UserPreferences, Language } from '../types';

interface Props {
  preferences: UserPreferences;
  onUpdate: (key: keyof UserPreferences, value: string) => void;
  language: Language;
}

export const PreferencesPanel: React.FC<Props> = ({ preferences, onUpdate, language }) => {
  const isZh = language === 'zh';

  const t = {
    title: isZh ? "定制您的行程" : "Customize Your Trip",
    budget: isZh ? "预算" : "Budget",
    style: isZh ? "旅行风格" : "Travel Style",
    companions: isZh ? "同行者" : "Companions",
    location: isZh ? "出发地" : "Starting From",
    duration: isZh ? "天数" : "Duration",
    days: isZh ? "天" : "days",
    enterLoc: isZh ? "例如: 上海, 纽约" : "e.g. London, Shanghai",
    options: {
      budget: {
        any: isZh ? "任意预算" : "Any Budget",
        economy: isZh ? "经济型 / 背包客" : "Economy / Backpacker",
        moderate: isZh ? "舒适型 / 中端" : "Moderate / Comfortable",
        luxury: isZh ? "豪华型 / 高端" : "Luxury / High-end",
      },
      style: {
        any: isZh ? "任意风格" : "Any Style",
        adventure: isZh ? "户外与探险" : "Outdoor & Adventure",
        relaxation: isZh ? "休闲与康养" : "Relaxation & Wellness",
        culture: isZh ? "文化与历史" : "Culture & History",
        city: isZh ? "城市与夜生活" : "City & Nightlife",
        nature: isZh ? "自然与野生动物" : "Nature & Wildlife",
      },
      companions: {
        any: isZh ? "任意 / 未定" : "Any / Undecided",
        solo: isZh ? "独自一人" : "Solo Traveler",
        couple: isZh ? "情侣 / 浪漫" : "Couple / Romantic",
        family: isZh ? "家庭 (带孩子)" : "Family (with kids)",
        friends: isZh ? "朋友结伴" : "Group of Friends",
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
        <SettingsIcon className="w-5 h-5 text-slate-500" />
        <h3 className="font-semibold text-slate-700">{t.title}</h3>
      </div>
      
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Origin Location */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <MapPinIcon className="w-4 h-4 text-red-500" />
            {t.location}
          </label>
          <input 
            type="text"
            value={preferences.originLocation}
            onChange={(e) => onUpdate('originLocation', e.target.value)}
            placeholder={t.enterLoc}
            className="w-full rounded-lg border-slate-300 border bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Trip Duration */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <CalendarIcon className="w-4 h-4 text-orange-500" />
            {t.duration}
          </label>
          <select 
            value={preferences.tripDuration}
            onChange={(e) => onUpdate('tripDuration', e.target.value)}
            className="w-full rounded-lg border-slate-300 border bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="1-3">1-3 {t.days}</option>
            <option value="3-5">3-5 {t.days}</option>
            <option value="5-7">5-7 {t.days}</option>
            <option value="7-10">7-10 {t.days}</option>
            <option value="10-14">10-14 {t.days}</option>
            <option value="14+">14+ {t.days}</option>
          </select>
        </div>

        {/* Budget */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <DollarIcon className="w-4 h-4 text-emerald-500" />
            {t.budget}
          </label>
          <select 
            value={preferences.budget}
            onChange={(e) => onUpdate('budget', e.target.value)}
            className="w-full rounded-lg border-slate-300 border bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="Any">{t.options.budget.any}</option>
            <option value="Economy">{t.options.budget.economy}</option>
            <option value="Moderate">{t.options.budget.moderate}</option>
            <option value="Luxury">{t.options.budget.luxury}</option>
          </select>
        </div>

        {/* Travel Style */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <SettingsIcon className="w-4 h-4 text-sky-500" />
            {t.style}
          </label>
          <select 
            value={preferences.travelType}
            onChange={(e) => onUpdate('travelType', e.target.value)}
            className="w-full rounded-lg border-slate-300 border bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="Any">{t.options.style.any}</option>
            <option value="Adventure">{t.options.style.adventure}</option>
            <option value="Relaxation">{t.options.style.relaxation}</option>
            <option value="Culture">{t.options.style.culture}</option>
            <option value="City">{t.options.style.city}</option>
            <option value="Nature">{t.options.style.nature}</option>
          </select>
        </div>

        {/* Companions */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
             <UserIcon className="w-4 h-4 text-purple-500" />
             {t.companions}
          </label>
          <select 
            value={preferences.companions}
            onChange={(e) => onUpdate('companions', e.target.value)}
            className="w-full rounded-lg border-slate-300 border bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="Any">{t.options.companions.any}</option>
            <option value="Solo">{t.options.companions.solo}</option>
            <option value="Couple">{t.options.companions.couple}</option>
            <option value="Family">{t.options.companions.family}</option>
            <option value="Friends">{t.options.companions.friends}</option>
          </select>
        </div>

      </div>
    </div>
  );
};

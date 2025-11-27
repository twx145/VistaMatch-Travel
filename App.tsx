
import React, { useState } from 'react';
import { UploadZone } from './components/UploadZone';
import { DestinationCard } from './components/DestinationCard';
import { PreferencesPanel } from './components/PreferencesPanel';
import { getTravelRecommendations } from './services/geminiService';
import { Destination, AppStatus, UserPreferences, Review, Language } from './types';
import { MapPinIcon, SearchIcon, SparklesIcon, HeartIcon } from './components/Icons';

function App() {
  const [status, setStatus] = useState<AppStatus>('idle');
  const [language, setLanguage] = useState<Language>('en');
  
  // State for all destinations (both current search and saved favorites)
  const [currentDestinations, setCurrentDestinations] = useState<Destination[]>([]);
  const [savedDestinations, setSavedDestinations] = useState<Destination[]>([]);
  
  const [groundingLinks, setGroundingLinks] = useState<{title: string, uri: string}[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<'search' | 'favorites'>('search');

  const [preferences, setPreferences] = useState<UserPreferences>({
    budget: 'Any',
    travelType: 'Any',
    companions: 'Any',
    tripDuration: '3-5',
    originLocation: ''
  });

  // Simple translation dictionary for App.tsx
  const t = {
    title: language === 'zh' ? "VistaMatch 智旅" : "VistaMatch Travel",
    myFavorites: language === 'zh' ? "我的收藏" : "My Favorites",
    heroTitle: language === 'zh' ? "发现您的下一次" : "Find your next",
    heroHighlight: language === 'zh' ? "冒险" : "adventure",
    heroSubtitle: language === 'zh' 
      ? "上传一张您喜欢的风景照，让AI为您匹配现实中的相似目的地。" 
      : "Upload a photo of a place you love, and let Gemini find real-world matches based on your style.",
    errorParse: language === 'zh' 
      ? "我们无法解析具体细节，但AI看到了您的照片！" 
      : "We couldn't parse the specific details, but the AI saw your image!",
    errorGeneric: language === 'zh'
      ? "连接智能向导时出错，请重试。"
      : "Something went wrong while connecting to the AI guide. Please try again.",
    recommendedTitle: language === 'zh' ? "推荐目的地" : "Recommended Destinations",
    optimized: language === 'zh' ? "为您优化" : "Optimized for you",
    verifiedSources: language === 'zh' ? "已验证来源" : "Verified Sources",
    mySavedTrips: language === 'zh' ? "我的收藏行程" : "My Saved Trips",
    noSaved: language === 'zh' ? "您还没有收藏任何目的地。" : "You haven't saved any destinations yet.",
    goFind: language === 'zh' ? "去发现好地方！" : "Go find some places!",
    footer: language === 'zh' 
      ? `© ${new Date().getFullYear()} VistaMatch 智旅。AI推荐仅供参考，请核实旅行限制。`
      : `© ${new Date().getFullYear()} VistaMatch Travel. AI recommendations may vary. Always verify travel restrictions.`
  };

  const handlePreferencesUpdate = (key: keyof UserPreferences, value: string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleImageSelected = async (file: File) => {
    setStatus('analyzing');
    setErrorMsg(null);
    setCurrentDestinations([]);
    setGroundingLinks([]);
    setViewMode('search');

    try {
      const result = await getTravelRecommendations(file, preferences, language);
      if (result.destinations.length > 0) {
        // Check if any recommended destination is already in favorites by name/location to set isFavorite=true
        const mergedDestinations = result.destinations.map(d => {
          const isSaved = savedDestinations.some(saved => saved.name === d.name && saved.location === d.location);
          return isSaved ? { ...d, isFavorite: true, id: savedDestinations.find(saved => saved.name === d.name)?.id || d.id } : d;
        });

        setCurrentDestinations(mergedDestinations);
        setGroundingLinks(result.groundingLinks);
        setStatus('success');
      } else {
        setErrorMsg(t.errorParse);
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(t.errorGeneric);
      setStatus('error');
    }
  };

  const toggleFavorite = (id: string) => {
    // Check if it's in current list
    const inCurrent = currentDestinations.find(d => d.id === id);
    const inSaved = savedDestinations.find(d => d.id === id);
    
    if (inCurrent) {
      const isFav = !inCurrent.isFavorite;
      
      // Update current list UI
      setCurrentDestinations(prev => prev.map(d => d.id === id ? { ...d, isFavorite: isFav } : d));
      
      if (isFav) {
        // Add to saved if not already there
        if (!savedDestinations.some(d => d.id === id)) {
           setSavedDestinations(prev => [...prev, { ...inCurrent, isFavorite: true }]);
        }
      } else {
        // Remove from saved
        setSavedDestinations(prev => prev.filter(d => d.id !== id));
      }
    } else if (inSaved) {
       // Only in saved list (e.g. we are in favorites view or it fell off search results)
       // Remove from saved
       setSavedDestinations(prev => prev.filter(d => d.id !== id));
       
       // Also update current if it happens to be there but we found it via ID from saved list logic
       setCurrentDestinations(prev => prev.map(d => d.id === id ? { ...d, isFavorite: false } : d));
    }
  };

  const addReview = (id: string, reviewData: Omit<Review, 'id' | 'date'>) => {
    const newReview: Review = {
      ...reviewData,
      id: Date.now().toString(),
      date: new Date().toISOString()
    };

    const updateDest = (d: Destination) => {
      if (d.id === id) {
        const updatedReviews = [...(d.reviews || []), newReview];
        return { ...d, reviews: updatedReviews };
      }
      return d;
    };

    setCurrentDestinations(prev => prev.map(updateDest));
    setSavedDestinations(prev => prev.map(updateDest));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <div className="bg-emerald-500 p-1.5 rounded-lg text-white">
               <MapPinIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
              VistaMatch
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Language Toggle */}
             <div className="flex bg-slate-100 rounded-lg p-1">
               <button 
                 onClick={() => setLanguage('en')}
                 className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${language === 'en' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 EN
               </button>
               <button 
                 onClick={() => setLanguage('zh')}
                 className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${language === 'zh' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 中文
               </button>
             </div>

             <button 
                onClick={() => setViewMode(viewMode === 'search' ? 'favorites' : 'search')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'favorites' ? 'bg-red-50 text-red-600 ring-1 ring-red-200' : 'text-slate-600 hover:bg-slate-100'}`}
             >
                <HeartIcon className={`w-4 h-4 ${viewMode === 'favorites' ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline">{t.myFavorites} ({savedDestinations.length})</span>
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        
        {viewMode === 'search' ? (
          <>
            {/* Hero Section */}
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                {t.heroTitle} <span className="text-emerald-500">{t.heroHighlight}</span>.
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                {t.heroSubtitle}
              </p>
            </div>

            {/* Preferences & Upload Section */}
            <div className="mb-16">
              <PreferencesPanel preferences={preferences} onUpdate={handlePreferencesUpdate} language={language} />
              <UploadZone onImageSelected={handleImageSelected} isAnalyzing={status === 'analyzing'} language={language} />
            </div>

            {/* Error State */}
            {status === 'error' && (
              <div className="max-w-xl mx-auto mb-12 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-center">
                {errorMsg}
              </div>
            )}

            {/* Results Section */}
            {status === 'success' && (
              <div className="animate-fade-in-up">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-slate-800">{t.recommendedTitle}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                     <SparklesIcon className="w-4 h-4 text-purple-500" />
                     <span>{t.optimized}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-8">
                  {currentDestinations.map((dest) => (
                    <DestinationCard 
                      key={dest.id} 
                      data={dest} 
                      onToggleFavorite={toggleFavorite}
                      onAddReview={addReview}
                      language={language}
                    />
                  ))}
                </div>

                {/* Sources / Grounding */}
                {groundingLinks.length > 0 && (
                  <div className="mt-16 pt-8 border-t border-slate-200">
                    <div className="flex items-center gap-2 mb-4 text-slate-500">
                      <SearchIcon className="w-4 h-4" />
                      <h4 className="text-sm font-semibold uppercase tracking-wider">{t.verifiedSources}</h4>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {groundingLinks.map((link, idx) => (
                        <a 
                          key={idx} 
                          href={link.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-md hover:border-emerald-400 hover:text-emerald-600 transition-colors truncate max-w-xs"
                        >
                          {link.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="animate-fade-in-up">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">{t.mySavedTrips}</h2>
            {savedDestinations.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                 <HeartIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                 <p className="text-slate-500">{t.noSaved}</p>
                 <button onClick={() => setViewMode('search')} className="mt-4 text-emerald-600 font-semibold hover:underline">
                    {t.goFind}
                 </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-8">
                {savedDestinations.map((dest) => (
                  <DestinationCard 
                    key={dest.id} 
                    data={dest} 
                    onToggleFavorite={toggleFavorite}
                    onAddReview={addReview}
                    language={language}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>{t.footer}</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

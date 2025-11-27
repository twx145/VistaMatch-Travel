
import React, { useState, useEffect } from 'react';
import { Destination, Review, Language } from '../types';
import { MapPinIcon, CalendarIcon, InfoIcon, RouteIcon, HeartIcon, ShareIcon, StarIcon, SparklesIcon } from './Icons';

interface Props {
  data: Destination;
  onToggleFavorite: (id: string) => void;
  onAddReview: (id: string, review: Omit<Review, 'id' | 'date'>) => void;
  language: Language;
}

export const DestinationCard: React.FC<Props> = ({ data, onToggleFavorite, onAddReview, language }) => {
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isItineraryOpen, setIsItineraryOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  
  // Image state
  const [displayImage, setDisplayImage] = useState<string>("");
  const [imgLoading, setImgLoading] = useState(true);

  // Fallback image using AI generation
  const aiGeneratedImage = `https://image.pollinations.ai/prompt/scenery%20photograph%20of%20${encodeURIComponent(data.imageKeyword)}%20in%20${encodeURIComponent(data.location)}?width=800&height=600&nologo=true&model=flux`;

  useEffect(() => {
    let isMounted = true;

    const fetchRealImage = async () => {
      setImgLoading(true);

      // Strategy: Programmatic Search using Wikipedia/Wikimedia APIs
      // We do not use Gemini for images anymore.
      
      const searchTerm = data.englishName || data.name;
      const localTerm = data.name;

      try {
        // Attempt 1: Wikimedia Commons Search (Broadest "Search Engine" feel)
        // search for "Place Name landscape"
        const searchRes = await fetch(
            `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchTerm + " landscape")}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&format=json&origin=*`
        );
        const searchJson = await searchRes.json();
        const pages = searchJson.query?.pages;
        if (pages) {
            const firstPageId = Object.keys(pages)[0];
            const url = pages[firstPageId]?.imageinfo?.[0]?.url;
            if (url && isMounted) {
                setDisplayImage(url);
                setImgLoading(false);
                return;
            }
        }

        // Attempt 2: English Wikipedia Page Image (High precision)
        const enWikiRes = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(searchTerm)}&origin=*`
        );
        const enJson = await enWikiRes.json();
        const enPages = enJson.query?.pages;
        if (enPages) {
          const pageId = Object.keys(enPages)[0];
          const page = enPages[pageId];
          if (page && page.original && page.original.source) {
             if (isMounted) {
               setDisplayImage(page.original.source);
               setImgLoading(false);
               return;
             }
          }
        }
        
        // Attempt 3: Local Language Wikipedia (if applicable)
        if (language === 'zh' && localTerm !== searchTerm) {
            const zhWikiRes = await fetch(
                `https://zh.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(localTerm)}&origin=*`
            );
            const zhJson = await zhWikiRes.json();
            const zhPages = zhJson.query?.pages;
            if (zhPages) {
                const pageId = Object.keys(zhPages)[0];
                const page = zhPages[pageId];
                if (page && page.original && page.original.source) {
                    if (isMounted) {
                        setDisplayImage(page.original.source);
                        setImgLoading(false);
                        return;
                    }
                }
            }
        }

      } catch (e) {
        console.warn("Image search failed", e);
      }

      // 4. Fallback to AI Image
      if (isMounted) {
        setDisplayImage(aiGeneratedImage);
        setImgLoading(false);
      }
    };

    fetchRealImage();

    return () => { isMounted = false; };
  }, [data.id, data.name, data.englishName, language]);


  const t = {
    route: language === 'zh' ? "路线" : "Route",
    season: language === 'zh' ? "最佳季节" : "Best Season",
    tips: language === 'zh' ? "旅行贴士" : "Travel Tips",
    writeReview: language === 'zh' ? "写评论" : "Write a Review",
    yourName: language === 'zh' ? "您的名字" : "Your Name",
    rating: language === 'zh' ? "评分" : "Rating",
    shareExp: language === 'zh' ? "分享您的体验..." : "Share your experience...",
    cancel: language === 'zh' ? "取消" : "Cancel",
    submit: language === 'zh' ? "提交" : "Submit",
    beFirst: language === 'zh' ? "成为第一个评论的人" : "Be the first to review",
    moreReviews: (n: number) => language === 'zh' ? `还有 ${n} 条评论` : `+${n} more reviews`,
    why: language === 'zh' ? "推荐理由" : "Why",
    maps: language === 'zh' ? "地图" : "Maps",
    linkCopied: language === 'zh' ? "链接已复制!" : "Link copied to clipboard!",
    checkOut: language === 'zh' ? "我在 VistaMatch 发现了一个好地方:" : "Check out this amazing place I found on VistaMatch:",
    viewItinerary: language === 'zh' ? "查看详细行程攻略" : "View Detailed Itinerary",
    hideItinerary: language === 'zh' ? "收起行程" : "Hide Itinerary",
    itineraryTitle: language === 'zh' ? "3日游建议" : "3-Day Itinerary"
  };

  const handleShare = async () => {
    const text = `${t.checkOut} ${data.name}, ${data.location}!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Trip to ${data.name}`,
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(`${text} ${window.location.href}`);
      alert(t.linkCopied);
    }
  };

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !authorName.trim()) return;

    onAddReview(data.id, {
      author: authorName,
      rating: newRating,
      text: newComment,
    });

    setNewComment("");
    setAuthorName("");
    setNewRating(5);
    setIsReviewOpen(false);
  };

  const reviews = data.reviews || [];
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, cur) => acc + cur.rating, 0) / reviews.length).toFixed(1) 
    : "New";

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl h-full">
      {/* Image Header */}
      <div className="relative h-48 w-full overflow-hidden shrink-0 bg-slate-100">
        <img 
          src={displayImage || aiGeneratedImage} 
          alt={data.name} 
          className={`h-full w-full object-cover transition-all duration-700 group-hover:scale-110 ${imgLoading ? 'opacity-0' : 'opacity-100'}`}
          loading="lazy"
          onError={(e) => {
            // Fallback if the specific URL fails
            if (e.currentTarget.src !== aiGeneratedImage) {
               e.currentTarget.src = aiGeneratedImage;
            }
          }}
        />
        
        {/* Loading Skeleton */}
        {imgLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            <SparklesIcon className="w-8 h-8 animate-pulse" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        
        {/* Favorite Button */}
        <button 
          onClick={() => onToggleFavorite(data.id)}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 transition-colors z-10"
        >
          <HeartIcon 
            className={`w-5 h-5 transition-colors ${data.isFavorite ? "text-red-500 fill-red-500" : "text-white"}`} 
            filled={data.isFavorite}
          />
        </button>

        <div className="absolute bottom-4 left-4 text-white pr-4">
          <h3 className="text-xl font-bold leading-tight drop-shadow-md">{data.name}</h3>
          <p className="text-sm font-medium text-slate-200 drop-shadow-sm truncate">{data.location}</p>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex flex-1 flex-col p-5">
        
        {/* Rating Row */}
        <div className="flex justify-end mb-3">
          <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100">
            <StarIcon className="w-4 h-4" filled />
            {avgRating} <span className="text-slate-400 font-normal">({reviews.length})</span>
          </div>
        </div>

        {/* Reason Box */}
        <div className="mb-5 rounded-xl bg-emerald-50 p-4 border border-emerald-100 shadow-sm">
          <span className="text-xs font-bold uppercase text-emerald-700 mb-2 tracking-wide flex items-center gap-1">
             <SparklesIcon className="w-3 h-3" />
             {t.why}
          </span>
          <p className="text-sm text-emerald-900 leading-relaxed text-justify">
            {data.reason}
          </p>
        </div>

        {/* Details Grid */}
        <div className="flex-1 space-y-4">
          <div className="flex items-start gap-3">
            <RouteIcon className="mt-1 h-5 w-5 shrink-0 text-sky-500" />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-slate-400 mb-1">{t.route}</p>
              <p className="text-sm text-slate-600 leading-relaxed break-words">{data.route}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CalendarIcon className="mt-1 h-5 w-5 shrink-0 text-orange-500" />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-slate-400 mb-1">{t.season}</p>
              <p className="text-sm text-slate-600 leading-relaxed break-words">{data.season}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <InfoIcon className="mt-1 h-5 w-5 shrink-0 text-purple-500" />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-slate-400 mb-1">{t.tips}</p>
              <p className="text-sm text-slate-600 leading-relaxed break-words">{data.tips}</p>
            </div>
          </div>
        </div>

        {/* Itinerary Button & Section */}
        {data.itinerary && (
          <div className="mt-6 border-t border-slate-100 pt-4">
            <button 
              onClick={() => setIsItineraryOpen(!isItineraryOpen)}
              className="w-full flex items-center justify-between text-sm font-semibold text-slate-700 hover:text-emerald-600 transition-colors"
            >
              <span>{t.itineraryTitle}</span>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                {isItineraryOpen ? t.hideItinerary : t.viewItinerary}
              </span>
            </button>
            
            {isItineraryOpen && (
              <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed animate-fade-in">
                 {data.itinerary}
              </div>
            )}
          </div>
        )}

        {/* Reviews Section */}
        {isReviewOpen ? (
          <form onSubmit={submitReview} className="mt-6 p-3 bg-slate-50 rounded-lg border border-slate-200 animate-fade-in">
            <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">{t.writeReview}</h4>
            <input
              type="text"
              placeholder={t.yourName}
              required
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full mb-2 px-2 py-1 text-sm border rounded"
            />
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-slate-600">{t.rating}:</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button type="button" key={star} onClick={() => setNewRating(star)}>
                    <StarIcon 
                      className={`w-4 h-4 ${star <= newRating ? 'text-yellow-400' : 'text-slate-300'}`} 
                      filled={star <= newRating} 
                    />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              placeholder={t.shareExp}
              required
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full mb-2 px-2 py-1 text-sm border rounded h-16 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setIsReviewOpen(false)}
                className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700"
              >
                {t.cancel}
              </button>
              <button 
                type="submit" 
                className="px-3 py-1 text-xs bg-emerald-500 text-white rounded hover:bg-emerald-600"
              >
                {t.submit}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 pt-3 border-t border-slate-100">
             {reviews.length > 0 && (
               <div className="mb-3 space-y-2">
                 {reviews.slice(0, 1).map((review) => (
                   <div key={review.id} className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold">{review.author}</span>
                        <div className="flex"><StarIcon className="w-3 h-3 text-yellow-400" filled /> {review.rating}</div>
                      </div>
                      <p>"{review.text}"</p>
                   </div>
                 ))}
                 {reviews.length > 1 && <p className="text-xs text-center text-slate-400">{t.moreReviews(reviews.length - 1)}</p>}
               </div>
             )}
             <button 
               onClick={() => setIsReviewOpen(true)}
               className="w-full text-xs text-emerald-600 font-medium hover:underline text-center"
             >
               {reviews.length === 0 ? t.beFirst : t.writeReview}
             </button>
          </div>
        )}

        {/* Action Footer */}
        <div className="mt-4 flex gap-2">
          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.name + ' ' + data.location)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
          >
            <MapPinIcon className="h-4 w-4" />
            {t.maps}
          </a>
          <button 
            onClick={handleShare}
            className="flex items-center justify-center px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            title="Share"
          >
            <ShareIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

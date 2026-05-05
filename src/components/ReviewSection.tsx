import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Share2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

interface Review {
  id: string;
  name: string;
  role: string;
  rating: number;
  text: string;
  created_at: string;
}

const ROLES = ["Hufpfleger", "Pferdebesitzer", "Tierarzt", "Sonstiges"];

export function ReviewSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("hufcampro_reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6);
      
    if (!error && data) {
      setReviews(data);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !text.trim()) {
      setError("Bitte fülle alle Pflichtfelder aus.");
      return;
    }
    setIsSubmitting(true);

    const { error: submitError } = await supabase.from("hufcampro_reviews").insert([{
      name: name.trim(),
      role,
      rating,
      text: text.trim(),
      approved: false
    }]);

    setIsSubmitting(false);

    if (submitError) {
      setError("Ein Fehler ist aufgetreten. Bitte versuche es später erneut.");
    } else {
      setIsSuccess(true);
      setName("");
      setText("");
      setRating(5);
      setTimeout(() => {
        setIsFormOpen(false);
        setIsSuccess(false);
      }, 5000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "HufCamPro",
          text: "HufCamPro — kostenlose Huf-Foto Dokumentation",
          url: "https://hufcampro.de",
        });
      } catch (err) {
        console.log("Share canceled or failed", err);
      }
    } else {
      navigator.clipboard.writeText("https://hufcampro.de");
      alert("Link wurde in die Zwischenablage kopiert!");
    }
  };

  return (
    <section className="py-24 px-4 border-t border-zinc-900 bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-black text-white mb-2">
                Das sagt die Community
              </motion.h2>
              <motion.p variants={fadeUp} className="text-zinc-400">
                Erfahrungsberichte von Nutzern der HufCamPro App.
              </motion.p>
            </div>
            
            <motion.div variants={fadeUp} className="flex items-center gap-3">
              <button onClick={() => setIsFormOpen(!isFormOpen)}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-bold transition-colors flex items-center gap-2">
                Erfahrung teilen
              </button>
              <button onClick={handleShare}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-colors flex items-center gap-2">
                <Share2 className="h-4 w-4" /> <span className="hidden sm:inline">App teilen</span>
              </button>
            </motion.div>
          </div>

          <AnimatePresence>
            {isFormOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-12"
              >
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 max-w-2xl mx-auto">
                  {isSuccess ? (
                    <div className="text-center py-8">
                      <div className="h-16 w-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Danke für dein Feedback!</h3>
                      <p className="text-zinc-400">Dein Beitrag wird geprüft und erscheint bald hier.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <h3 className="text-xl font-bold text-white mb-4">Hinterlasse dein Feedback</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Name</label>
                          <input required maxLength={60} value={name} onChange={e => setName(e.target.value)}
                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                            placeholder="Dein Name" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Rolle</label>
                          <select value={role} onChange={e => setRole(e.target.value)}
                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none">
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Bewertung</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button type="button" key={star} onClick={() => setRating(star)}
                              className="text-2xl focus:outline-none hover:scale-110 transition-transform">
                              <Star className={`h-8 w-8 ${star <= rating ? "fill-orange-400 text-orange-400" : "text-zinc-700"}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1.5">
                          <label className="block text-xs font-bold text-zinc-400 uppercase">Erfahrung</label>
                          <span className={`text-xs ${text.length > 500 ? 'text-red-400' : 'text-zinc-500'}`}>
                            {text.length}/500
                          </span>
                        </div>
                        <textarea required maxLength={500} value={text} onChange={e => setText(e.target.value)} rows={4}
                          className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
                          placeholder="Wie gefällt dir HufCamPro?" />
                      </div>

                      {error && <p className="text-red-400 text-sm font-medium">{error}</p>}

                      <div className="flex justify-end pt-2">
                        <button type="button" onClick={() => setIsFormOpen(false)}
                          className="px-6 py-3 text-zinc-400 hover:text-white font-medium transition-colors mr-2">
                          Abbrechen
                        </button>
                        <button type="submit" disabled={isSubmitting || text.length > 500}
                          className="px-8 py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white rounded-xl font-bold transition-colors">
                          {isSubmitting ? "Wird gesendet..." : "Absenden"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-zinc-900 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {reviews.map((review) => (
                <motion.div key={review.id} variants={fadeUp}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 md:p-6 flex flex-col h-full hover:border-orange-500/20 transition-colors">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-orange-400 text-orange-400" : "text-zinc-800"}`} />
                    ))}
                  </div>
                  <p className="text-zinc-300 text-sm md:text-base mb-6 flex-1 italic leading-relaxed">
                    "{review.text}"
                  </p>
                  <div className="mt-auto">
                    <p className="font-bold text-white text-sm">{review.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 text-[10px] font-bold uppercase tracking-wider">
                        {review.role}
                      </span>
                      <span className="text-zinc-600 text-xs">
                        {new Date(review.created_at).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div variants={fadeUp} className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-zinc-800 border-dashed">
              <Star className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Noch keine Bewertungen</h3>
              <p className="text-zinc-500 mb-6">Sei der Erste — hinterlasse dein Feedback!</p>
              <button onClick={() => setIsFormOpen(true)}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-colors">
                Jetzt bewerten
              </button>
            </motion.div>
          )}

        </motion.div>
      </div>
    </section>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const Footer = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    alert("Votre demande a été envoyée avec succès.");
  };

  return (
    <footer className="py-20 px-6 md:px-8" style={{ background: '#0d0b1a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-2">
          <div className="mb-6 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="CertifPratice Logo" className="h-10 md:h-12 w-auto object-contain drop-shadow-md" />
          </div>
          <p className="text-sm text-white/40 max-w-sm mb-8 leading-relaxed">
            Propulsez votre carrière avec une préparation aux certifications de classe mondiale.
            Pratiquez, apprenez et réussissez vos examens IT dès la première tentative.
          </p>
          <div className="flex gap-10">
            <div>
              <p className="text-xs font-black text-white/20 uppercase tracking-widest mb-3">Légal</p>
              <ul className="space-y-2">
                <li><a href="/privacy-policy" className="text-sm text-white/40 hover:text-[#f97316] transition-all">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-span-2">
          {isAuthenticated ? (
            <form onSubmit={handleSupportSubmit} className="flex flex-col gap-4 p-6 rounded-2xl bg-[#161b22] border border-white/5">
              <p className="text-xs font-black text-white/20 uppercase tracking-widest mb-2">Contactez l'Équipe</p>
              <input
                required
                type="text"
                placeholder="Votre Nom"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none bg-white/[0.02] border border-white/10 text-white placeholder-white/20 focus:border-[#f97316] transition-colors"
              />
              <textarea
                required
                placeholder="Description de votre demande"
                rows="3"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none bg-white/[0.02] border border-white/10 text-white placeholder-white/20 focus:border-[#f97316] transition-colors resize-none"
              ></textarea>
              <button
                type="submit"
                className="self-start px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide bg-[#f97316] text-white hover:scale-105 transition-transform"
              >
                Envoyer
              </button>
            </form>
          ) : (
            <div className="h-full flex flex-col justify-end items-end">
              <p className="text-xs text-white/20 font-medium">© 2026 CertifPratice. Tous droits réservés.</p>
            </div>
          )}
        </div>

        {isAuthenticated && (
          <div className="col-span-1 md:col-span-4 flex justify-end mt-4">
            <p className="text-xs text-white/20 font-medium">© 2026 CertifPratice. Tous droits réservés.</p>
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;

import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-white bg-[#0d0b1a] font-sans">
      <div className="max-w-4xl mx-auto px-6 py-20 lg:py-32">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/50 hover:text-[#f97316] transition-colors mb-12 text-sm font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Retour à l'accueil
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#f97316]/20 flex items-center justify-center border border-[#f97316]/30">
            <Shield size={24} className="text-[#f97316]" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black" style={{ fontFamily: 'Space Grotesk' }}>
            Politique de Confidentialité
          </h1>
        </div>

        <p className="text-white/40 text-sm md:text-base mb-12 border-b border-white/5 pb-6">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
        </p>

        <div className="space-y-10 text-white/70 leading-relaxed text-sm md:text-base">
          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. Introduction</h2>
            <p>
              Bienvenue sur <strong>CertifPratice</strong>. Nous accordons une grande importance à la confidentialité et à la sécurité des données de nos utilisateurs.
              Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos informations personnelles lorsque vous utilisez notre plateforme de préparation aux certifications.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. Collecte des Données</h2>
            <p className="mb-2">Nous collectons les données suivantes :</p>
            <ul className="list-disc pl-5 space-y-2 text-white/60">
              <li><strong>Informations de compte :</strong> Votre adresse e-mail, votre nom et votre prénom lors de l'inscription via notre système d'authentification sécurisé.</li>
              <li><strong>Informations d'examen :</strong> Les résultats de vos examens, le temps passé et votre progression pour vous fournir une expérience personnalisée.</li>
              <li><strong>Données de support :</strong> Si vous nous contactez, nous enregistrons les messages et la description de vos demandes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. Utilisation des Données</h2>
            <p className="mb-2">Vos informations sont utilisées exclusivement pour :</p>
            <ul className="list-disc pl-5 space-y-2 text-white/60">
              <li>Assurer le fonctionnement optimal de la plateforme et de vos sessions d'examen.</li>
              <li>Analyser vos performances pour vous fournir des corrections détaillées.</li>
              <li>Vous contacter occasionnellement pour des mises à jour importantes de nos services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. Partage et Sécurité</h2>
            <p>
              Nous <strong>ne vendons ni ne louons</strong> vos données à des tiers. 
              Toutes les communications entre votre appareil et nos serveurs sont cryptées selon les normes de l'industrie (HTTPS/SSL). 
              Vos données sont hébergées sur des serveurs sécurisés et leur accès est strictement limité à l'équipe technique de CertifPratice pour des raisons de maintenance technique.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. Vos Droits</h2>
            <p>
              Conformément aux normes en vigueur (notamment le RGPD), vous disposez du droit d'accéder à vos données, de les modifier, ou d'en demander la suppression permanente.
              Pour exercer ce droit, veuillez utiliser le formulaire de support accessible depuis votre espace membre, ou nous contacter directement si vous ne pouvez pas vous connecter.
            </p>
          </section>

          <section className="bg-[#161b22] p-6 rounded-2xl border border-white/5 mt-10">
            <h2 className="text-lg font-bold text-white mb-2">6. Contact</h2>
            <p className="text-sm">
              Pour toute question relative à cette politique ou à l'utilisation de vos données personnelles, veuillez nous écrire à l'adresse électronique suivante :
              <span className="block mt-2 font-bold text-[#f97316]">support@certifpratice.com</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

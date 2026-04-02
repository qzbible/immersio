import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Crown, Check, Sparkles, Building2, Users, Shield, Plus, X, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Premium = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab ] = useState('individual'); // 'individual' or 'org'
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [orgName, setOrgName] = useState('');

  const handlePurchase = async (packageId) => {
    setLoading(true);
    try {
      const originUrl = window.location.origin;
      // Convert ID to match backend expectations if needed
      const pkgId = packageId === '1h' ? '1_hour' : packageId === '24h' ? '24_hours' : packageId;
      
      const response = await axios.post(
        `${BACKEND_URL}/api/checkout-session`,
        {
          package_type: pkgId,
          success_url: `${originUrl}/dashboard`, // Redirect to dashboard on success
          cancel_url: `${originUrl}/premium`
        },
        { withCredentials: true }
      );

      window.location.href = response.data.checkout_url;
    } catch (error) {
      console.error('Erreur lors de l\'achat:', error);
      alert('Erreur lors de la création de la session de paiement');
      setLoading(false);
    }
  };

  const handleCreateOrg = async () => {
    if (!orgName.trim()) return;
    setLoading(true);
    try {
      if (selectedPlan.id === 'free') {
        await axios.post(`${BACKEND_URL}/api/orgs/`, { 
          name: orgName.trim(),
          plan: selectedPlan.id 
        }, { withCredentials: true });
        alert("Félicitations ! Votre organisation a été créée.");
        navigate('/dashboard');
      } else {
        // Stripe flow for Silver/Gold
        const originUrl = window.location.origin;
        const response = await axios.post(
          `${BACKEND_URL}/api/checkout-session`,
          {
            package_type: selectedPlan.id, // silver or gold
            org_name: orgName.trim(),
            plan: selectedPlan.id,
            success_url: `${originUrl}/dashboard`,
            cancel_url: `${originUrl}/premium`
          },
          { withCredentials: true }
        );
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      alert("Erreur lors de l'opération");
    } finally {
      setLoading(false);
      setShowOrgModal(false);
    }
  };

  const packages = [
    {
      id: '1h',
      name: 'Pass 1 Heure',
      price: 2.99,
      duration: '1 heure',
      features: [
        'Accès illimité pendant 1h',
        'Vies illimitées',
        'Explications détaillées',
        'Parfait pour événements'
      ],
      color: 'from-blue-400 to-blue-600'
    },
    {
      id: '24h',
      name: 'Pass 24 Heures',
      price: 9.99,
      duration: '24 heures',
      features: [
        'Accès illimité pendant 24h',
        'Vies illimitées',
        'Explications détaillées',
        'Mode hors-ligne',
        'Idéal pour défis en famille'
      ],
      color: 'from-yellow-400 to-yellow-600',
      popular: true
    }
  ];

  const orgPlans = [
    {
      id: 'free',
      name: 'Plan Eglise Gratuit',
      price: 0,
      features: [
        '1 Mode de jeu personnalisé',
        '20 Questions personnalisées',
        'Accès à l\'espace Admin',
        '1 Administrateur'
      ],
      color: 'from-gray-400 to-gray-600',
      buttonText: 'Commencer Gratuitement'
    },
    {
      id: 'silver',
      name: 'Plan Eglise Silver',
      price: 19.99,
      duration: '/ mois',
      features: [
        '5 Modes de jeu personnalisés',
        '100 Questions personnalisées',
        '5 Administrateurs / Managers',
        'Analytiques basiques',
        'Support standard'
      ],
      color: 'from-blue-500 to-indigo-600',
      popular: true,
      buttonText: 'Choisir Silver'
    },
    {
      id: 'gold',
      name: 'Plan Eglise Gold',
      price: 49.99,
      duration: '/ mois',
      features: [
        'Modes et Questions Illimités',
        'Membres et Admins Illimités',
        'Analytiques avancés',
        'Support prioritaire 24/7',
        'Marque blanche (Custom Logo)'
      ],
      color: 'from-yellow-500 to-amber-600',
      buttonText: 'Choisir Gold'
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #312E81 50%, #1E3A8A 100%)' }}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <Button
          onClick={() => navigate('/dashboard')}
          variant="outline"
          className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-4">
            <Crown className="w-4 h-4 text-yellow-300" />
            <span className="text-sm text-yellow-100 font-medium">Devenez Premium</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
            Accès Premium
          </h1>
          <p className="text-lg text-blue-200 max-w-2xl mx-auto" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Débloquez tout le potentiel de BibleQuest avec nos pass horaires
          </p>
        </motion.div>

        {/* Tab System */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/5 backdrop-blur-md p-1 rounded-2xl border border-white/10 flex">
             <button 
               onClick={() => setActiveTab('individual')}
               className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'individual' ? 'bg-yellow-500 text-gray-900 shadow-lg' : 'text-white/60 hover:text-white'}`}
             >
               Personnel
             </button>
             <button 
               onClick={() => setActiveTab('org')}
               className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'org' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
             >
               Organisation / Eglise
             </button>
          </div>
        </div>

        {user?.is_premium && user?.premium_expires_at && activeTab === 'individual' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mb-8"
          >
            <Card className="p-6 bg-gradient-to-r from-yellow-400 to-yellow-600 border-0 text-center">
              <Crown className="w-12 h-12 text-gray-900 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Vous êtes Premium !</h3>
              <p className="text-gray-800">
                Expire le {new Date(user.premium_expires_at).toLocaleString('fr-FR')}
              </p>
            </Card>
          </motion.div>
        )}

        <div className={`grid gap-8 max-w-6xl mx-auto ${activeTab === 'individual' ? 'md:grid-cols-2 max-w-4xl' : 'md:grid-cols-3'}`}>
          {(activeTab === 'individual' ? packages : orgPlans).map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-8 bg-white/10 backdrop-blur-md border-white/20 relative overflow-hidden h-full flex flex-col ${
                pkg.popular ? 'ring-2 ring-yellow-400' : ''
              }`}>
                {pkg.popular && (
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 text-xs font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Populaire
                  </div>
                )}

                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${pkg.color} flex items-center justify-center mb-4`}>
                  {activeTab === 'individual' ? <Crown className="w-8 h-8 text-white" /> : <Building2 className="w-8 h-8 text-white" />}
                </div>

                <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {pkg.name}
                </h3>
                <p className="text-blue-200 mb-4">{pkg.duration || 'Temporaire'}</p>

                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">
                    {pkg.price === 0 ? 'Gratuit' : `$${pkg.price}`}
                  </span>
                  {pkg.price > 0 && <span className="text-blue-200 ml-2">USD</span>}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-blue-100">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => {
                    if (activeTab === 'individual') {
                      handlePurchase(pkg.id);
                    } else {
                      setSelectedPlan(pkg);
                      setShowOrgModal(true);
                    }
                  }}
                  disabled={loading}
                  className={`w-full bg-gradient-to-r ${pkg.color} text-white hover:opacity-90 font-bold py-6`}
                >
                  {loading ? 'Chargement...' : (pkg.buttonText || `Acheter ${pkg.name}`)}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12 text-blue-200"
        >
          <p className="text-sm">Paiement sécurisé via Stripe</p>
        </motion.div>

        {/* Name Org Modal */}
        {showOrgModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#1E3A8A] border-2 border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative">
                <button 
                  onClick={() => setShowOrgModal(false)}
                  className="absolute top-6 right-6 text-white/40 hover:text-white"
                >
                  <X size={24} />
                </button>

                <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 mb-6 mx-auto">
                   <Building2 size={32} />
                </div>

                <h3 className="text-2xl font-bold text-white text-center mb-2">Presque prêt !</h3>
                <p className="text-blue-200 text-center text-sm mb-8">Quel est le nom de votre Eglise ou Organisation ?</p>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/40 uppercase font-black tracking-widest ml-1">Nom de l'organisation</label>
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="ex: Eglise de la Paix"
                      className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500 transition-all"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                    />
                  </div>

                  <div className="pt-4">
                    <Button 
                      onClick={handleCreateOrg}
                      disabled={loading || !orgName.trim()}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-7 rounded-2xl text-lg shadow-xl shadow-yellow-500/20 transition-all flex items-center justify-center gap-3"
                    >
                      {loading ? <RefreshCw className="animate-spin" size={20} /> : <Plus size={20} />}
                      {selectedPlan?.price === 0 ? "Créer l'espace" : `Souscrire & Créer`}
                    </Button>
                    <p className="text-[10px] text-white/20 text-center mt-4">En cliquant, vous acceptez les conditions de service SaaS de BibleQuest.</p>
                  </div>
                </div>
             </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Premium;

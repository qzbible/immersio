import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, Trophy, Book, Crown, Mail, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Input } from '@/components/ui/input';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setUser, isAuthenticated } = useAuthStore();

  const [showEmailLogin, setShowEmailLogin] = React.useState(false);
  const [step, setStep] = React.useState(1); // 1: Info, 2: OTP
  const [formData, setFormData] = React.useState({ email: '', name: '', church: '' });
  const [otpCode, setOtpCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/auth/otp/request`, formData);
      setStep(2);
    } catch (error) {
      alert(error.response?.data?.detail || "Erreur lors de l'envoi du code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/otp/verify`, {
        email: formData.email,
        code: otpCode
      }, { withCredentials: true });
      setUser(response.data);
      navigate('/dashboard');
    } catch (error) {
      alert("Code invalide ou expiré");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <Book className="w-10 h-10 text-yellow-300" />, title: t('landing.feature_campaign'), description: t('landing.feature_campaign_desc') },
    { icon: <Trophy className="w-10 h-10 text-yellow-300" />, title: t('landing.feature_badges'), description: t('landing.feature_badges_desc') },
    { icon: <Crown className="w-10 h-10 text-yellow-300" />, title: t('landing.feature_premium'), description: t('landing.feature_premium_desc') },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #312E81 50%, #1E3A8A 100%)' }}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400 rounded-full blur-3xl" />
      </div>

      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-5xl mx-auto">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-sm text-yellow-100 font-medium">{t('landing.tagline')}</span>
            </div>
          </motion.div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight" style={{ fontFamily: 'Fraunces, serif' }}>BibleQuest</h1>
          <p className="text-xl sm:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto" style={{ fontFamily: 'Manrope, sans-serif' }}>{t('landing.subtitle')}</p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
            {!showEmailLogin ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button data-testid="login-button" onClick={handleLogin} size="lg" className="text-lg px-8 py-7 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900 font-bold shadow-2xl border-2 border-yellow-300">
                    <Crown className="w-5 h-5 mr-2" />
                    {t('landing.cta')}
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={() => setShowEmailLogin(true)} variant="outline" size="lg" className="text-lg px-8 py-7 rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Mail className="w-5 h-5 mr-2" />
                    Continuer avec Email
                  </Button>
                </motion.div>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Connexion par Email</h3>
                
                {step === 1 ? (
                  <form onSubmit={handleRequestOTP} className="space-y-4">
                    <Input
                      placeholder="Votre Nom"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                    <Input
                      type="email"
                      placeholder="Votre Email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                    <Input
                      placeholder="Eglise / Assemblée"
                      value={formData.church}
                      onChange={(e) => setFormData({ ...formData, church: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                    <Button type="submit" disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold">
                      {loading ? "Chargement..." : "Recevoir le code"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <p className="text-sm text-blue-200">Code envoyé à {formData.email}</p>
                    <Input
                      placeholder="Code à 6 chiffres"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      required
                      maxLength={6}
                      className="text-center text-2xl tracking-widest bg-white/5 border-white/10 text-white"
                    />
                    <Button type="submit" disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold">
                      {loading ? "Vérification..." : "Vérifier et entrer"}
                    </Button>
                  </form>
                )}
                
                <button
                  onClick={() => { setShowEmailLogin(false); setStep(1); }}
                  className="mt-4 text-sm text-blue-200 hover:text-white underline"
                >
                  Retour
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }} className="p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>{feature.title}</h3>
              <p className="text-blue-100" style={{ fontFamily: 'Manrope, sans-serif' }}>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Landing;

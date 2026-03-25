import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ChurchModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useAuthStore();
  const [church, setChurch] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!church.trim()) return;
    setLoading(true);
    try {
      const response = await axios.patch(`${BACKEND_URL}/api/users/me`, {
        church: church.trim()
      }, { withCredentials: true });
      setUser(response.data);
      onClose();
    } catch (error) {
      console.error('Failed to update church', error);
      alert("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-blue-900 border-yellow-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-yellow-400">Complétez votre profil</DialogTitle>
          <DialogDescription className="text-blue-200">
            Dites-nous de quelle Eglise ou Assemblée vous faites partie ! (Facultatif)
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            id="church"
            placeholder="Nom de votre Eglise"
            value={church}
            onChange={(e) => setChurch(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-yellow-500"
          />
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={onClose} className="text-blue-200 hover:text-white hover:bg-white/10">
            Plus tard
          </Button>
          <Button onClick={handleSave} disabled={loading || !church.trim()} className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold">
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChurchModal;

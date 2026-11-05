import React from 'react';
import {
  Flame,
  Compass,
  Flower2,
  Feather,
  Shield,
  Navigation,
  Waves,
  Palette,
  Flag,
  Lock,
  Coffee,
  AlertTriangle,
  HelpCircle,
  Users,
  Coins,
  Train,
  Zap,
  Droplets,
  Dices,
  Play,
  PlusCircle,
  LogIn,
  Copy,
  Check,
  CheckCircle2,
  PlayCircle,
  LogOut,
  ShoppingBag,
  FastForward,
  ArrowLeftRight,
  AlertOctagon,
  KeyRound,
  Building,
  Building2,
  Home,
  FileText,
  History,
  BookOpen,
  MessageSquare,
  Volume2,
  VolumeX,
  Trophy,
  Award,
  Crown,
  Share2,
  X,
  Send,
  User,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Bell,
  ArrowLeft,
  ShieldCheck,
  RotateCcw,
  XCircle,
  AlertCircle,
  Maximize2,
  Minimize2,
} from 'lucide-react';

// Token avatar icon mapping
export function TokenIcon({
  avatarId,
  size = 18,
  className = '',
}: {
  avatarId: string;
  size?: number;
  className?: string;
}) {
  switch (avatarId) {
    case 'diya':
      return <Flame size={size} className={className} />;
    case 'chakra':
      return <Compass size={size} className={className} />;
    case 'lotus':
      return <Flower2 size={size} className={className} />;
    case 'peacock':
      return <Feather size={size} className={className} />;
    case 'elephant':
      return <Shield size={size} className={className} />;
    case 'kite':
      return <Navigation size={size} className={className} />;
    case 'conch':
      return <Waves size={size} className={className} />;
    case 'rangoli':
      return <Palette size={size} className={className} />;
    default:
      return <Sparkles size={size} className={className} />;
  }
}

// Board Space icon mapping
export function SpaceIcon({
  type,
  name = '',
  size = 16,
  className = '',
}: {
  type: string;
  name?: string;
  size?: number;
  className?: string;
}) {
  switch (type) {
    case 'go':
      return <Flag size={size} className={className} />;
    case 'jail':
      return <Lock size={size} className={className} />;
    case 'rest':
      return <Coffee size={size} className={className} />;
    case 'goToJail':
      return <AlertTriangle size={size} className={className} />;
    case 'chance':
      return <HelpCircle size={size} className={className} />;
    case 'community':
      return <Users size={size} className={className} />;
    case 'tax':
      return <Coins size={size} className={className} />;
    case 'railway':
      return <Train size={size} className={className} />;
    case 'utility':
      return name.toLowerCase().includes('water') ? (
        <Droplets size={size} className={className} />
      ) : (
        <Zap size={size} className={className} />
      );
    default:
      return <Building2 size={size} className={className} />;
  }
}

export {
  Flame,
  Compass,
  Flower2,
  Feather,
  Shield,
  Navigation,
  Waves,
  Palette,
  Flag,
  Lock,
  Coffee,
  AlertTriangle,
  HelpCircle,
  Users,
  Coins,
  Train,
  Zap,
  Droplets,
  Dices,
  Play,
  PlusCircle,
  LogIn,
  Copy,
  Check,
  CheckCircle2,
  PlayCircle,
  LogOut,
  ShoppingBag,
  FastForward,
  ArrowLeftRight,
  AlertOctagon,
  KeyRound,
  Building,
  Building2,
  Home,
  FileText,
  History,
  BookOpen,
  MessageSquare,
  Volume2,
  VolumeX,
  Trophy,
  Award,
  Crown,
  Share2,
  X,
  Send,
  User,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Bell,
  ArrowLeft,
  ShieldCheck,
  RotateCcw,
  XCircle,
  AlertCircle,
  Maximize2,
  Minimize2,
};

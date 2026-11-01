'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  LogOut, 
  ExternalLink, 
  ShoppingBag, 
  UtensilsCrossed, 
  BarChart3, 
  Settings, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Database,
  RefreshCw,
  Search,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Image as ImageIcon,
  X,
  Menu,
  Sparkles,
  Flame,
  Check,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  FolderPlus,
  Wand2,
  Globe,
  LayoutGrid,
  Truck,
  Store,
  Phone,
  MapPin,
  User,
  CreditCard,
  Banknote,
  MessageSquare,
  ChefHat,
  Package,
  Calendar,
  History,
  XCircle,
  Ban,
  RotateCcw,
  AlertTriangle,
  Copy,
  Minus,
  Timer,
  Printer,
  TrendingUp,
  Award,
  Users,
  ArrowUpRight
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { cn, formatPrice } from '@/lib/utils';
import { supabase, isSupabaseConfigured, createOrder } from '@/lib/supabase';
import { brandTheme } from '@/config/theme';
import { Category, Product, ProductBadge as ProductBadgeType } from '@/types';
import { ProductBadge } from '@/components/menu/ProductBadge';
import { getProductZoom, ZOOM_PRESETS } from '@/lib/imageZoom';
import { 
  fetchMenuData, 
  updateProduct, 
  createProduct, 
  deleteProduct, 
  uploadProductImage,
  createCategory
} from '@/lib/menuService';
import { autoTranslateDish } from '@/lib/translateService';

type AdminTab = 'dashboard' | 'orders' | 'menu' | 'stats' | 'settings';

export interface AdminOrder {
  id: string;
  customer_name: string;
  name?: string;
  phone: string;
  delivery_method: 'delivery' | 'pickup';
  deliveryMethod?: 'delivery' | 'pickup';
  address?: {
    street?: string;
    house?: string;
    apartment?: string;
    floor?: string;
    entryCode?: string;
  };
  payment_method: string;
  paymentMethod?: string;
  changeFrom?: string;
  comment?: string;
  personsCount?: number;
  timing_type?: 'asap' | 'scheduled';
  timingType?: 'asap' | 'scheduled';
  scheduled_date?: 'today' | 'tomorrow';
  scheduledDate?: 'today' | 'tomorrow';
  scheduled_time?: string;
  scheduledTime?: string;
  items: Array<{
    product: {
      id?: string;
      name?: { pl: string; uk: string } | string;
      price?: number;
      image?: string;
    };
    quantity: number;
  }>;
  subtotal: number;
  delivery_fee: number;
  deliveryFee?: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'in_delivery' | 'delivered' | 'cancelled';
  created_at: string;
  accepted_at?: string;
  acceptedAt?: string;
}

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('makssushiswidnica@gmail.com');
  const [password, setPassword] = useState('MaksSushi@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Дані меню
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('mini-maki');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [searchMenuQuery, setSearchMenuQuery] = useState('');

  // Дані замовлень
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('pending');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderRlsNotice, setOrderRlsNotice] = useState(false);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());
  const [collapsedHistoryDays, setCollapsedHistoryDays] = useState<Set<string>>(new Set());
  const [statsPeriod, setStatsPeriod] = useState<'today' | '7days' | '30days' | 'all'>('7days');
  
  // Відстеження вже відомих замовлень, щоб перемикати на "Нові" ЛИШЕ один раз при надходженні нового
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isFirstOrdersLoadRef = useRef(true);

  // Час очікування приготування / доставки від закладу (глобальний через store)
  const prepWaitTimeMinutes = useCartStore((s) => s.prepWaitTimeMinutes);
  const setPrepWaitTimeMinutes = useCartStore((s) => s.setPrepWaitTimeMinutes);
  const [isEditingWaitTime, setIsEditingWaitTime] = useState(false);
  const [tempWaitTime, setTempWaitTime] = useState(String(prepWaitTimeMinutes || 40));

  // Синхронізація локального часу при зміні в store
  useEffect(() => {
    setTempWaitTime(String(prepWaitTimeMinutes || 40));
  }, [prepWaitTimeMinutes]);

  // Стан мобільного бургер-меню в хедері
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Модальне вікно редагування / створення страви
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const [dragOverProductId, setDragOverProductId] = useState<string | null>(null);
  const [isModalDragOver, setIsModalDragOver] = useState(false);

  // Форма редагування
  const [formId, setFormId] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [isFormCategoryDropdownOpen, setIsFormCategoryDropdownOpen] = useState(false);
  const [formNamePl, setFormNamePl] = useState('');
  const [formNameUk, setFormNameUk] = useState('');
  const [formDescPl, setFormDescPl] = useState('');
  const [formDescUk, setFormDescUk] = useState('');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formWeight, setFormWeight] = useState<number>(0);
  const [formPieces, setFormPieces] = useState<string>('');
  const [formBadge, setFormBadge] = useState<string>('');
  const [formIngredientsPl, setFormIngredientsPl] = useState('');
  const [formIngredientsUk, setFormIngredientsUk] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string>('');
  const [formZoom, setFormZoom] = useState<number | ''>('');
  const [activeLangTab, setActiveLangTab] = useState<'pl' | 'uk'>('pl');
  const [isTranslating, setIsTranslating] = useState(false);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Створення нової категорії
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCatNamePl, setNewCatNamePl] = useState('');
  const [newCatNameUk, setNewCatNameUk] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const quickFileInputRef = useRef<HTMLInputElement>(null);
  const [quickUploadProductId, setQuickUploadProductId] = useState<string | null>(null);

  // Перевірка сесії при завантаженні
  useEffect(() => {
    async function checkSession() {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        if (data.session?.user?.email) {
          const em = data.session.user.email.toLowerCase();
          if (em === 'makssushiswidnica@gmail.com' || em.includes('admin') || em.includes('makssushi')) {
            localStorage.setItem('max-sushi-is-admin', 'true');
            window.dispatchEvent(new Event('admin-auth-changed'));
          }
        }
      } catch (err) {
        console.warn('Session check error:', err);
      } finally {
        setLoading(false);
      }
    }

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user?.email) {
        const em = currentSession.user.email.toLowerCase();
        if (em === 'makssushiswidnica@gmail.com' || em.includes('admin') || em.includes('makssushi')) {
          localStorage.setItem('max-sushi-is-admin', 'true');
          window.dispatchEvent(new Event('admin-auth-changed'));
        }
      } else {
        localStorage.removeItem('max-sushi-is-admin');
        window.dispatchEvent(new Event('admin-auth-changed'));
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Блокування скролу фонової сторінки при відкритих модальних вікнах
  useEffect(() => {
    if (isModalOpen || isAddCategoryModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (isAddCategoryModalOpen) {
            setIsAddCategoryModalOpen(false);
          } else if (isModalOpen) {
            setIsModalOpen(false);
          }
        }
      };
      window.addEventListener('keydown', handleEscape);

      return () => {
        document.body.style.overflow = originalOverflow || '';
        window.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isModalOpen, isAddCategoryModalOpen]);

  // Звукове сповіщення про нове замовлення через Web Audio API
  const playOrderSound = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // ігноруємо обмеження аудіоконтексту браузера
    }
  };

  // Завантаження меню після авторизації
  const loadMenu = async () => {
    setIsLoadingMenu(true);
    try {
      const data = await fetchMenuData();
      setCategories(data.categories);
      setProducts(data.products);
    } catch (err) {
      console.warn('Failed to load menu:', err);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  // Завантаження замовлень із Supabase + LocalStorage (fallback)
  const loadOrders = async (showLoading = true) => {
    if (showLoading) setIsLoadingOrders(true);
    let loaded: AdminOrder[] = [];
    let rlsIssue = false;

    // Зчитуємо локальну карту часу прийняття на кухню
    let localAcceptedMap: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      try {
        localAcceptedMap = JSON.parse(localStorage.getItem('max-sushi-kitchen-accepted') || '{}');
      } catch {}
    }

    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Supabase fetch orders notice:', error.message);
          if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('security')) {
            rlsIssue = true;
          }
        } else if (data) {
          loaded = data.map((d: any) => {
            const rawComment = d.comment || '';
            const matchScheduled = !d.scheduled_time && rawComment.match(/\[НА ЧАС:\s*([^\]]+)\]/i);
            const scheduledTime = d.scheduled_time || d.scheduledTime || (matchScheduled ? matchScheduled[1].trim() : undefined);
            const timingType = d.timing_type || d.timingType || (scheduledTime ? 'scheduled' : 'asap');
            const cleanComment = matchScheduled ? rawComment.replace(/\[НА ЧАС:\s*[^\]]+\]\s*/i, '').trim() : rawComment;

            return {
              id: String(d.id || ''),
              customer_name: d.customer_name || d.name || 'Клієнт',
              name: d.customer_name || d.name || 'Клієнт',
              phone: d.phone || '',
              delivery_method: d.delivery_method || d.deliveryMethod || 'delivery',
              deliveryMethod: d.delivery_method || d.deliveryMethod || 'delivery',
              address: d.address,
              payment_method: d.payment_method || d.paymentMethod || 'blik_online',
              paymentMethod: d.payment_method || d.paymentMethod || 'blik_online',
              changeFrom: d.change_from || d.changeFrom,
              comment: cleanComment,
              personsCount: d.persons_count || d.personsCount || 1,
              timing_type: timingType,
              timingType: timingType,
              scheduled_time: scheduledTime,
              scheduledTime: scheduledTime,
              items: Array.isArray(d.items) ? d.items : [],
              subtotal: Number(d.subtotal || 0),
              delivery_fee: Number(d.delivery_fee ?? d.deliveryFee ?? 0),
              deliveryFee: Number(d.delivery_fee ?? d.deliveryFee ?? 0),
              total: Number(d.total || 0),
              status: d.status || 'pending',
              created_at: d.created_at || d.createdAt || new Date().toISOString(),
              accepted_at: d.accepted_at || d.acceptedAt || localAcceptedMap[String(d.id)],
              acceptedAt: d.accepted_at || d.acceptedAt || localAcceptedMap[String(d.id)],
            };
          });
        }
      }

      // Також завантажуємо локальні замовлення (якщо клієнт оформив їх у LocalStorage)
      if (typeof window !== 'undefined') {
        try {
          const local = JSON.parse(localStorage.getItem('max-sushi-orders') || '[]');
          if (Array.isArray(local) && local.length > 0) {
            const existingIds = new Set(loaded.map((o) => o.id));
            for (const item of local) {
              if (item && item.id && !existingIds.has(item.id)) {
                // Автоматично вивантажуємо в Supabase локальні замовлення, які були збережені до додавання колонок
                if (isSupabaseConfigured) {
                  createOrder({
                    id: String(item.id),
                    name: item.name || item.customer_name || 'Клієнт',
                    phone: item.phone || '',
                    deliveryMethod: item.deliveryMethod || item.delivery_method || 'delivery',
                    address: item.address,
                    paymentMethod: item.paymentMethod || item.payment_method || 'blik_online',
                    changeFrom: item.changeFrom || item.change_from,
                    comment: item.comment || '',
                    personsCount: item.personsCount || item.persons_count || 1,
                    timingType: item.timingType || item.timing_type || 'asap',
                    scheduledDate: item.scheduledDate || item.scheduled_date,
                    scheduledTime: item.scheduledTime || item.scheduled_time,
                    items: Array.isArray(item.items) ? item.items : [],
                    subtotal: Number(item.subtotal || 0),
                    deliveryFee: Number(item.deliveryFee ?? item.delivery_fee ?? 0),
                    total: Number(item.total || 0),
                    status: item.status || 'pending',
                    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
                    accepted_at: item.accepted_at || item.acceptedAt || localAcceptedMap[String(item.id)],
                  } as any).catch((err: any) => console.warn('Auto-sync local order error:', err));
                }

                loaded.push({
                  id: String(item.id),
                  customer_name: item.name || item.customer_name || 'Клієнт',
                  name: item.name || item.customer_name || 'Клієнт',
                  phone: item.phone || '',
                  delivery_method: item.deliveryMethod || item.delivery_method || 'delivery',
                  deliveryMethod: item.deliveryMethod || item.delivery_method || 'delivery',
                  address: item.address,
                  payment_method: item.paymentMethod || item.payment_method || 'blik_online',
                  paymentMethod: item.paymentMethod || item.paymentMethod || 'blik_online',
                  changeFrom: item.changeFrom || item.change_from,
                  comment: item.comment || '',
                  personsCount: item.personsCount || item.persons_count || 1,
                  timing_type: item.timingType || item.timing_type,
                  timingType: item.timingType || item.timing_type,
                  scheduled_time: item.scheduledTime || item.scheduled_time,
                  scheduledTime: item.scheduledTime || item.scheduled_time,
                  items: Array.isArray(item.items) ? item.items : [],
                  subtotal: Number(item.subtotal || 0),
                  delivery_fee: Number(item.deliveryFee ?? item.delivery_fee ?? 0),
                  deliveryFee: Number(item.deliveryFee ?? item.delivery_fee ?? 0),
                  total: Number(item.total || 0),
                  status: item.status || 'pending',
                  created_at: item.createdAt || item.created_at || new Date().toISOString(),
                  accepted_at: item.accepted_at || item.acceptedAt || localAcceptedMap[String(item.id)],
                  acceptedAt: item.accepted_at || item.acceptedAt || localAcceptedMap[String(item.id)],
                });
                existingIds.add(item.id);
              }
            }
          }
        } catch (e) {
          console.warn('LocalStorage orders parsing error:', e);
        }
      }

      loaded.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(loaded);
      setOrderRlsNotice(rlsIssue);

      // Перемикаємо на вкладку "Нові" ЛИШЕ один раз при отриманні дійсно нового замовлення
      if (isFirstOrdersLoadRef.current) {
        isFirstOrdersLoadRef.current = false;
        knownOrderIdsRef.current = new Set(loaded.map((o) => o.id));
        if (loaded.some((o) => o.status === 'pending')) {
          setOrderStatusFilter('pending');
        }
      } else {
        const hasBrandNewPendingOrder = loaded.some(
          (o) => o.status === 'pending' && !knownOrderIdsRef.current.has(o.id)
        );

        if (hasBrandNewPendingOrder) {
          setOrderStatusFilter('pending');
          playOrderSound();
        }

        knownOrderIdsRef.current = new Set(loaded.map((o) => o.id));
      }
    } catch (err) {
      console.warn('Failed to load orders:', err);
    } finally {
      if (showLoading) setIsLoadingOrders(false);
    }
  };

  // Оновлення статусу замовлення
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    const nowIso = new Date().toISOString();
    const isAcceptedToKitchen = newStatus === 'preparing' || newStatus === 'confirmed';

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const acceptedTime = o.accepted_at || o.acceptedAt || (isAcceptedToKitchen ? nowIso : undefined);
          return {
            ...o,
            status: newStatus as any,
            ...(acceptedTime ? { accepted_at: acceptedTime, acceptedAt: acceptedTime } : {}),
          };
        }
        return o;
      })
    );

    // Зберігаємо час прийняття на кухню в localStorage для надійного відновлення
    if (typeof window !== 'undefined' && isAcceptedToKitchen) {
      try {
        const saved = JSON.parse(localStorage.getItem('max-sushi-kitchen-accepted') || '{}');
        if (!saved[orderId]) {
          saved[orderId] = nowIso;
          localStorage.setItem('max-sushi-kitchen-accepted', JSON.stringify(saved));
        }
      } catch {}
    }

    try {
      if (isSupabaseConfigured) {
        const payload: Record<string, any> = { status: newStatus };
        if (isAcceptedToKitchen) {
          payload.accepted_at = nowIso;
        }
        const { error } = await supabase
          .from('orders')
          .update(payload)
          .eq('id', orderId);

        if (error) {
          // Якщо в базі даних ще немає стовпця accepted_at, оновлюємо тільки статус
          if (error.message?.includes('accepted_at')) {
            await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
          } else {
            console.warn('Update order status in Supabase error:', error.message);
          }
        }
      }

      if (typeof window !== 'undefined') {
        try {
          const local = JSON.parse(localStorage.getItem('max-sushi-orders') || '[]');
          const updated = local.map((o: any) =>
            o.id === orderId
              ? {
                  ...o,
                  status: newStatus,
                  ...(isAcceptedToKitchen && !o.accepted_at && !o.acceptedAt
                    ? { accepted_at: nowIso, acceptedAt: nowIso }
                    : {}),
                }
              : o
          );
          localStorage.setItem('max-sushi-orders', JSON.stringify(updated));
        } catch {}
      }
    } catch (err) {
      console.error('Error changing order status:', err);
    }
  };

  // Видалення замовлення
  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm(`Ви дійсно бажаєте видалити замовлення #${orderId}?`)) return;

    setOrders((prev) => prev.filter((o) => o.id !== orderId));

    try {
      if (isSupabaseConfigured) {
        await supabase.from('orders').delete().eq('id', orderId);
      }
      if (typeof window !== 'undefined') {
        try {
          const local = JSON.parse(localStorage.getItem('max-sushi-orders') || '[]');
          const updated = local.filter((o: any) => o.id !== orderId);
          localStorage.setItem('max-sushi-orders', JSON.stringify(updated));
        } catch {}
      }
    } catch (err) {
      console.error('Error deleting order:', err);
    }
  };

  // Копіювання номера телефону
  const handleCopyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  // Форматування дати замовлення
  const formatOrderTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return (
        date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) +
        ', ' +
        date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })
      );
    } catch {
      return isoString;
    }
  };

  // Підрахунок часу від оформлення
  const getTimeAgo = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'щойно';
      if (diffMin < 60) return `${diffMin} хв тому`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours} год тому`;
      return `${Math.floor(diffHours / 24)} дн тому`;
    } catch {
      return '';
    }
  };

  // Перевірка чи дата сьогоднішня
  const isToday = (iso?: string) => {
    if (!iso) return false;
    const d = new Date(iso);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  // Форматування запланованого часу замовлення у конкретну дату (наприклад "1.11, 13:00") замість абстрактного "Jutro"
  const formatScheduledBadgeTime = (order: AdminOrder): string => {
    const scheduled = order.scheduled_time || order.scheduledTime;
    if (!scheduled) return '';

    const timeMatch = scheduled.match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) return scheduled;

    const timeStr = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2].padStart(2, '0')}`;
    const isTomorrow =
      order.scheduled_date === 'tomorrow' ||
      order.scheduledDate === 'tomorrow' ||
      /завтра|jutro|tomorrow/i.test(scheduled);

    const targetDate = new Date(order.created_at);
    if (isNaN(targetDate.getTime())) {
      return scheduled;
    }

    if (isTomorrow) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    const day = targetDate.getDate();
    const month = targetDate.getMonth() + 1;
    return `${day}.${month < 10 ? '0' + month : month}, ${timeStr}`;
  };

  // Друк чека замовлення для кухні
  const handlePrintKitchenReceipt = (order: AdminOrder) => {
    const isPickup = order.delivery_method === 'pickup' || order.deliveryMethod === 'pickup';
    const scheduled = order.scheduled_time || order.scheduledTime;
    const isScheduled = (order.timing_type === 'scheduled' || order.timingType === 'scheduled') && Boolean(scheduled);
    const timingBadge = isScheduled ? `НА ЧАС: ${formatScheduledBadgeTime(order)}` : 'ЯКНАЙШВИДШЕ';
    const addressStr = order.address
      ? `вул. ${order.address.street || ''} ${order.address.house || ''}${order.address.apartment ? `, кв. ${order.address.apartment}` : ''}${order.address.floor ? `, пов. ${order.address.floor}` : ''}${order.address.entryCode ? `, код ${order.address.entryCode}` : ''}`
      : 'Адреса не вказана';

    const itemsHtml = order.items
      .map((item) => {
        const prod = item.product || {};
        const titleUk = typeof prod.name === 'object' ? (prod.name.uk || prod.name.pl || 'Страва') : (prod.name || 'Страва');
        const titlePl = typeof prod.name === 'object' ? (prod.name.pl || '') : '';
        const price = Number(prod.price || 0);
        return `
          <tr style="border-bottom: 1px dashed #666;">
            <td style="padding: 6px 0; font-size: 16px; font-weight: 900; width: 36px; vertical-align: top;">
              ${item.quantity}×
            </td>
            <td style="padding: 6px 4px; font-size: 14px; font-weight: bold; vertical-align: top;">
              <div>${titleUk}</div>
              ${titlePl && titlePl !== titleUk ? `<div style="font-size: 11px; font-weight: normal; color: #444; margin-top: 1px;">${titlePl}</div>` : ''}
            </td>
            <td style="padding: 6px 0; font-size: 13px; text-align: right; vertical-align: top; white-space: nowrap;">
              ${price * item.quantity} zł
            </td>
          </tr>
        `;
      })
      .join('');

    const printWindow = window.open('', '_blank', 'width=420,height=650');
    if (!printWindow) {
      alert('Будь ласка, дозвольте відкриття спливаючих вікон у браузері для друку чека.');
      return;
    }

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Чек #${order.id} - Max Sushi</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 4mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              width: 72mm;
              margin: 0 auto;
              padding: 4mm 2mm;
              color: #000;
              background: #fff;
              font-size: 13px;
              line-height: 1.35;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .header {
              border-bottom: 2px solid #000;
              padding-bottom: 6px;
              margin-bottom: 8px;
            }
            .logo {
              font-size: 22px;
              font-weight: 900;
              letter-spacing: 1.5px;
            }
            .order-id {
              font-size: 20px;
              font-weight: 900;
              margin: 4px 0 2px 0;
            }
            .timing-banner {
              background: #000;
              color: #fff;
              font-size: 15px;
              font-weight: 900;
              padding: 6px;
              margin: 8px 0;
              text-align: center;
              border-radius: 4px;
              letter-spacing: 0.5px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
              font-size: 12px;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 8px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 6px 0;
            }
            .comment-box {
              border: 2px solid #000;
              padding: 5px 7px;
              margin: 8px 0;
              font-size: 13px;
              background: #fff;
              border-radius: 3px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              font-size: 16px;
              font-weight: 900;
              margin-top: 6px;
              padding-top: 6px;
              border-top: 2px solid #000;
            }
            @media print {
              body { width: 100%; margin: 0; padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="center header">
            <div class="logo">MAX SUSHI</div>
            <div class="order-id">#${order.id}</div>
            <div style="font-size: 11px; color: #444;">${formatOrderTime(order.created_at)}</div>
          </div>

          <div class="timing-banner">
            ${timingBadge}
          </div>

          <div class="info-row">
            <span class="bold">Спосіб:</span>
            <span class="bold" style="font-size: 13px;">${isPickup ? 'САМОВИВІЗ' : 'ДОСТАВКА КУРʼЄРОМ'}</span>
          </div>
          ${!isPickup ? `<div style="font-size: 12px; margin: 3px 0 6px 0;"><strong>Адреса:</strong> ${addressStr}</div>` : ''}

          <div class="info-row">
            <span>Клієнт:</span>
            <span class="bold">${order.customer_name || order.name || 'Клієнт'}</span>
          </div>
          <div class="info-row">
            <span>Телефон:</span>
            <span class="bold">${order.phone}</span>
          </div>
          <div class="info-row">
            <span>Персон / приборів:</span>
            <span class="bold">${order.personsCount || 1} шт</span>
          </div>

          ${order.comment ? `
            <div class="comment-box">
              <strong style="text-transform: uppercase;">Коментар:</strong> ${order.comment}
            </div>
          ` : ''}

          <div class="divider"></div>
          <div class="bold" style="font-size: 13px; margin-bottom: 2px;">
            СТРАВИ (${order.items.reduce((s, i) => s + (i.quantity || 1), 0)} шт):
          </div>

          <table>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total-row">
            <span>РАЗОМ:</span>
            <span>${order.total} zł</span>
          </div>
          <div class="info-row" style="margin-top: 5px;">
            <span>Оплата:</span>
            <span class="bold">${order.payment_method === 'cash' || order.paymentMethod === 'cash' ? 'Готівка' : 'BLIK / Картка'}</span>
          </div>
          ${(order.changeFrom || (order as any).change_from) ? `
            <div class="info-row">
              <span>Решта з купюри:</span>
              <span class="bold">${order.changeFrom || (order as any).change_from}</span>
            </div>
          ` : ''}

          <div class="divider" style="margin-top: 10px;"></div>
          <div class="center" style="font-size: 11px; margin-top: 8px; color: #555;">
            Max Sushi • Смачного!
          </div>

          <div class="no-print center" style="margin-top: 15px;">
            <button onclick="window.print()" style="padding: 8px 16px; font-weight: bold; cursor: pointer; border-radius: 4px;">
              Роздрукувати ще раз
            </button>
          </div>

          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  // Підрахунки для статистики
  const newOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const inKitchenCount = orders.filter((o) => o.status === 'preparing' || o.status === 'confirmed').length;
  const inDeliveryCount = orders.filter((o) => o.status === 'in_delivery').length;
  const deliveredTodayCount = orders.filter((o) => o.status === 'delivered' && isToday(o.created_at)).length;
  const cancelledOrdersCount = orders.filter((o) => o.status === 'cancelled').length;
  const todayRevenue = orders
    .filter((o) => o.status === 'delivered' && isToday(o.created_at))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // Фільтрація та розумне сортування списку замовлень за активною плашкою
  const filteredOrders = useMemo(() => {
    const list = orders.filter((order) => {
      if (orderStatusFilter === 'pending') {
        return order.status === 'pending';
      }
      if (orderStatusFilter === 'in_progress') {
        return order.status === 'preparing' || order.status === 'confirmed';
      }
      if (orderStatusFilter === 'in_delivery') {
        return order.status === 'in_delivery';
      }
      if (orderStatusFilter === 'delivered') {
        return order.status === 'delivered';
      }
      if (orderStatusFilter === 'cancelled') {
        return order.status === 'cancelled';
      }
      if (orderStatusFilter === 'history') {
        return order.status === 'delivered';
      }
      return true;
    });

    // Розумне сортування:
    // Для вкладки "Кухня" (in_progress): сортуємо від найтерміновішого до найпізнішого!
    // Розраховуємо цільовий timestamp дедлайну для кожного замовлення.
    if (orderStatusFilter === 'in_progress') {
      const getTargetTimestamp = (o: AdminOrder) => {
        const scheduled = o.scheduled_time || o.scheduledTime;
        const isScheduled = (o.timing_type === 'scheduled' || o.timingType === 'scheduled') && Boolean(scheduled);
        if (isScheduled && scheduled) {
          const isTomorrow = scheduled.toLowerCase().includes('завтра') || 
                             scheduled.toLowerCase().includes('jutro') || 
                             scheduled.toLowerCase().includes('tomorrow');
          const timeMatch = scheduled.match(/(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            const hours = parseInt(timeMatch[1], 10);
            const mins = parseInt(timeMatch[2], 10);
            const date = new Date(o.created_at);
            if (isTomorrow) {
              date.setDate(date.getDate() + 1);
            }
            date.setHours(hours, mins, 0, 0);
            return date.getTime();
          }
        }
        // Для ASAP замовлень: рахуємо від часу прийняття на кухню (або створення) + час очікування
        const base = (o.accepted_at || o.acceptedAt)
          ? new Date(o.accepted_at || o.acceptedAt!).getTime()
          : new Date(o.created_at).getTime();
        return base + (prepWaitTimeMinutes || 40) * 60 * 1000;
      };

      return list.sort((a, b) => getTargetTimestamp(a) - getTargetTimestamp(b));
    }

    // Для решти вкладок (Нові, Курʼєр, Скасовані тощо):
    return list.sort((a, b) => {
      const aScheduled = a.scheduled_time || a.scheduledTime;
      const bScheduled = b.scheduled_time || b.scheduledTime;
      const aIsScheduled = (a.timing_type === 'scheduled' || a.timingType === 'scheduled') && Boolean(aScheduled);
      const bIsScheduled = (b.timing_type === 'scheduled' || b.timingType === 'scheduled') && Boolean(bScheduled);

      // Якщо одне термінове (ASAP), а інше попереднє на час:
      if (!aIsScheduled && bIsScheduled) return -1; // ASAP спочатку!
      if (aIsScheduled && !bIsScheduled) return 1;

      // Якщо обидва заплановані на час: спочатку сьогоднішні, потім завтрашні
      if (aIsScheduled && bIsScheduled && aScheduled && bScheduled) {
        const aIsTomorrow = aScheduled.toLowerCase().includes('завтра') || aScheduled.toLowerCase().includes('jutro');
        const bIsTomorrow = bScheduled.toLowerCase().includes('завтра') || bScheduled.toLowerCase().includes('jutro');
        if (!aIsTomorrow && bIsTomorrow) return -1;
        if (aIsTomorrow && !bIsTomorrow) return 1;
        return aScheduled.localeCompare(bScheduled);
      }

      // Інакше за часом створення (новіші вище)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [orders, orderStatusFilter]);

  // Групування замовлень по днях для розділу "Історія" (тільки виконані замовлення)
  const historyByDays = useMemo(() => {
    const groups: {
      [key: string]: {
        dateLabel: string;
        orders: AdminOrder[];
        totalRevenue: number;
        deliveredCount: number;
      };
    } = {};

    // В історію потрапляють виключно виконані замовлення
    const deliveredOrders = orders.filter((o) => o.status === 'delivered');
    const sorted = [...deliveredOrders].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    for (const order of sorted) {
      const d = new Date(order.created_at);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      if (!groups[dateKey]) {
        const now = new Date();
        const isCurrentDay =
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear();

        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const isYesterday =
          d.getDate() === yesterday.getDate() &&
          d.getMonth() === yesterday.getMonth() &&
          d.getFullYear() === yesterday.getFullYear();

        const dayName = d.toLocaleDateString('uk-UA', { weekday: 'long' });
        const dayAndMonth = d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
        const yearStr = d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : '';

        let dateLabel = `${dayAndMonth}${yearStr} (${dayName})`;
        if (isCurrentDay) dateLabel = `Сьогодні, ${dayAndMonth}`;
        if (isYesterday) dateLabel = `Вчора, ${dayAndMonth}`;

        groups[dateKey] = {
          dateLabel,
          orders: [],
          totalRevenue: 0,
          deliveredCount: 0,
        };
      }

      groups[dateKey].orders.push(order);
      groups[dateKey].totalRevenue += order.total || 0;
      groups[dateKey].deliveredCount += 1;
    }

    return Object.entries(groups).map(([dateKey, data]) => ({
      dateKey,
      ...data,
    }));
  }, [orders]);

  // Згортання / розгортання окремого дня в історії
  const toggleHistoryDay = (dateKey: string) => {
    setCollapsedHistoryDays((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
  };

  // Згортання / розгортання складу замовлення
  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const toggleExpandAllOrders = () => {
    if (expandedOrderIds.size === filteredOrders.length && filteredOrders.length > 0) {
      setExpandedOrderIds(new Set());
    } else {
      setExpandedOrderIds(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  // Розрахунок детальної аналітики та статистики на основі замовлень
  const statsData = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    // Визначення чи день є зачиненим (вихідним) закладу за графіком (наприклад, понеділок)
    const isDayClosed = (date: Date) => {
      const day = date.getDay(); // 0 = Нд, 1 = Пн, 2 = Вт, ...
      const scheduleIdx = day === 0 ? 6 : day - 1;
      return Boolean(brandTheme.contacts.schedule[scheduleIdx]?.isClosed);
    };

    const shortDayNamesUk = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const fullDayNamesUk = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'Пʼятниця', 'Субота'];

    // Кількість робочих днів для графіка (пропускаючи вихідні дні закладу)
    const targetBarsCount = statsPeriod === 'today' ? 1 : statsPeriod === '30days' ? 14 : statsPeriod === 'all' ? 18 : 7;
    const workingDaysList: Date[] = [];

    let dayOffset = 0;
    const maxLookbackDays = 60;

    while (workingDaysList.length < targetBarsCount && dayOffset < maxLookbackDays) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset);
      const isClosed = isDayClosed(d);

      if (statsPeriod === 'today') {
        workingDaysList.push(d);
        break;
      }

      // Пропускаємо вихідні дні закладу (понеділки)
      if (!isClosed) {
        workingDaysList.push(d);
      }
      dayOffset++;
    }

    // Хронологічний порядок (зліва направо)
    workingDaysList.reverse();

    const startOfPeriod = workingDaysList.length > 0 
      ? new Date(workingDaysList[0].getFullYear(), workingDaysList[0].getMonth(), workingDaysList[0].getDate()).getTime()
      : startOfToday;

    const filtered = orders.filter((o) => {
      const orderTime = new Date(o.created_at).getTime();
      if (isNaN(orderTime)) return true;

      if (statsPeriod === 'today') {
        return orderTime >= startOfToday;
      }
      if (statsPeriod === '7days' || statsPeriod === '30days') {
        return orderTime >= startOfPeriod;
      }
      return true;
    });

    const validOrders = filtered.filter((o) => o.status !== 'cancelled');
    const totalRevenue = validOrders.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const totalSubtotal = validOrders.reduce((acc, curr) => acc + (Number(curr.subtotal) || 0), 0);
    const totalDeliveryFees = validOrders.reduce((acc, curr) => acc + (Number(curr.delivery_fee ?? curr.deliveryFee ?? 0)), 0);
    const ordersCount = validOrders.length;
    const avgCheck = ordersCount > 0 ? Math.round((totalRevenue / ordersCount) * 100) / 100 : 0;

    // Статуси
    const deliveredCount = validOrders.filter((o) => o.status === 'delivered').length;
    const inProgressCount = validOrders.filter((o) => o.status === 'confirmed' || o.status === 'preparing' || o.status === 'in_delivery').length;
    const pendingCount = validOrders.filter((o) => o.status === 'pending').length;
    const cancelledCount = filtered.filter((o) => o.status === 'cancelled').length;

    // Доставка vs Самовивіз
    const deliveryCount = validOrders.filter((o) => (o.delivery_method || o.deliveryMethod) === 'delivery').length;
    const pickupCount = validOrders.filter((o) => (o.delivery_method || o.deliveryMethod) === 'pickup').length;
    const deliveryPercent = ordersCount > 0 ? Math.round((deliveryCount / ordersCount) * 100) : 0;
    const pickupPercent = ordersCount > 0 ? 100 - deliveryPercent : 0;

    // Способи оплати
    const paymentStats = {
      blik: { count: 0, sum: 0, label: 'BLIK онлайн' },
      cash: { count: 0, sum: 0, label: 'Готівка' },
      card: { count: 0, sum: 0, label: 'Картка / термінал' },
    };

    validOrders.forEach((o) => {
      const pm = (o.payment_method || o.paymentMethod || '').toLowerCase();
      const amount = Number(o.total) || 0;
      if (pm.includes('blik')) {
        paymentStats.blik.count += 1;
        paymentStats.blik.sum += amount;
      } else if (pm.includes('cash') || pm.includes('gotowka') || pm.includes('готівка')) {
        paymentStats.cash.count += 1;
        paymentStats.cash.sum += amount;
      } else {
        paymentStats.card.count += 1;
        paymentStats.card.sum += amount;
      }
    });

    // Топ-5 популярних страв
    const dishMap = new Map<string, { id: string; name: string; count: number; revenue: number; image?: string }>();

    validOrders.forEach((o) => {
      if (Array.isArray(o.items)) {
        o.items.forEach((item) => {
          if (!item?.product) return;
          const p = item.product;
          const id = String(p.id || 'unknown');
          let name = 'Страва';
          if (typeof p.name === 'object' && p.name) {
            name = (p.name as any).uk || (p.name as any).pl || 'Страва';
          } else if (typeof p.name === 'string') {
            name = p.name;
          }
          const price = Number(p.price || 0);
          const qty = Number(item.quantity || 1);

          const existing = dishMap.get(id);
          if (existing) {
            existing.count += qty;
            existing.revenue += price * qty;
          } else {
            dishMap.set(id, {
              id,
              name,
              count: qty,
              revenue: price * qty,
              image: p.image,
            });
          }
        });
      }
    });

    const topDishes = Array.from(dishMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const maxDishCount = topDishes.length > 0 ? Math.max(...topDishes.map((d) => d.count)) : 1;

    // Динаміка замовлень по робочих днях для стовпчастого графіка (без вихідних днів закладу)
    const daysMap = new Map<string, {
      label: string;
      dayName: string;
      fullDateLabel: string;
      dateStr: string;
      revenue: number;
      count: number;
    }>();

    workingDaysList.forEach((d) => {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
      const dayName = shortDayNamesUk[d.getDay()];
      const fullDateLabel = `${fullDayNamesUk[d.getDay()]}, ${label}`;
      daysMap.set(key, { label, dayName, fullDateLabel, dateStr: key, revenue: 0, count: 0 });
    });

    validOrders.forEach((o) => {
      const d = new Date(o.created_at);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const item = daysMap.get(key);
      if (item) {
        item.revenue += Number(o.total) || 0;
        item.count += 1;
      }
    });

    const chartBars = Array.from(daysMap.values());
    const maxBarRevenue = chartBars.length > 0 ? Math.max(...chartBars.map((b) => b.revenue), 100) : 100;

    // Пікові години
    const hoursStats = {
      lunch: { label: '12:00 – 15:00', sub: 'Обідній час', count: 0, revenue: 0 },
      day: { label: '15:00 – 18:00', sub: 'Денний час', count: 0, revenue: 0 },
      evening: { label: '18:00 – 21:00', sub: 'Вечірній пік', count: 0, revenue: 0 },
      other: { label: 'Інший час', sub: 'До / після', count: 0, revenue: 0 },
    };

    validOrders.forEach((o) => {
      const d = new Date(o.created_at);
      if (isNaN(d.getTime())) return;
      const h = d.getHours();
      const amount = Number(o.total) || 0;
      if (h >= 12 && h < 15) {
        hoursStats.lunch.count += 1;
        hoursStats.lunch.revenue += amount;
      } else if (h >= 15 && h < 18) {
        hoursStats.day.count += 1;
        hoursStats.day.revenue += amount;
      } else if (h >= 18 && h <= 21) {
        hoursStats.evening.count += 1;
        hoursStats.evening.revenue += amount;
      } else {
        hoursStats.other.count += 1;
        hoursStats.other.revenue += amount;
      }
    });

    // Унікальні клієнти
    const uniquePhones = new Set(validOrders.map((o) => (o.phone || '').replace(/[^\d]/g, '').slice(-9)).filter(Boolean));

    return {
      totalRevenue,
      totalSubtotal,
      totalDeliveryFees,
      ordersCount,
      avgCheck,
      deliveredCount,
      inProgressCount,
      pendingCount,
      cancelledCount,
      deliveryCount,
      pickupCount,
      deliveryPercent,
      pickupPercent,
      paymentStats,
      topDishes,
      maxDishCount,
      chartBars,
      maxBarRevenue,
      hoursStats,
      uniqueClientsCount: uniquePhones.size,
    };
  }, [orders, statsPeriod]);

  // Автозавантаження меню, замовлень та Realtime підписка на Supabase
  useEffect(() => {
    if (session) {
      loadMenu();
      loadOrders();

      const channel = supabase
        .channel('admin_orders_channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            console.log('Realtime orders change detected:', payload);
            loadOrders(false);
            if (payload.eventType === 'INSERT') {
              playOrderSound();
              setOrderStatusFilter('pending');
            }
          }
        )
        .subscribe();

      // Періодичне автооновлення раз на 25 секунд
      const interval = setInterval(() => {
        loadOrders(false);
      }, 25000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(interval);
      };
    }
  }, [session]);

  // Обробник входу
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        if (error.message?.includes('Failed to fetch')) {
          setErrorMessage('Помилка з\'єднання (Failed to fetch). Перевірте правильність налаштувань бази.');
        } else {
          setErrorMessage(error.message || 'Невірний логін або пароль');
        }
      } else if (data.session) {
        setSession(data.session);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Помилка з\'єднання з сервером');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Обробник виходу
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('max-sushi-is-admin');
        window.dispatchEvent(new Event('admin-auth-changed'));
      }
    } catch (err) {
      console.warn('Logout error:', err);
    }
  };

  // Відкриття модалки для додавання нової страви
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormId(`dish-${Date.now()}`);
    // Враховуємо обраний зараз розділ меню або перший з наявних
    const defaultCat = selectedCategoryFilter !== 'all' 
      ? selectedCategoryFilter 
      : (categories[0]?.id || 'mini-maki');
    setFormCategoryId(defaultCat);
    setIsFormCategoryDropdownOpen(false);
    setActiveLangTab('pl');
    setFormNamePl('');
    setFormNameUk('');
    setFormDescPl('');
    setFormDescUk('');
    setFormPrice(25);
    setFormWeight(250);
    setFormPieces('8');
    setFormBadge('');
    setFormIngredientsPl('');
    setFormIngredientsUk('');
    setFormImage('');
    setFormImageFile(null);
    setFormImagePreview('');
    setFormZoom('');
    setFormIsAvailable(true);
    setIsModalOpen(true);
  };

  // Відкриття модалки для редагування існуючої страви
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormId(product.id);
    setFormCategoryId(product.categoryId);
    setIsFormCategoryDropdownOpen(false);
    setActiveLangTab('pl');
    setFormNamePl(product.name.pl || '');
    setFormNameUk(product.name.uk || '');
    setFormDescPl(product.description.pl || '');
    setFormDescUk(product.description.uk || '');
    setFormPrice(product.price);
    setFormWeight(product.weight);
    setFormPieces(product.pieces ? String(product.pieces) : '');
    setFormBadge(product.badge || '');
    setFormIngredientsPl(product.ingredients.pl?.join(', ') || '');
    setFormIngredientsUk(product.ingredients.uk?.join(', ') || '');
    setFormImage(product.image || '');
    setFormImageFile(null);
    setFormImagePreview(product.image || '');
    const currentZoom = (product.nutrition as any)?.zoom;
    setFormZoom(currentZoom ? Number(currentZoom) : '');
    setFormIsAvailable(product.isAvailable);
    setIsModalOpen(true);
  };

  // Швидкий автопереклад з польської на українську
  const handleAutoTranslate = async () => {
    if (!formNamePl.trim() && !formDescPl.trim() && !formIngredientsPl.trim()) {
      setErrorMessage('Спочатку заповніть назву, опис або інгредієнти польською мовою.');
      return;
    }
    setIsTranslating(true);
    setErrorMessage('');
    try {
      const res = await autoTranslateDish({
        namePl: formNamePl,
        descPl: formDescPl,
        ingredientsPl: formIngredientsPl,
      });
      if (res.nameUk) setFormNameUk(res.nameUk);
      if (res.descUk) setFormDescUk(res.descUk);
      if (res.ingredientsUk) setFormIngredientsUk(res.ingredientsUk);
      setActiveLangTab('uk');
      showToast('Автопереклад виконано! Перевірте українську версію.');
    } catch (err: any) {
      setErrorMessage('Помилка під час автоперекладу.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Створення нової категорії
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNamePl.trim()) {
      setErrorMessage('Вкажіть назву категорії польською.');
      return;
    }
    setIsCreatingCategory(true);
    setErrorMessage('');
    try {
      const slug = newCatNamePl
        .toLowerCase()
        .trim()
        .replace(/ł/g, 'l')
        .replace(/ą/g, 'a')
        .replace(/ę/g, 'e')
        .replace(/ć/g, 'c')
        .replace(/ń/g, 'n')
        .replace(/ó/g, 'o')
        .replace(/ś/g, 's')
        .replace(/ź|ż/g, 'z')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || `cat-${Date.now()}`;

      const res = await createCategory({
        id: slug,
        name: {
          pl: newCatNamePl.trim(),
          uk: newCatNameUk.trim() || newCatNamePl.trim(),
        },
        icon: 'CircleDot',
        sort_order: categories.length,
      });

      if (!res.success || !res.data) throw new Error(res.error || 'Помилка збереження');

      setCategories((prev) => [...prev, res.data!]);
      setFormCategoryId(res.data.id);
      setSelectedCategoryFilter(res.data.id);
      setIsAddCategoryModalOpen(false);
      setNewCatNamePl('');
      setNewCatNameUk('');
      showToast(`Категорію "${res.data.name.pl}" успішно створено!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Не вдалося створити категорію');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Швидке перемикання доступності (наявність страви)
  const handleToggleAvailability = async (product: Product) => {
    const newStatus = !product.isAvailable;
    // Оптимістично оновлюємо UI
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, isAvailable: newStatus } : p))
    );

    const res = await updateProduct(product.id, { isAvailable: newStatus });
    if (!res.success) {
      // Відкат назад при помилці
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isAvailable: !newStatus } : p))
      );
      setErrorMessage(`Помилка оновлення наявності: ${res.error}`);
    } else {
      showToast(newStatus ? 'Страву активовано в меню' : 'Страву знято з меню (стоп-лист)');
    }
  };

  // Видалення страви
  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Точно видалити страву "${product.name.pl} / ${product.name.uk}"?`)) {
      return;
    }

    const res = await deleteProduct(product.id);
    if (res.success) {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      showToast('Страву успішно видалено');
    } else {
      setErrorMessage(`Помилка видалення: ${res.error}`);
    }
  };

  // Пряме завантаження фотографії (клік через файл або Drag & Drop)
  const handleDirectFileUpload = async (file: File, productId: string) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Будь ласка, перетягуйте лише файли зображень (JPG, PNG, WEBP).');
      return;
    }
    setUploadingImageId(productId);
    const uploadRes = await uploadProductImage(file, productId);

    if (uploadRes.success && uploadRes.url) {
      const updateRes = await updateProduct(productId, { image: uploadRes.url });
      if (updateRes.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, image: uploadRes.url! } : p))
        );
        showToast('Фотографію страви успішно збережено!');
      } else {
        setErrorMessage(`Помилка збереження URL фото: ${updateRes.error}`);
      }
    } else {
      setErrorMessage(`Помилка завантаження фото в Supabase Storage: ${uploadRes.error}. Переконайтесь, що бакет "products" створено як Public!`);
    }

    setUploadingImageId(null);
  };

  // Швидке завантаження фото прямо зі списку карток
  const triggerQuickUpload = (productId: string) => {
    setQuickUploadProductId(productId);
    quickFileInputRef.current?.click();
  };

  const handleQuickFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const pId = quickUploadProductId;
    if (file && pId) {
      await handleDirectFileUpload(file, pId);
    }
    setQuickUploadProductId(null);
    e.target.value = '';
  };

  // Вибір фото всередині модального вікна
  const handleModalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setFormImagePreview(previewUrl);
    }
  };

  // Збереження страви з модалки (створення або редагування)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formNamePl.trim()) {
      setActiveLangTab('pl');
      setErrorMessage('Вкажіть назву страви.');
      return;
    }

    setIsSavingProduct(true);

    try {
      let finalNameUk = formNameUk.trim();
      let finalDescUk = formDescUk.trim();
      let finalIngUk = formIngredientsUk.trim();
      let wasAutoTranslated = false;

      // Автоматичний автопереклад, якщо українську назву не ввели вручну
      if (!finalNameUk && formNamePl.trim()) {
        try {
          const trans = await autoTranslateDish({
            namePl: formNamePl.trim(),
            descPl: formDescPl.trim(),
            ingredientsPl: formIngredientsPl.trim(),
          });
          finalNameUk = trans.nameUk || formNamePl.trim();
          if (!finalDescUk && trans.descUk) finalDescUk = trans.descUk;
          if (!finalIngUk && trans.ingredientsUk) finalIngUk = trans.ingredientsUk;
          wasAutoTranslated = true;
        } catch (err) {
          console.warn('Auto translation fallback:', err);
          finalNameUk = formNamePl.trim();
          if (!finalDescUk) finalDescUk = formDescPl.trim();
          if (!finalIngUk) finalIngUk = formIngredientsPl.trim();
        }
      }

      let finalImageUrl = formImage;

      // Якщо обрано новий файл, спочатку вантажимо його в Storage
      if (formImageFile) {
        const uploadRes = await uploadProductImage(formImageFile, formId);
        if (uploadRes.success && uploadRes.url) {
          finalImageUrl = uploadRes.url;
        } else {
          throw new Error(`Помилка завантаження фото в Storage: ${uploadRes.error}`);
        }
      }

      const ingPlArray = formIngredientsPl
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
      const ingUkArray = finalIngUk
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      const baseNutrition: any = { ...(editingProduct?.nutrition || { calories: 0, proteins: 0, fats: 0, carbs: 0 }) };
      if (formZoom) {
        baseNutrition.zoom = Number(formZoom);
      } else {
        delete baseNutrition.zoom;
      }

      const productPayload: Product = {
        id: formId,
        categoryId: formCategoryId,
        name: { pl: formNamePl.trim(), uk: finalNameUk },
        description: { pl: formDescPl.trim(), uk: finalDescUk },
        price: Number(formPrice),
        weight: Number(formWeight),
        pieces: formPieces ? Number(formPieces) : undefined,
        badge: (formBadge as ProductBadgeType) || undefined,
        image: finalImageUrl,
        ingredients: { pl: ingPlArray, uk: ingUkArray },
        nutrition: baseNutrition,
        isAvailable: formIsAvailable,
      };

      if (editingProduct) {
        // Редагування
        const res = await updateProduct(editingProduct.id, productPayload);
        if (!res.success) throw new Error(res.error);

        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? productPayload : p))
        );
      } else {
        // Створення нової
        const res = await createProduct(productPayload);
        if (!res.success) throw new Error(res.error);

        setProducts((prev) => [productPayload, ...prev]);
      }

      setIsModalOpen(false);

      if (wasAutoTranslated) {
        showNotice('Увага: переклад на українську задіявся автоматично! Перевірте та відредагуйте в разі некоректності.');
      } else {
        showToast(editingProduct ? 'Дані страви оновлено!' : 'Нову страву успішно додано в меню!');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Не вдалося зберегти страву');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  };

  const showNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => {
      setNoticeMessage('');
    }, 8000);
  };

  // Швидка зміна масштабу фотографії страви прямо з картки списку
  const handleQuickZoomChange = async (product: Product, delta: number) => {
    const currentZoom = getProductZoom(product);
    const newZoom = Number(Math.max(0.8, Math.min(1.6, currentZoom + delta)).toFixed(2));

    const updatedNutrition = {
      ...(product.nutrition || { calories: 0, proteins: 0, fats: 0, carbs: 0 }),
      zoom: newZoom,
    };

    // Оптимістично оновлюємо локальний стейт
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, nutrition: updatedNutrition } : p
      )
    );

    try {
      await updateProduct(product.id, { nutrition: updatedNutrition });
      showToast(`Масштаб «${product.name.uk || product.name.pl}»: ${Math.round(newZoom * 100)}%`);
    } catch (err: any) {
      console.error('Quick zoom update failed', err);
    }
  };

  // Ефективний зум для форми редагування
  const effectiveModalZoom = formZoom 
    ? Number(formZoom) 
    : getProductZoom({ id: formId, categoryId: formCategoryId, nutrition: null });

  // Фільтрація страв для списку
  const filteredProducts = products.filter((p) => {
    return selectedCategoryFilter === 'all' || p.categoryId === selectedCategoryFilter;
  });

  // Активна категорія для мобільного випадаючого списку
  const activeCategoryObj = categories.find((c) => c.id === selectedCategoryFilter);
  const activeCount = selectedCategoryFilter === 'all'
    ? products.length
    : products.filter((p) => p.categoryId === selectedCategoryFilter).length;

  // Екран завантаження
  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070a] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#e50914] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 font-semibold tracking-wider uppercase">Завантаження адмін-панелі...</p>
        </div>
      </div>
    );
  }

  // Якщо не авторизований — форма входу
  if (!session) {
    return (
      <div className="min-h-screen bg-[#07070a] flex items-center justify-center p-4 selection:bg-[#e50914] selection:text-white">
        <div 
          style={{
            clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
          }}
          className="w-full max-w-md p-[1px] bg-gradient-to-b from-white/20 via-[#e50914]/40 to-white/10 shadow-2xl shadow-black/90"
        >
          <div 
            style={{
              clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)',
            }}
            className="bg-[#0e0e14] p-6 sm:p-8 flex flex-col"
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#e50914] shadow-lg shadow-[#e50914]/40 mb-3 bg-black">
                <img
                  src={brandTheme.logo}
                  alt={brandTheme.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
                Maks Sushi Admin
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Панель керування закладом та замовленнями
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2.5 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Email адміністратора
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full bg-[#161622] border border-white/10 focus:border-[#e50914] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#161622] border border-white/10 focus:border-[#e50914] rounded-lg pl-9 pr-10 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                }}
                className="mt-2 w-full py-3 bg-[#e50914] hover:bg-[#f4222d] text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg shadow-[#e50914]/30 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Перевірка входу...</span>
                  </>
                ) : (
                  <span>Увійти в панель</span>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <Link
                href="/pl"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <span>Повернутися на сайт Maks Sushi</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Розрахунок часу, що залишився до дедлайну приготування / доставки (хвилини)
  const getOrderRemainingMinutes = (order: AdminOrder) => {
    const scheduled = order.scheduled_time || order.scheduledTime;
    const isScheduled = (order.timing_type === 'scheduled' || order.timingType === 'scheduled') && Boolean(scheduled);
    const now = Date.now();

    if (isScheduled && scheduled) {
      const isTomorrow = scheduled.toLowerCase().includes('завтра') || 
                         scheduled.toLowerCase().includes('jutro') || 
                         scheduled.toLowerCase().includes('tomorrow');
      const timeMatch = scheduled.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        const mins = parseInt(timeMatch[2], 10);
        const targetDate = new Date(order.created_at);
        if (isTomorrow) {
          targetDate.setDate(targetDate.getDate() + 1);
        }
        targetDate.setHours(hours, mins, 0, 0);
        return Math.round((targetDate.getTime() - now) / 60000);
      }
    }

    // Для ASAP: рахуємо від моменту натиску "Прийняти на кухню" (або від створення, якщо ще не прийнято)
    const baseTime = (order.accepted_at || order.acceptedAt)
      ? new Date(order.accepted_at || order.acceptedAt!).getTime()
      : new Date(order.created_at).getTime();

    const targetTime = baseTime + (prepWaitTimeMinutes || 40) * 60000;
    return Math.round((targetTime - now) / 60000);
  };

  // Функція рендерингу однієї картки замовлення
  const renderOrderCard = (order: AdminOrder, index = 0, isUrgent = false) => {
    const isNew = order.status === 'pending';
    const isKitchen = order.status === 'preparing' || order.status === 'confirmed';
    const isInDelivery = order.status === 'in_delivery';
    const isDelivered = order.status === 'delivered';
    const isPickup = order.delivery_method === 'pickup' || order.deliveryMethod === 'pickup';
    const isExpanded = expandedOrderIds.has(order.id);
    const isEven = index % 2 === 0;

    // Розрахунок залишку хвилин для кухні
    const remainingMins = isKitchen ? getOrderRemainingMinutes(order) : null;

    // Чергування відтінків (зебра) для максимального розрізнення сусідніх карток
    // Чітко контрастні стилі для парних і непарних карток:
    const cardBgClass = isNew
      ? isEven
        ? 'bg-[#150f16] border-rose-500/70 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/40'
        : 'bg-[#0f0c13] border-rose-500/40 shadow-md shadow-rose-950/20'
      : isKitchen
        ? isEven
          ? 'bg-[#181510] border-amber-500/50 shadow-lg shadow-amber-950/30'
          : 'bg-[#111118] border-amber-500/25 shadow-md shadow-black/40'
        : isEven
          ? 'bg-[#13131e] border-white/15'
          : 'bg-[#0c0c14] border-white/10';

    return (
      <div
        key={order.id}
        style={{
          clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
        }}
        className={cn(
          'p-4 sm:p-5 transition-all duration-300 relative border',
          cardBgClass
        )}
      >
        {/* Верхня плашка картки: Номер замовлення, статус, час, видалення */}
        <div className="flex flex-col gap-2 pb-3.5 border-b border-white/5">
          {/* Рядок 1: Номер замовлення, статус та плашка таймінгу (flex-col на мобільних для 100% захисту від накладання) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="text-base sm:text-lg font-black text-white tracking-wide">
                #{order.id}
              </span>

              {/* Статус замовлення: на кухні, у курʼєра та в доставлених статуси не показуються */}
              {!isKitchen && !isInDelivery && !isDelivered && orderStatusFilter !== 'in_progress' && orderStatusFilter !== 'in_delivery' && orderStatusFilter !== 'delivered' && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black border shrink-0',
                    order.status === 'pending' && 'bg-rose-500/15 text-rose-400 border-rose-500/40',
                    order.status === 'confirmed' && 'bg-blue-500/15 text-blue-400 border-blue-500/40',
                    order.status === 'preparing' && 'bg-amber-500/15 text-amber-400 border-amber-500/40',
                    order.status === 'in_delivery' && 'bg-purple-500/15 text-purple-400 border-purple-500/40',
                    order.status === 'delivered' && 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
                    order.status === 'cancelled' && 'bg-zinc-700/20 text-zinc-400 border-zinc-700/40'
                  )}
                >
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      order.status === 'pending' && 'bg-rose-500 animate-ping',
                      order.status === 'confirmed' && 'bg-blue-500',
                      order.status === 'preparing' && 'bg-amber-500 animate-pulse',
                      order.status === 'in_delivery' && 'bg-purple-500',
                      order.status === 'delivered' && 'bg-emerald-500',
                      order.status === 'cancelled' && 'bg-zinc-500'
                    )}
                  />
                  {order.status === 'pending' && 'Нове'}
                  {order.status === 'confirmed' && 'Підтверджено'}
                  {order.status === 'preparing' && 'Кухня (готується)'}
                  {order.status === 'in_delivery' && (isPickup ? 'Готово до видачі' : 'Курʼєр (в дорозі)')}
                  {order.status === 'delivered' && 'Виконано'}
                  {order.status === 'cancelled' && 'Скасовано'}
                </span>
              )}
            </div>

            {/* Бейдж бажаного часу / зворотній відлік для кухні */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {((order.timing_type === 'scheduled' || order.timingType === 'scheduled') && (order.scheduled_time || order.scheduledTime)) ? (
                <span 
                  style={{
                    clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/25 border border-amber-500/60 text-amber-300 font-black text-xs shadow-xs"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                  <span>НА ЧАС: {formatScheduledBadgeTime(order)}</span>
                </span>
              ) : (!isKitchen && !isInDelivery && !isDelivered && orderStatusFilter !== 'in_progress' && orderStatusFilter !== 'in_delivery' && orderStatusFilter !== 'delivered') ? (
                <span 
                  style={{
                    clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800/80 border border-white/10 text-zinc-300 font-bold text-[10px]"
                >
                  <span>Якнайшвидше</span>
                </span>
              ) : null}

              {/* Пульсуючий відлік для кухні: показується лише коли часу залишилось менше або дорівнює часу очікування */}
              {isKitchen && remainingMins !== null && remainingMins <= (prepWaitTimeMinutes || 40) && (
                <span
                  style={{
                    clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
                  }}
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1 font-black text-xs tracking-wider border shadow-sm animate-pulse',
                    remainingMins <= 0
                      ? 'bg-rose-600 text-white border-rose-400'
                      : 'bg-rose-500/25 text-rose-300 border-rose-500/50'
                  )}
                >
                  <Timer className="w-3.5 h-3.5 text-rose-400" />
                  <span>
                    {remainingMins <= 0
                      ? `ПРОСТРОЧЕНО: ${Math.abs(remainingMins)} хв`
                      : `Залишилось: ~${remainingMins} хв`}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Рядок 2: Дата та час створення зліва, кнопки друку та видалення справа */}
          <div className="flex items-center justify-between gap-2 text-xs text-zinc-400 pt-0.5">
            <div className="flex items-center gap-2 min-w-0">
              {/* Дата створення замовлення (на кухні прихована на мобільних телефонах та планшетах) */}
              <span
                className={cn(
                  'items-center gap-1.5 font-mono whitespace-nowrap text-zinc-400',
                  (isKitchen || orderStatusFilter === 'in_progress')
                    ? 'hidden lg:inline-flex'
                    : 'inline-flex'
                )}
              >
                <Clock className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                <span>{formatOrderTime(order.created_at)}</span>
              </span>

              {/* Час тому */}
              <span className="text-[11px] text-zinc-500 font-medium whitespace-nowrap">
                ({getTimeAgo(order.created_at)})
              </span>
            </div>

            {/* Кнопки дій: Друк чека та Видалення */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Кнопка швидкого друку чека для кухні */}
              <button
                type="button"
                onClick={() => handlePrintKitchenReceipt(order)}
                title="Роздрукувати чек замовлення"
                className="p-1.5 text-zinc-400 hover:text-amber-300 bg-white/5 hover:bg-white/10 rounded-lg transition-all cursor-pointer active:scale-95 border border-white/5"
              >
                <Printer className="w-4 h-4 text-amber-400/90 hover:text-amber-300" />
              </button>

              {/* Іконка видалення (прихована на кухні, у курʼєра та в доставлених) */}
              {!(isKitchen || isInDelivery || isDelivered || orderStatusFilter === 'in_progress' || orderStatusFilter === 'in_delivery' || orderStatusFilter === 'delivered') && (
                <button
                  type="button"
                  onClick={() => handleDeleteOrder(order.id)}
                  title="Видалити замовлення"
                  className="p-1.5 text-zinc-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer active:scale-95 border border-white/5"
                >
                  <Trash2 className="w-4 h-4 text-zinc-400 hover:text-rose-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Основна інформація: Клієнт, Адреса, Оплата */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 py-3.5 text-xs border-b border-white/5">
          {/* Клієнт */}
          <div className="space-y-1 bg-[#14141e] p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">
              Клієнт
            </span>
            <div className="flex items-center gap-1.5 font-bold text-white text-sm">
              <User className="w-3.5 h-3.5 text-[#e50914] shrink-0" />
              <span className="truncate">{order.customer_name || order.name || 'Клієнт'}</span>
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <a
                href={`tel:${order.phone}`}
                className="font-mono text-zinc-300 hover:text-[#e50914] flex items-center gap-1 font-semibold transition-colors"
              >
                <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{order.phone}</span>
              </a>
              <button
                type="button"
                onClick={() => handleCopyPhone(order.phone, order.id)}
                className="text-[10px] text-zinc-400 hover:text-white px-1.5 py-0.5 bg-white/5 hover:bg-white/10 rounded transition-all cursor-pointer"
              >
                {copiedPhoneId === order.id ? 'Скопійовано' : 'Копіювати'}
              </button>
            </div>
          </div>

          {/* Доставка / Самовивіз */}
          <div className="space-y-1 bg-[#14141e] p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">
              Спосіб отримання
            </span>
            {isPickup ? (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                  <Store className="w-3.5 h-3.5 text-[#e50914] shrink-0" />
                  <span>Самовивіз</span>
                </div>
                <span className="inline-block text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.2 rounded font-black">
                  Знижка -{brandTheme.delivery.pickupDiscountPercent}% застосована
                </span>
              </div>
            ) : (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                  <Truck className="w-3.5 h-3.5 text-[#e50914] shrink-0" />
                  <span>Доставка кур'єром</span>
                </div>
                <div className="text-zinc-300 flex items-start gap-1 font-medium leading-tight">
                  <MapPin className="w-3 h-3 text-[#e50914] shrink-0 mt-0.5" />
                  <span>
                    {order.address?.street
                      ? `вул. ${order.address.street} ${order.address.house || ''}`
                      : 'Адреса не вказана'}
                    {order.address?.apartment && `, кв. ${order.address.apartment}`}
                    {order.address?.floor && `, пов. ${order.address.floor}`}
                    {order.address?.entryCode && `, код ${order.address.entryCode}`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Спосіб оплати */}
          <div className="space-y-1 bg-[#14141e] p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">
              Оплата
            </span>
            <div className="flex items-center gap-1.5 font-bold text-white text-sm">
              {order.payment_method === 'cash' || order.paymentMethod === 'cash' ? (
                <>
                  <Banknote className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Готівка при отриманні</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-3.5 h-3.5 text-[#e50914] shrink-0" />
                  <span>BLIK / Картка</span>
                </>
              )}
            </div>
            {(order.changeFrom || (order as any).change_from) && (
              <p className="text-[11px] text-amber-300 font-medium">
                Решта з купюри: <span className="font-bold">{order.changeFrom || (order as any).change_from}</span>
              </p>
            )}
          </div>
        </div>

        {/* Коментар клієнта (якщо є) */}
        {order.comment && (
          <div className="my-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 block text-[10px] uppercase tracking-wider">
                Коментар клієнта:
              </span>
              <span className="italic leading-relaxed">{order.comment}</span>
            </div>
          </div>
        )}

        {/* Склад замовлення: компактний режим зі згортанням/розгортанням */}
        <div className="py-2.5">
          <button
            type="button"
            onClick={() => toggleOrderExpand(order.id)}
            style={{
              clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
            }}
            className={cn(
              'w-full flex items-center justify-between gap-3 px-3 py-2 transition-all cursor-pointer border select-none group',
              isExpanded
                ? 'bg-[#181824] border-white/20 text-white shadow-xs'
                : 'bg-[#13131e] hover:bg-[#1a1a28] border-white/5 hover:border-white/15 text-zinc-300'
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Package className={cn('w-3.5 h-3.5 shrink-0 transition-colors', isExpanded ? 'text-[#e50914]' : 'text-zinc-400 group-hover:text-white')} />
              <span className="text-xs font-bold text-white shrink-0">
                Склад ({order.items.reduce((acc, i) => acc + (i.quantity || 1), 0)} шт):
              </span>
              {!isExpanded && (
                <span className="text-xs text-zinc-400 truncate font-normal">
                  {order.items
                    .map((i) => {
                      const prod = i.product || {};
                      const title = typeof prod.name === 'object' ? prod.name.uk || prod.name.pl : prod.name;
                      return `${title || 'Страва'} ×${i.quantity || 1}`;
                    })
                    .join(', ')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold text-zinc-400 group-hover:text-white">
              <span className="hidden xs:inline text-[11px] text-zinc-500 font-semibold">
                {isExpanded ? 'Згорнути' : 'Розгорнути'}
              </span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 text-[#e50914] transition-transform duration-200',
                  isExpanded ? 'rotate-180' : ''
                )}
              />
            </div>
          </button>

          {/* Розгорнутий детальний список страв */}
          {isExpanded && (
            <div className="mt-2 divide-y divide-white/5 bg-[#12121c] rounded-xl p-2.5 sm:p-3 border border-white/5 animate-in fade-in zoom-in-98 duration-150">
              {order.items.map((item, idx) => {
                const prod = item.product || {};
                const title =
                  typeof prod.name === 'object'
                    ? prod.name.uk || prod.name.pl || 'Страва'
                    : prod.name || 'Страва';
                const titlePl =
                  typeof prod.name === 'object' ? prod.name.pl : '';
                const price = Number(prod.price || 0);

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 first:pt-0 last:pb-0 gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {prod.image ? (
                        <img
                          src={prod.image}
                          alt={title}
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover bg-black/40 shrink-0 border border-white/10"
                        />
                      ) : (
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10 text-zinc-500">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-white truncate">{title}</p>
                        {titlePl && titlePl !== title && (
                          <p className="text-[10px] text-zinc-400 truncate italic">{titlePl}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs sm:text-sm font-black text-white">
                        <span className="text-[#e50914] font-bold mr-1.5">×{item.quantity}</span>
                        <span>{formatPrice(price * (item.quantity || 1))}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {formatPrice(price)} / шт
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Фінансовий підсумок + Кнопки зміни статусів */}
        <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          {/* Суми */}
          <div className="flex items-baseline gap-3 text-xs">
            <span className="text-zinc-400">
              Страви: <strong className="text-white">{formatPrice(order.subtotal)}</strong>
            </span>
            {!isPickup && order.delivery_fee > 0 && (
              <span className="text-zinc-400">
                Доставка: <strong className="text-white">{formatPrice(order.delivery_fee)}</strong>
              </span>
            )}
            <div className="text-sm sm:text-base font-black text-white pl-2 border-l border-white/10">
              Разом: <span className="text-[#e50914]">{formatPrice(order.total)}</span>
            </div>
          </div>

          {/* Кнопки переходу між статусами (випадаючі списки прибрано — всі дії виконують прямі кнопки) */}
          <div className="w-full sm:w-auto flex flex-wrap items-center justify-center sm:justify-end gap-2">
            {/* 1. Нове замовлення: кнопка прийняти на кухню + скасувати */}
            {order.status === 'pending' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                  style={{
                    clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                  }}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>Прийняти на кухню</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Скасувати замовлення #${order.id}?`)) {
                      handleUpdateOrderStatus(order.id, 'cancelled');
                    }
                  }}
                  style={{
                    clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                  }}
                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title="Скасувати нове замовлення"
                >
                  <Ban className="w-3.5 h-3.5 text-rose-500" />
                  <span>Скасувати</span>
                </button>
              </div>
            )}

            {/* 2. Кухня: кнопка друку та передати курʼєру або готово до видачі */}
            {(order.status === 'preparing' || order.status === 'confirmed') && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintKitchenReceipt(order)}
                  style={{
                    clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                  }}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border border-white/10 hover:border-white/25 active:scale-95 shadow-sm"
                  title="Роздрукувати чек для кухаря"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Друк</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateOrderStatus(order.id, 'in_delivery')}
                  style={{
                    clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                  }}
                  className="px-3.5 py-2 bg-purple-500 hover:bg-purple-400 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-500/20 active:scale-95"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{isPickup ? 'Готово до видачі' : 'Передати курʼєру'}</span>
                </button>
              </div>
            )}

            {/* 3. Доставка: кнопка позначити виконаним */}
            {order.status === 'in_delivery' && (
              <button
                type="button"
                onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                style={{
                  clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                }}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Позначити виконаним</span>
              </button>
            )}

            {/* 4. Виконано: красива плашка завершеного замовлення */}
            {order.status === 'delivered' && (
              <span className="px-3 py-1.5 text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Виконано</span>
              </span>
            )}

            {/* 5. Скасовано: статус та можливість відновити */}
            {order.status === 'cancelled' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-zinc-500 flex items-center gap-1 bg-zinc-900/80 px-2.5 py-1.5 border border-zinc-700/40 rounded">
                  <Ban className="w-3.5 h-3.5 text-zinc-500" />
                  Скасовано
                </span>
                <button
                  type="button"
                  onClick={() => handleUpdateOrderStatus(order.id, 'pending')}
                  style={{
                    clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                  }}
                  className="px-2.5 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  title="Відновити замовлення назад у 'Нові'"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Відновити</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Dashboard адмін-панелі
  return (
    <div className="min-h-screen bg-[#07070a] text-zinc-100 flex flex-col selection:bg-[#e50914] selection:text-white">
      {/* Прихований інпут для швидкого завантаження фото зі списку */}
      <input
        ref={quickFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleQuickFileChange}
      />

      {/* Хедер адмінки */}
      <header className="sticky top-0 z-40 bg-[#0d0d14]/95 backdrop-blur-xl border-b border-white/10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group select-none"
            title="Головна панель керування"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#e50914] bg-black shrink-0 transition-transform group-hover:scale-105 shadow-md shadow-[#e50914]/30">
              <img
                src={brandTheme.logo}
                alt={brandTheme.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-sm font-black text-white tracking-wide uppercase group-hover:text-[#ff4d58] transition-colors">
                  Maks Sushi
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#e50914]/20 text-[#e50914] border border-[#e50914]/40">
                  Admin
                </span>
              </div>
            </div>
          </div>

          {/* Десктопні кнопки дій у шапці */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            {/* Кнопка налаштувань (іконка шестерні) */}
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              title="Налаштування системи"
              className={cn(
                'p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center',
                activeTab === 'settings'
                  ? 'bg-[#e50914] text-white border-[#e50914] shadow-md shadow-[#e50914]/40'
                  : 'text-zinc-400 hover:text-white bg-[#151520] hover:bg-[#1e1e2d] border-white/10'
              )}
            >
              <Settings className="w-4 h-4" />
            </button>

            <Link
              href="/pl"
              title="Перейти на клієнтський сайт"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-white bg-[#151520] hover:bg-[#1e1e2d] border border-white/10 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#e50914]" />
              <span className="hidden sm:inline">На сайт</span>
            </Link>
            <button
              onClick={handleLogout}
              title="Вийти з адмін-панелі"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-300 hover:text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Вийти</span>
            </button>
          </div>

          {/* Мобільна кнопка бургер-меню в правому кутку */}
          <div className="flex sm:hidden items-center">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              title={isMobileMenuOpen ? 'Закрити меню' : 'Меню керування'}
              className="p-2 rounded-lg bg-[#151520] hover:bg-[#1e1e2d] border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Мобільне висувне бургер-меню (налаштування, статистика, перехід на сайт та вихід) */}
        {isMobileMenuOpen && (
          <>
            <div 
              onClick={() => setIsMobileMenuOpen(false)}
              className="sm:hidden fixed inset-0 top-16 z-35 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
            />
            <div className="sm:hidden absolute inset-x-0 top-16 z-40 bg-[#0e0e16] border-b border-white/15 p-3.5 shadow-2xl animate-in slide-in-from-top-2 duration-150 space-y-1.5">
              {/* Вкладка Статистика */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('stats');
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all',
                  activeTab === 'stats'
                    ? 'bg-[#e50914] text-white shadow-md shadow-[#e50914]/40'
                    : 'text-zinc-300 hover:text-white bg-white/5 border border-white/5'
                )}
              >
                <BarChart3 className={cn('w-4 h-4', activeTab === 'stats' ? 'text-white' : 'text-amber-400')} />
                <span>Аналітика та статистика</span>
              </button>

              {/* Вкладка Налаштування */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('settings');
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all',
                  activeTab === 'settings'
                    ? 'bg-[#e50914] text-white shadow-md shadow-[#e50914]/40'
                    : 'text-zinc-300 hover:text-white bg-white/5 border border-white/5'
                )}
              >
                <Settings className={cn('w-4 h-4', activeTab === 'settings' ? 'text-white' : 'text-zinc-400')} />
                <span>Налаштування системи</span>
              </button>

              {/* Повернення на клієнтський сайт */}
              <Link
                href="/pl"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-zinc-300 hover:text-white bg-white/5 border border-white/5 transition-all"
              >
                <ExternalLink className="w-4 h-4 text-blue-400" />
                <span>Повернутися на сайт</span>
              </Link>

              {/* Вихід з адмінки */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Вийти з адмін-панелі</span>
              </button>
            </div>
          </>
        )}
      </header>

      {/* Стікі-навігація під хедером (на мобілці тільки 2 вкладки: Меню та Замовлення) */}
      {activeTab !== 'dashboard' && (
        <div className="sticky top-16 z-30 w-full bg-[#0d0d14]/95 backdrop-blur-xl border-b border-white/10 shadow-md">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:flex sm:w-auto sm:items-center sm:gap-4 w-full py-0.5">
              {/* Розділ МЕНЮ */}
              <button
                type="button"
                onClick={() => setActiveTab('menu')}
                className={cn(
                  'relative py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold tracking-wider uppercase whitespace-nowrap transition-all duration-200 cursor-pointer select-none flex items-center justify-center gap-1.5 sm:gap-2',
                  activeTab === 'menu' ? 'text-white font-black' : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                <UtensilsCrossed className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0', activeTab === 'menu' ? 'text-[#e50914]' : 'text-zinc-400')} />
                <span className="truncate">МЕНЮ <span className="opacity-75 text-[11px] sm:text-xs">({products.length})</span></span>
                {activeTab === 'menu' && (
                  <span className="absolute bottom-0 left-2 right-2 sm:left-2 sm:right-2 h-[2.5px] rounded-full bg-gradient-to-r from-[#e50914] via-[#ff4d58] to-[#e50914] shadow-[0_0_12px_#e50914]" />
                )}
              </button>

              {/* Розділ ЗАМОВЛЕННЯ */}
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={cn(
                  'relative py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold tracking-wider uppercase whitespace-nowrap transition-all duration-200 cursor-pointer select-none flex items-center justify-center gap-1.5 sm:gap-2',
                  activeTab === 'orders' ? 'text-white font-black' : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                <ShoppingBag className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0', activeTab === 'orders' ? 'text-[#e50914]' : 'text-zinc-400')} />
                <span className="truncate">ЗАМОВЛЕННЯ</span>
                {newOrdersCount > 0 && (
                  <span
                    style={{
                      clipPath: 'polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)',
                    }}
                    className="px-1.5 py-0.5 text-[9px] sm:text-[10px] bg-[#e50914] text-white font-black shadow-sm shadow-[#e50914]/40"
                  >
                    {newOrdersCount}
                  </span>
                )}
                {activeTab === 'orders' && (
                  <span className="absolute bottom-0 left-2 right-2 sm:left-2 sm:right-2 h-[2.5px] rounded-full bg-gradient-to-r from-[#e50914] via-[#ff4d58] to-[#e50914] shadow-[0_0_12px_#e50914]" />
                )}
              </button>

              {/* Розділ СТАТИСТИКА (на мобілці сховано у бургер-меню, на десктопі показується) */}
              <button
                type="button"
                onClick={() => setActiveTab('stats')}
                className={cn(
                  'hidden sm:flex relative py-3 px-4 text-xs sm:text-sm font-bold tracking-wider uppercase whitespace-nowrap transition-all duration-200 cursor-pointer select-none items-center justify-center gap-2',
                  activeTab === 'stats' ? 'text-white font-black' : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                <BarChart3 className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0', activeTab === 'stats' ? 'text-[#e50914]' : 'text-zinc-400')} />
                <span className="truncate">СТАТИСТИКА</span>
                {activeTab === 'stats' && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full bg-gradient-to-r from-[#e50914] via-[#ff4d58] to-[#e50914] shadow-[0_0_12px_#e50914]" />
                )}
              </button>

              {/* Розділ НАЛАШТУВАННЯ (на десктопі при активному переході через шестерню) */}
              {activeTab === 'settings' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="hidden sm:flex relative py-3 px-4 text-xs sm:text-sm font-black tracking-wider uppercase whitespace-nowrap text-white select-none items-center justify-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#e50914] shrink-0" />
                  <span className="truncate">ОПЦІЇ</span>
                  <span className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full bg-gradient-to-r from-[#e50914] via-[#ff4d58] to-[#e50914] shadow-[0_0_12px_#e50914]" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Спливаюче сповіщення про успіх */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 font-bold text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Спливаюча плашка-підказка про автопереклад */}
      {noticeMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 bg-amber-500 text-zinc-950 p-4 rounded-xl shadow-2xl flex items-start gap-3 font-bold text-xs max-w-md border-2 border-amber-300">
          <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-zinc-950" />
          <div className="flex-1">
            <span className="block text-zinc-900 font-black uppercase text-[10px] tracking-wider mb-0.5">Підказка</span>
            <span className="leading-relaxed">{noticeMessage}</span>
          </div>
          <button onClick={() => setNoticeMessage('')} className="p-1 text-zinc-900 hover:text-black cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Повідомлення про помилку */}
      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 bg-red-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 font-bold text-xs max-w-md">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="ml-auto p-1 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Головна робоча зона */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 0. ПОЧАТКОВИЙ ЕКРАН: 3 КАРТКИ (МЕНЮ, ЗАМОВЛЕННЯ, СТАТИСТИКА) - на мобілці компактно вміщуються в 1 екран */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 sm:space-y-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center max-w-2xl mx-auto pt-1 sm:pt-4">
              <h1 className="text-xl sm:text-3xl font-black uppercase tracking-wider text-white">
                Панель керування
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 sm:mt-2">
                Оберіть потрібний розділ для роботи з закладом
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-5 pt-1 sm:pt-2">
              {/* 1. КАРТКА: МЕНЮ */}
              <div
                onClick={() => {
                  setActiveTab('menu');
                  setSelectedCategoryFilter('mini-maki');
                }}
                style={{
                  clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
                }}
                className="group relative p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-[#e50914]/30 hover:to-[#e50914] cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-[#e50914]/25 hover:-translate-y-1 active:scale-98"
              >
                <div
                  style={{
                    clipPath: 'polygon(11px 0, 100% 0, 100% calc(100% - 11px), calc(100% - 11px) 100%, 0 100%, 0 11px)',
                  }}
                  className="bg-[#0f0f18] p-3.5 sm:p-8 h-full flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between sm:block">
                    <div className="flex items-center gap-3 sm:block">
                      <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#e50914]/10 border border-[#e50914]/30 flex items-center justify-center text-[#e50914] group-hover:scale-110 group-hover:bg-[#e50914] group-hover:text-white transition-all duration-300 shadow-md shadow-[#e50914]/20 shrink-0 sm:mb-6">
                        <UtensilsCrossed className="w-5 h-5 sm:w-7 sm:h-7" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-2xl font-black uppercase tracking-wider text-white group-hover:text-[#ff4d58] transition-colors">
                          МЕНЮ
                        </h2>
                        <p className="hidden sm:block text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                          Керування стравами, категоріями, цінами, стоп-листом та завантаження фотографій.
                        </p>
                      </div>
                    </div>
                    <div className="sm:hidden flex items-center gap-1 text-xs font-bold text-zinc-400 group-hover:text-white transition-colors shrink-0">
                      <span className="text-[#e50914] text-base group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                  <div className="hidden sm:flex pt-6 mt-6 border-t border-white/10 items-center justify-between text-xs font-black uppercase tracking-wider text-zinc-400 group-hover:text-white transition-colors">
                    <span>Перейти до меню</span>
                    <span className="text-base text-[#e50914] group-hover:translate-x-1.5 transition-transform">→</span>
                  </div>
                </div>
              </div>

              {/* 2. КАРТКА: ЗАМОВЛЕННЯ (пульсує червоним, якщо є нові замовлення) */}
              <div
                onClick={() => setActiveTab('orders')}
                style={{
                  clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
                }}
                className={cn(
                  'group relative p-[1px] cursor-pointer transition-all duration-300 hover:-translate-y-1 active:scale-98',
                  newOrdersCount > 0
                    ? 'bg-gradient-to-b from-[#ff3844] via-[#e50914] to-[#99060e] shadow-[0_0_35px_rgba(229,9,20,0.6)] animate-pulse'
                    : 'bg-gradient-to-b from-white/20 via-white/5 to-[#e50914]/30 hover:to-[#e50914] hover:shadow-2xl hover:shadow-[#e50914]/25'
                )}
              >
                <div
                  style={{
                    clipPath: 'polygon(11px 0, 100% 0, 100% calc(100% - 11px), calc(100% - 11px) 100%, 0 100%, 0 11px)',
                  }}
                  className={cn(
                    'p-3.5 sm:p-8 h-full flex flex-col justify-between transition-colors duration-300',
                    newOrdersCount > 0
                      ? 'bg-gradient-to-br from-[#2b080b] via-[#1a0608] to-[#110406]'
                      : 'bg-[#0f0f18]'
                  )}
                >
                  <div className="flex items-center justify-between sm:block">
                    <div className="flex items-center gap-3 sm:block">
                      <div
                        className={cn(
                          'w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 shrink-0 sm:mb-6',
                          newOrdersCount > 0
                            ? 'bg-[#e50914] text-white shadow-lg shadow-[#e50914]/60 scale-105'
                            : 'bg-[#e50914]/10 border border-[#e50914]/30 text-[#e50914] group-hover:scale-110 group-hover:bg-[#e50914] group-hover:text-white shadow-md shadow-[#e50914]/20'
                        )}
                      >
                        <ShoppingBag className="w-5 h-5 sm:w-7 sm:h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2
                            className={cn(
                              'text-base sm:text-2xl font-black uppercase tracking-wider transition-colors',
                              newOrdersCount > 0 ? 'text-[#ff4d58]' : 'text-white group-hover:text-[#ff4d58]'
                            )}
                          >
                            ЗАМОВЛЕННЯ
                          </h2>
                          {newOrdersCount > 0 && (
                            <span
                              style={{
                                clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
                              }}
                              className="px-2 py-0.5 text-[10px] sm:text-xs bg-[#e50914] text-white font-black tracking-wider shadow-md shadow-[#e50914]/40"
                            >
                              +{newOrdersCount} НОВИХ
                            </span>
                          )}
                        </div>
                        <p className={cn(
                          'hidden sm:block text-xs sm:text-sm mt-2 leading-relaxed',
                          newOrdersCount > 0 ? 'text-zinc-300' : 'text-zinc-400'
                        )}>
                          {newOrdersCount > 0
                            ? `У вас ${newOrdersCount} ${newOrdersCount === 1 ? 'нове замовлення' : 'нових замовлень'}! Натисніть, щоб переглянути та прийняти.`
                            : "Потік онлайн-замовлень у реальному часі, кухня, кур'єрська доставка та статуси."}
                        </p>
                      </div>
                    </div>
                    <div className="sm:hidden flex items-center gap-1 text-xs font-bold text-zinc-400 group-hover:text-white transition-colors shrink-0">
                      <span className="text-[#e50914] text-base group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                  <div className="hidden sm:flex pt-6 mt-6 border-t border-white/10 items-center justify-between text-xs font-black uppercase tracking-wider text-zinc-400 group-hover:text-white transition-colors">
                    <span className={cn(newOrdersCount > 0 ? 'text-[#ff4d58] font-black' : '')}>
                      {newOrdersCount > 0 ? `Переглянути нові (${newOrdersCount})` : 'Перейти до замовлень'}
                    </span>
                    <span className="text-base text-[#e50914] group-hover:translate-x-1.5 transition-transform">→</span>
                  </div>
                </div>
              </div>

              {/* 3. КАРТКА: СТАТИСТИКА */}
              <div
                onClick={() => setActiveTab('stats')}
                style={{
                  clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
                }}
                className="group relative p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-[#e50914]/30 hover:to-[#e50914] cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-[#e50914]/25 hover:-translate-y-1 active:scale-98"
              >
                <div
                  style={{
                    clipPath: 'polygon(11px 0, 100% 0, 100% calc(100% - 11px), calc(100% - 11px) 100%, 0 100%, 0 11px)',
                  }}
                  className="bg-[#0f0f18] p-3.5 sm:p-8 h-full flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between sm:block">
                    <div className="flex items-center gap-3 sm:block">
                      <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#e50914]/10 border border-[#e50914]/30 flex items-center justify-center text-[#e50914] group-hover:scale-110 group-hover:bg-[#e50914] group-hover:text-white transition-all duration-300 shadow-md shadow-[#e50914]/20 shrink-0 sm:mb-6">
                        <BarChart3 className="w-5 h-5 sm:w-7 sm:h-7" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-2xl font-black uppercase tracking-wider text-white group-hover:text-[#ff4d58] transition-colors">
                          СТАТИСТИКА
                        </h2>
                        <p className="hidden sm:block text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                          Аналітика продажів, виручка закладу, середній чек та найпопулярніші позиції меню.
                        </p>
                      </div>
                    </div>
                    <div className="sm:hidden flex items-center gap-1 text-xs font-bold text-zinc-400 group-hover:text-white transition-colors shrink-0">
                      <span className="text-[#e50914] text-base group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                  <div className="hidden sm:flex pt-6 mt-6 border-t border-white/10 items-center justify-between text-xs font-black uppercase tracking-wider text-zinc-400 group-hover:text-white transition-colors">
                    <span>Перейти до аналітики</span>
                    <span className="text-base text-[#e50914] group-hover:translate-x-1.5 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 1. РОЗДІЛ: МЕНЮ ТА СТРАВИ */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            {/* СТІКІ-ПАНЕЛЬ КАТЕГОРІЙ: на мобілці фірмова кнопка меню з випадаючим списком, на десктопі центровані кнопки з підкресленням */}
            <div className="sticky top-28 sm:top-29 z-20 bg-[#0d0d14]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 sm:p-3.5 shadow-xl shadow-black/60">
              {/* Мобільний вигляд (sm:hidden): компактна кнопка меню з сайту з випадаючим списком категорій */}
              <div className="relative sm:hidden flex items-center justify-between w-full">
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                  style={{
                    clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                  }}
                  className={cn(
                    'relative z-30 flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-black transition-all duration-200 cursor-pointer select-none active:scale-95 shadow-md',
                    isCategoryDropdownOpen
                      ? 'bg-[#181822] text-white border border-white/20'
                      : 'bg-[#e50914] text-white shadow-lg shadow-[#e50914]/40 hover:bg-[#f4222d]'
                  )}
                >
                  <LayoutGrid className={cn('w-4 h-4 transition-transform duration-200', isCategoryDropdownOpen ? 'rotate-90 text-[#e50914]' : 'text-white')} />
                  <span className="tracking-wide">Категорії</span>
                  <ChevronDown className={cn('w-3.5 h-3.5 text-white/80 transition-transform duration-200', isCategoryDropdownOpen ? 'rotate-180' : '')} />
                </button>

                {/* Назва поточної активної категорії поряд */}
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white cursor-pointer select-none truncate max-w-[200px]"
                >
                  <span className="text-[#e50914] font-black">•</span>
                  <span className="truncate">{activeCategoryObj ? (activeCategoryObj.name.uk || activeCategoryObj.name.pl) : 'Всі страви'}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">({activeCount})</span>
                </button>

                {/* Прозорий бекдроп для закриття списку */}
                {isCategoryDropdownOpen && (
                  <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
                    onClick={() => setIsCategoryDropdownOpen(false)}
                  />
                )}

                {/* Випадаючий акуратний самурайський список категорій */}
                {isCategoryDropdownOpen && (
                  <div
                    style={{
                      clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
                    }}
                    className="absolute left-0 top-full mt-2 w-72 max-h-[65vh] p-[1px] bg-white/20 shadow-2xl shadow-black/90 z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div
                      style={{
                        clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)',
                      }}
                      className="w-full h-full max-h-[65vh] overflow-y-auto bg-[#0d0d12] backdrop-blur-2xl p-2.5 flex flex-col no-scrollbar"
                    >
                      <div className="px-3 py-2 border-b border-white/10 mb-1.5 flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                          Оберіть категорію
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full">
                          {categories.length} розділів
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        {categories.map((cat) => {
                          const isActive = selectedCategoryFilter === cat.id;
                          const count = products.filter((p) => p.categoryId === cat.id).length;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setSelectedCategoryFilter(cat.id);
                                setIsCategoryDropdownOpen(false);
                              }}
                              style={{
                                clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                              }}
                              className={cn(
                                'w-full flex items-center justify-between gap-2 px-3 py-2 text-left transition-all cursor-pointer group select-none',
                                isActive
                                  ? 'bg-gradient-to-r from-[#e50914]/25 to-[#e50914]/10 border-l-2 border-[#e50914] text-white font-black shadow-sm'
                                  : 'text-zinc-300 hover:text-white hover:bg-white/10'
                              )}
                            >
                              <span className={cn('truncate text-xs font-bold', isActive ? 'text-white font-black' : 'text-zinc-300')}>
                                {cat.name.uk || cat.name.pl}
                              </span>
                              <span className="flex-1 border-b border-dotted border-white/15 min-w-4" />
                              <span className={cn('text-xs font-bold tracking-tight shrink-0', isActive ? 'text-red-300 font-black' : 'text-zinc-400')}>
                                {count} поз.
                              </span>
                            </button>
                          );
                        })}

                        {/* Всі страви в кінець випадаючого списку */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategoryFilter('all');
                            setIsCategoryDropdownOpen(false);
                          }}
                          style={{
                            clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                          }}
                          className={cn(
                            'w-full flex items-center justify-between gap-2 px-3 py-2 text-left transition-all cursor-pointer group select-none mt-1 pt-2 border-t border-white/10',
                            selectedCategoryFilter === 'all'
                              ? 'bg-gradient-to-r from-[#e50914]/25 to-[#e50914]/10 border-l-2 border-[#e50914] text-white font-black shadow-sm'
                              : 'text-zinc-300 hover:text-white hover:bg-white/10'
                          )}
                        >
                          <span className={cn('truncate text-xs font-bold', selectedCategoryFilter === 'all' ? 'text-white font-black' : 'text-zinc-300')}>
                            Всі страви
                          </span>
                          <span className="flex-1 border-b border-dotted border-white/15 min-w-4" />
                          <span className={cn('text-xs font-bold tracking-tight shrink-0', selectedCategoryFilter === 'all' ? 'text-red-300 font-black' : 'text-zinc-400')}>
                            {products.length} поз.
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Десктопний вигляд (hidden sm:flex): центровані кнопки з підкресленням */}
              <div className="hidden sm:flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-3.5 gap-y-1.5 sm:gap-y-2">
                {/* 1. Спочатку всі категорії меню */}
                {categories.map((cat) => {
                  const count = products.filter((p) => p.categoryId === cat.id).length;
                  const isActive = selectedCategoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat.id)}
                      className={cn(
                        'relative px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-all duration-200 cursor-pointer select-none flex items-center justify-center gap-1.5',
                        isActive
                          ? 'text-white font-black scale-105'
                          : 'text-zinc-400 hover:text-white'
                      )}
                    >
                      <span>{cat.name.uk || cat.name.pl}</span>
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                          isActive
                            ? 'bg-[#e50914]/25 text-[#ff4d58] border border-[#e50914]/40'
                            : 'bg-white/5 text-zinc-500'
                        )}
                      >
                        {count}
                      </span>
                      {isActive && (
                        <span className="absolute bottom-0 left-1 right-1 sm:left-2 sm:right-2 h-[2px] rounded-full bg-gradient-to-r from-[#e50914] via-[#ff4d58] to-[#e50914] shadow-[0_0_10px_#e50914]" />
                      )}
                    </button>
                  );
                })}

                {/* 2. «Всі страви» в самий кінець */}
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={cn(
                    'relative px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-all duration-200 cursor-pointer select-none flex items-center justify-center gap-1.5',
                    selectedCategoryFilter === 'all'
                      ? 'text-white font-black scale-105'
                      : 'text-zinc-400 hover:text-white'
                  )}
                >
                  <span>Всі страви</span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                      selectedCategoryFilter === 'all'
                        ? 'bg-[#e50914]/25 text-[#ff4d58] border border-[#e50914]/40'
                        : 'bg-white/5 text-zinc-500'
                    )}
                  >
                    {products.length}
                  </span>
                  {selectedCategoryFilter === 'all' && (
                    <span className="absolute bottom-0 left-1 right-1 sm:left-2 sm:right-2 h-[2px] rounded-full bg-gradient-to-r from-[#e50914] via-[#ff4d58] to-[#e50914] shadow-[0_0_10px_#e50914]" />
                  )}
                </button>
              </div>
            </div>

            {/* Статус порожнього меню з підказкою */}
            {products.length === 0 && !isLoadingMenu && (
              <div className="bg-[#0f0f17] border border-white/10 rounded-2xl p-10 text-center">
                <UtensilsCrossed className="w-12 h-12 text-[#e50914] mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-2">У базі Supabase ще немає завантажених страв</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6">
                  Виконай SQL-скрипт <code className="text-amber-400 bg-white/5 px-2 py-1 rounded">supabase_seed_menu.sql</code> в SQL Editor кабінету Supabase, або натисни кнопку вище «Додати страву».
                </p>
              </div>
            )}

            {/* Список страв: сітка з центруванням останнього неповного рядка */}
            <div className="flex flex-wrap justify-center gap-4">
              {filteredProducts.map((product) => {
                const categoryObj = categories.find((c) => c.id === product.categoryId);
                const isUploadingThis = uploadingImageId === product.id;
                const isDragOverThis = dragOverProductId === product.id;

                return (
                  <div
                    key={product.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (dragOverProductId !== product.id) {
                        setDragOverProductId(product.id);
                      }
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                      setDragOverProductId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverProductId(null);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        handleDirectFileUpload(file, product.id);
                      }
                    }}
                    onClick={() => handleOpenEditModal(product)}
                    className={cn(
                      'w-full md:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)] shrink-0',
                      'relative bg-[#0f0f17] border rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 group cursor-pointer hover:border-white/30 hover:shadow-xl',
                      isDragOverThis
                        ? 'border-[#e50914] bg-[#e50914]/15 ring-2 ring-[#e50914] shadow-2xl shadow-[#e50914]/30 scale-[1.02]'
                        : product.isAvailable
                          ? 'border-white/10 hover:border-[#e50914]/40'
                          : 'border-red-500/20 opacity-75 bg-[#0a0a0f]'
                    )}
                  >
                    {/* Анімований оверлей при перетягуванні файлу прямо на цю страву */}
                    {isDragOverThis && (
                      <div className="absolute inset-0 bg-black/90 backdrop-blur-xs rounded-2xl z-30 flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#e50914] animate-in fade-in duration-150 pointer-events-none">
                        <Upload className="w-9 h-9 text-[#e50914] animate-bounce mb-2" />
                        <span className="text-xs font-black uppercase text-white tracking-wider text-center">
                          Відпустіть фото для «{product.name.uk || product.name.pl}»
                        </span>
                        <span className="text-[10px] text-zinc-400 mt-1">
                          Файл завантажиться та оновиться в Supabase
                        </span>
                      </div>
                    )}
                    <div>
                      {/* Верхня плашка: фото, назви, категорія та статус */}
                      <div className="flex gap-3.5 mb-3">
                        {/* Прев'ю фотографії з можливістю завантаження в 1 клік */}
                        <div className="flex flex-col items-center shrink-0">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerQuickUpload(product.id);
                            }}
                            title="Клікніть, щоб завантажити або замінити фотографію цієї страви"
                            className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08)_0%,_#07070b_70%)] border border-white/10 group-hover:border-[#e50914]/50 cursor-pointer flex items-center justify-center transition-colors shadow-md"
                          >
                            {product.image ? (
                              <div
                                className="w-full h-full flex items-center justify-center transition-transform duration-200"
                                style={{ transform: `scale(${getProductZoom(product)})` }}
                              >
                                <img
                                  src={product.image}
                                  alt={product.name.pl}
                                  className="w-full h-full object-contain p-1"
                                />
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center p-2 text-center text-zinc-500 hover:text-white">
                                <ImageIcon className="w-5 h-5 mb-1 text-zinc-600" />
                                <span className="text-[9px] font-bold uppercase leading-none">Додати фото</span>
                              </div>
                            )}

                            {/* Індикатор завантаження */}
                            {isUploadingThis && (
                              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-[#e50914] border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}

                            {/* Бейдж заміни фото при наведенні */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold text-white uppercase">
                              <Upload className="w-4 h-4 text-white" />
                            </div>
                          </div>

                          {/* Швидке регулювання масштабу прямо на картці списку: дві компактні кнопки + та - з кроком 20% без показу відсотків */}
                          {product.image && (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center justify-between w-full mt-1.5 px-0.5 py-0.5 bg-black/70 border border-white/10 rounded-md"
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickZoomChange(product, -0.2);
                                }}
                                title="Зменшити масштаб фото (-20%)"
                                className="flex-1 h-4 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/15 rounded text-xs font-bold leading-none cursor-pointer"
                              >
                                -
                              </button>
                              <div className="w-[1px] h-3 bg-white/10 mx-0.5" />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickZoomChange(product, 0.2);
                                }}
                                title="Збільшити масштаб фото (+20%)"
                                className="flex-1 h-4 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/15 rounded text-xs font-bold leading-none cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Інформація про страву */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 truncate bg-white/5 px-2 py-0.5 rounded">
                              {categoryObj?.name.pl || product.categoryId}
                            </span>
                            {product.badge && (
                              <ProductBadge badge={product.badge} locale="uk" />
                            )}
                          </div>

                          <h3 className="text-sm font-black text-white line-clamp-2 leading-tight">
                            {product.name.pl}
                          </h3>
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-tight mt-0.5">
                            {product.name.uk}
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm font-black text-[#e50914]">
                              {product.price} zł
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              {product.weight}g {product.pieces ? `(${product.pieces} шт)` : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Опис страви: повний текст без обрізання */}
                      <p className="text-[11px] text-zinc-400 leading-relaxed mb-3 break-words">
                        {product.description.pl || product.description.uk}
                      </p>
                    </div>

                    {/* Нижня панель дій */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      {/* Акуратний компактний тумблер наявності + напис "В меню" */}
                      <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="flex items-center gap-2"
                      >
                        <button
                          type="button"
                          role="switch"
                          aria-checked={product.isAvailable}
                          onClick={() => handleToggleAvailability(product)}
                          className={cn(
                            'relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none select-none border border-white/15',
                            product.isAvailable
                              ? 'bg-emerald-500 shadow-xs shadow-emerald-500/30'
                              : 'bg-rose-600 shadow-xs shadow-rose-600/30'
                          )}
                          title={product.isAvailable ? 'Увімкнено: в меню' : 'Вимкнено: стоп-лист'}
                        >
                          <span
                            className={cn(
                              'pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow-xs transform transition-transform duration-200 ease-in-out',
                              product.isAvailable ? 'translate-x-3' : 'translate-x-0'
                            )}
                          />
                        </button>
                        <span
                          onClick={() => handleToggleAvailability(product)}
                          className={cn(
                            'text-[11px] font-bold cursor-pointer select-none transition-colors',
                            product.isAvailable ? 'text-zinc-200' : 'text-zinc-500'
                          )}
                        >
                          В меню
                        </span>
                      </div>

                      {/* Кнопки редагування та видалення */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(product);
                          }}
                          title="Редагувати страву"
                          className="p-1.5 rounded-lg bg-[#181824] hover:bg-[#252538] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(product);
                          }}
                          title="Видалити страву"
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Плаваюча 3D стікі-кнопка "Додати страву", що парить над картками */}
            <div className="fixed bottom-10 sm:bottom-12 md:bottom-14 inset-x-0 z-40 pointer-events-none">
              <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex justify-end">
                <div className="relative group animate-levitate pointer-events-auto">
                  {/* М'яка динамічна тінь під кнопкою, що показує паріння над контентом */}
                  <div className="absolute -bottom-3.5 inset-x-3 h-4 bg-black/80 blur-md rounded-full animate-shadow-levitate" />
                  <div className="absolute -bottom-2 inset-x-4 h-3 bg-[#e50914]/50 blur-lg rounded-full animate-shadow-levitate" />

                  {/* 3D кнопка з об'ємним відблиском, рельєфною нижньою гранню та тактильним натисканням */}
                  <button
                    type="button"
                    onClick={handleOpenAddModal}
                    style={{
                      clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
                    }}
                    className="relative flex items-center gap-2.5 px-6 sm:px-7 py-3.5 sm:py-4 bg-gradient-to-b from-[#ff3344] via-[#e50914] to-[#a3060f] text-white text-xs sm:text-sm font-black uppercase tracking-wider cursor-pointer border-t border-x border-white/35 border-b-[4px] border-b-[#6b0207] shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),_inset_0_-2px_4px_rgba(0,0,0,0.5),_0_15px_35px_rgba(0,0,0,0.7),_0_10px_25px_rgba(229,9,20,0.5)] transition-all duration-200 group-hover:brightness-110 group-hover:scale-105 active:scale-98 active:translate-y-1 active:border-b-2 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.7),_0_6px_15px_rgba(0,0,0,0.5)] select-none"
                  >
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-90 transition-transform duration-300">
                      <Plus className="w-3.5 h-3.5 stroke-[3] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
                    </div>
                    <span className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">Додати страву</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. РОЗДІЛ: ЗАМОВЛЕННЯ */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Попередження про RLS, якщо виявлено проблему з політиками Supabase */}
            {orderRlsNotice && (
              <div
                style={{
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                }}
                className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2.5"
              >
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>Потрібно налаштувати Row Level Security (RLS) для таблиці orders у Supabase</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Supabase блокує пряме читання замовлень через увімкнений RLS без політики на SELECT. Виконайте наступний SQL у вашому Supabase SQL Editor, щоб замовлення читалися миттєво:
                </p>
                <div className="flex items-center gap-2 bg-[#0c0c14] p-2.5 rounded-lg border border-white/10 text-xs font-mono text-emerald-400 overflow-x-auto">
                  <span className="flex-1 select-all">
                    ALTER TABLE orders ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS &quot;Allow all for orders&quot; ON orders; CREATE POLICY &quot;Allow all for orders&quot; ON orders FOR ALL USING (true) WITH CHECK (true);
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        'ALTER TABLE orders ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "Allow all for orders" ON orders; CREATE POLICY "Allow all for orders" ON orders FOR ALL USING (true) WITH CHECK (true);'
                      );
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 2500);
                    }}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded transition-all shrink-0 cursor-pointer"
                  >
                    {copiedSql ? 'Скопійовано!' : 'Копіювати SQL'}
                  </button>
                </div>
              </div>
            )}

            {/* Верхня панель дій: статус підключення та швидкі дії */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                  Онлайн-замовлення
                </h2>
                <span className="text-xs text-zinc-400 font-mono">
                  ({orders.length})
                </span>
                {isLoadingOrders && (
                  <span className="text-xs text-amber-400 animate-pulse font-medium">Оновлення...</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Інтерактивний захищений блок встановлення часу очікування (за замовчуванням 40 хв) */}
                <div
                  style={{
                    clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                  }}
                  className="flex items-center bg-[#151522] border border-amber-500/40 p-1 sm:p-1.5 gap-1.5 shadow-md shadow-black/60 select-none"
                  title="Час приготування/доставки для клієнтів (за замовчуванням 40 хв)"
                >
                  <div className="flex items-center gap-1 pl-1.5 pr-1 text-amber-400 font-black text-[10px] sm:text-xs uppercase tracking-wider whitespace-nowrap">
                    <Timer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Час очікування:</span>
                  </div>

                  {/* Кнопка швидкого зменшення (-5 хв) */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.max(10, prepWaitTimeMinutes - 5);
                      setPrepWaitTimeMinutes(next);
                    }}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-[#202030] hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 font-black flex items-center justify-center transition-all cursor-pointer border border-white/10 active:scale-95"
                    title="Зменшити на 5 хв"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  {/* Захищене поле числа (без реакції на колесико миші) */}
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={10}
                      max={240}
                      step={5}
                      value={tempWaitTime}
                      onWheel={(e) => (e.target as HTMLElement).blur()} // блокуємо зміну колесиком миші
                      onChange={(e) => {
                        setTempWaitTime(e.target.value);
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 10 && val <= 240) {
                          setPrepWaitTimeMinutes(val);
                        }
                      }}
                      onBlur={() => {
                        const val = parseInt(tempWaitTime, 10);
                        if (isNaN(val) || val < 10) {
                          setTempWaitTime('10');
                          setPrepWaitTimeMinutes(10);
                        } else if (val > 240) {
                          setTempWaitTime('240');
                          setPrepWaitTimeMinutes(240);
                        } else {
                          setPrepWaitTimeMinutes(val);
                        }
                      }}
                      className="w-12 sm:w-14 text-center font-mono font-black text-xs sm:text-sm bg-black/60 text-white border border-amber-500/50 rounded py-0.5 sm:py-1 focus:outline-none focus:border-amber-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[10px] sm:text-xs text-amber-300 font-bold ml-1 mr-0.5">хв</span>
                  </div>

                  {/* Кнопка швидкого збільшення (+5 хв) */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.min(240, prepWaitTimeMinutes + 5);
                      setPrepWaitTimeMinutes(next);
                    }}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-[#202030] hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 font-black flex items-center justify-center transition-all cursor-pointer border border-white/10 active:scale-95"
                    title="Збільшити на 5 хв"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Кнопка перегляду скасованих замовлень (якщо є) */}
                {cancelledOrdersCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setOrderStatusFilter(orderStatusFilter === 'cancelled' ? 'pending' : 'cancelled')}
                    style={{
                      clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                    }}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 border font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer',
                      orderStatusFilter === 'cancelled'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                        : 'bg-[#171724] hover:bg-[#202030] border-white/10 text-zinc-400 hover:text-zinc-200'
                    )}
                    title="Переглянути скасовані замовлення"
                  >
                    <Ban className="w-3.5 h-3.5 text-rose-400" />
                    <span>Скасовані ({cancelledOrdersCount})</span>
                  </button>
                )}
              </div>
            </div>

            {/* 4 великі клікабельні плашки етапів замовлення (Нові, Кухня, Курʼєр, Доставлено) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
              {/* 1. НОВІ */}
              <button
                type="button"
                onClick={() => setOrderStatusFilter('pending')}
                style={{
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                }}
                className={cn(
                  'p-3.5 sm:p-4 text-left transition-all duration-200 cursor-pointer select-none relative overflow-hidden border',
                  orderStatusFilter === 'pending'
                    ? 'bg-rose-500/15 border-rose-500 text-rose-400 shadow-lg shadow-rose-500/20 ring-1 ring-rose-500/40'
                    : 'bg-[#0f0f17] border-white/10 hover:border-white/25 hover:bg-[#151522] text-zinc-400 hover:text-white'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider">
                    Нові
                  </span>
                  {newOrdersCount > 0 ? (
                    <span
                      style={{
                        clipPath: 'polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)',
                      }}
                      className="px-1.5 py-0.5 text-[9px] bg-rose-600 text-white font-black"
                    >
                      +{newOrdersCount}
                    </span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-zinc-600" />
                  )}
                </div>
                <p className={cn('text-2xl sm:text-3xl font-black mt-1.5', orderStatusFilter === 'pending' ? 'text-rose-400' : 'text-white')}>
                  {newOrdersCount}
                </p>
                <div className="text-[10px] text-zinc-400 mt-0.5">Очікують підтвердження</div>
                <div className="absolute -right-3 -bottom-3 text-rose-500/10 pointer-events-none">
                  <ShoppingBag className="w-16 h-16" />
                </div>
              </button>

              {/* 2. КУХНЯ */}
              <button
                type="button"
                onClick={() => setOrderStatusFilter('in_progress')}
                style={{
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                }}
                className={cn(
                  'p-3.5 sm:p-4 text-left transition-all duration-200 cursor-pointer select-none relative overflow-hidden border',
                  orderStatusFilter === 'in_progress'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/20 ring-1 ring-amber-500/40'
                    : 'bg-[#0f0f17] border-white/10 hover:border-white/25 hover:bg-[#151522] text-zinc-400 hover:text-white'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider">
                    Кухня
                  </span>
                  <span className={cn('w-2 h-2 rounded-full', inKitchenCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-zinc-600')} />
                </div>
                <p className={cn('text-2xl sm:text-3xl font-black mt-1.5', orderStatusFilter === 'in_progress' ? 'text-amber-400' : 'text-white')}>
                  {inKitchenCount}
                </p>
                <div className="text-[10px] text-zinc-400 mt-0.5">Готуються шефом</div>
                <div className="absolute -right-3 -bottom-3 text-amber-500/10 pointer-events-none">
                  <ChefHat className="w-16 h-16" />
                </div>
              </button>

              {/* 3. КУРʼЄР */}
              <button
                type="button"
                onClick={() => setOrderStatusFilter('in_delivery')}
                style={{
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                }}
                className={cn(
                  'p-3.5 sm:p-4 text-left transition-all duration-200 cursor-pointer select-none relative overflow-hidden border',
                  orderStatusFilter === 'in_delivery'
                    ? 'bg-purple-500/15 border-purple-500 text-purple-400 shadow-lg shadow-purple-500/20 ring-1 ring-purple-500/40'
                    : 'bg-[#0f0f17] border-white/10 hover:border-white/25 hover:bg-[#151522] text-zinc-400 hover:text-white'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider">
                    Курʼєр
                  </span>
                  <span className={cn('w-2 h-2 rounded-full', inDeliveryCount > 0 ? 'bg-purple-500' : 'bg-zinc-600')} />
                </div>
                <p className={cn('text-2xl sm:text-3xl font-black mt-1.5', orderStatusFilter === 'in_delivery' ? 'text-purple-400' : 'text-white')}>
                  {inDeliveryCount}
                </p>
                <div className="text-[10px] text-zinc-400 mt-0.5">В дорозі до клієнта</div>
                <div className="absolute -right-3 -bottom-3 text-purple-500/10 pointer-events-none">
                  <Truck className="w-16 h-16" />
                </div>
              </button>

              {/* 4. ДОСТАВЛЕНО (всі виконані замовлення по днях) */}
              <button
                type="button"
                onClick={() => setOrderStatusFilter('delivered')}
                style={{
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                }}
                className={cn(
                  'p-3.5 sm:p-4 text-left transition-all duration-200 cursor-pointer select-none relative overflow-hidden border',
                  orderStatusFilter === 'delivered'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500/40'
                    : 'bg-[#0f0f17] border-white/10 hover:border-white/25 hover:bg-[#151522] text-zinc-400 hover:text-white'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider">
                    Доставлено
                  </span>
                  <span className={cn('w-2 h-2 rounded-full', orders.filter((o) => o.status === 'delivered').length > 0 ? 'bg-emerald-500' : 'bg-zinc-600')} />
                </div>
                <p className={cn('text-2xl sm:text-3xl font-black mt-1.5', orderStatusFilter === 'delivered' ? 'text-emerald-400' : 'text-white')}>
                  {orders.filter((o) => o.status === 'delivered').length}
                </p>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  {historyByDays.length > 0 ? `${historyByDays.length} дн. в архіві` : 'Виконані замовлення'}
                </div>
                <div className="absolute -right-3 -bottom-3 text-emerald-500/10 pointer-events-none">
                  <CheckCircle2 className="w-16 h-16" />
                </div>
              </button>
            </div>

            {/* Вміст: Доставлені замовлення по днях АБО активний список замовлень */}
            {orderStatusFilter === 'delivered' ? (
              historyByDays.length === 0 ? (
                <div className="bg-[#0f0f17] border border-white/10 rounded-2xl p-12 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-[#181824] flex items-center justify-center mx-auto text-zinc-500">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-white">Немає доставлених замовлень</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Тут збиратимуться всі виконані замовлення, згруповані по днях із касою за кожен день.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historyByDays.map((dayGroup) => {
                    const isCollapsed = collapsedHistoryDays.has(dayGroup.dateKey);
                    return (
                      <div key={dayGroup.dateKey} className="space-y-3">
                        {/* Плашка дня */}
                        <button
                          type="button"
                          onClick={() => toggleHistoryDay(dayGroup.dateKey)}
                          style={{
                            clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                          }}
                          className="w-full p-3.5 sm:p-4 bg-[#141420] hover:bg-[#1a1a28] border border-white/10 hover:border-white/20 transition-all flex flex-wrap items-center justify-between gap-3 text-left cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm sm:text-base font-black text-white capitalize">
                                {dayGroup.dateLabel}
                              </div>
                              <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                                <span>{dayGroup.orders.length} {dayGroup.orders.length === 1 ? 'замовлення' : dayGroup.orders.length < 5 ? 'замовлення' : 'замовлень'}</span>
                                <span>•</span>
                                <span className="text-emerald-400 font-semibold">{dayGroup.deliveredCount} виконано</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Каса за день</span>
                              <span className="text-base sm:text-lg font-black text-[#e50914]">{formatPrice(dayGroup.totalRevenue)}</span>
                            </div>
                            <ChevronDown
                              className={cn(
                                'w-5 h-5 text-zinc-400 transition-transform duration-200',
                                !isCollapsed && 'rotate-180 text-white'
                              )}
                            />
                          </div>
                        </button>

                        {/* Замовлення за цей день */}
                        {!isCollapsed && (
                          <div className="space-y-3.5 pl-0 sm:pl-3 border-l-0 sm:border-l-2 border-sky-500/20">
                            {dayGroup.orders.map((order, idx) => renderOrderCard(order, idx, false))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : filteredOrders.length === 0 ? (
              <div className="bg-[#0f0f17] border border-white/10 rounded-2xl p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#181824] flex items-center justify-center mx-auto text-zinc-500">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {orderStatusFilter === 'pending' && 'Немає нових замовлень'}
                  {orderStatusFilter === 'in_progress' && 'На кухні чисто — замовлень немає'}
                  {orderStatusFilter === 'in_delivery' && 'Зараз немає замовлень у дорозі'}
                  {orderStatusFilter === 'delivered' && 'Немає виконаних замовлень'}
                  {orderStatusFilter === 'cancelled' && 'Немає скасованих замовлень'}
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  {orderStatusFilter === 'pending' && 'Коли клієнт оформить замовлення на сайті, воно з\'явиться тут автоматично зі звуковим сигналом.'}
                  {orderStatusFilter === 'in_progress' && 'Прийміть нове замовлення на кухню, і воно відобразиться тут для приготування.'}
                  {orderStatusFilter === 'in_delivery' && 'Передайте готове замовлення курʼєру або на видачу.'}
                  {orderStatusFilter === 'delivered' && 'Тут зберігаються замовлення, які вже успішно передані клієнту.'}
                  {orderStatusFilter === 'cancelled' && 'Скасовані замовлення зʼявляються тут з можливістю їх відновлення.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order, idx) => renderOrderCard(order, idx, idx === 0 && orderStatusFilter === 'in_progress'))}
              </div>
            )}
          </div>
        )}

        {/* 3. РОЗДІЛ: СТАТИСТИКА ТА АНАЛІТИКА */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Верхня панель статистики: заголовок + фільтри періоду */}
            <div className="bg-[#0f0f17] border border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#e50914]/20 border border-[#e50914]/40 flex items-center justify-center text-[#e50914]">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
                    Аналітика та Статистика Продажів
                  </h2>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Динаміка виручки, середній чек, популярні роли та піковий час замовлень
                </p>
              </div>

              {/* Перемикач періоду */}
              <div className="flex items-center gap-1.5 p-1 bg-[#151520] border border-white/10 rounded-xl self-start sm:self-auto">
                {(
                  [
                    { id: 'today', label: 'Сьогодні' },
                    { id: '7days', label: '7 днів' },
                    { id: '30days', label: '30 днів' },
                    { id: 'all', label: 'Весь час' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setStatsPeriod(p.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none',
                      statsPeriod === p.id
                        ? 'bg-[#e50914] text-white shadow-md shadow-[#e50914]/30'
                        : 'text-zinc-400 hover:text-white'
                    )}
                  >
                    {p.label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => loadOrders(true)}
                  title="Оновити дані"
                  className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/5 ml-1"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', isLoadingOrders && 'animate-spin text-[#e50914]')} />
                </button>
              </div>
            </div>

            {/* Картки головних KPI (4 картки) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Картка 1: Виручка */}
              <div className="bg-[#0f0f17] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Виручка
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {formatPrice(statsData.totalRevenue, 'pl')}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
                  <span>Чиста вартість: {formatPrice(statsData.totalSubtotal, 'pl')}</span>
                </div>
              </div>

              {/* Картка 2: Замовлення */}
              <div className="bg-[#0f0f17] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Замовлень
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {statsData.ordersCount}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1.5 truncate">
                  <span className="text-emerald-400 font-semibold">{statsData.deliveredCount} дост.</span>
                  {statsData.inProgressCount > 0 && (
                    <span className="text-amber-400 font-semibold">• {statsData.inProgressCount} в роботі</span>
                  )}
                  {statsData.cancelledCount > 0 && (
                    <span className="text-red-400 font-semibold">• {statsData.cancelledCount} скас.</span>
                  )}
                </div>
              </div>

              {/* Картка 3: Середній чек */}
              <div className="bg-[#0f0f17] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-amber-500/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Середній чек
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {formatPrice(statsData.avgCheck, 'pl')}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  На 1 успішне замовлення
                </div>
              </div>

              {/* Картка 4: Клієнти та доставка */}
              <div className="bg-[#0f0f17] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-purple-500/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Клієнтів
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {statsData.uniqueClientsCount}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1.5">
                  <span className="text-zinc-300 font-medium">{statsData.deliveryPercent}% курʼєр</span>
                  <span>•</span>
                  <span className="text-zinc-400">{statsData.pickupPercent}% самовивіз</span>
                </div>
              </div>
            </div>

            {/* Верхній блок графіків та топу страв: вирівняні по висоті на десктопі */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {/* Ліва частина (2/3): Графік динаміки + Пікові години */}
              <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
                {/* 1. Графік динаміки виручки по днях */}
                <div className="bg-[#0f0f17] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Динаміка виручки
                      </h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Розподіл замовлень та виручки за робочими днями (вихідні пропускаються)
                      </p>
                    </div>
                    <span className="text-xs font-mono text-zinc-500">
                      макс. {formatPrice(statsData.maxBarRevenue, 'pl')}
                    </span>
                  </div>

                  {/* Стовпчаста діаграма */}
                  <div className="pt-6 pb-2">
                    <div className="h-44 sm:h-52 flex items-end justify-between gap-1.5 sm:gap-4 border-b border-white/10 pb-2">
                      {statsData.chartBars.map((bar, idx) => {
                        const heightPercent = Math.max(
                          bar.revenue > 0 ? Math.round((bar.revenue / statsData.maxBarRevenue) * 100) : 4,
                          bar.count > 0 ? 8 : 4
                        );
                        const isLatest = idx === statsData.chartBars.length - 1;

                        return (
                          <div
                            key={bar.dateStr}
                            className="flex-1 flex flex-col items-center justify-end h-full group/bar relative"
                          >
                            {/* Спливаюча підказка (Tooltip) при наведенні */}
                            <div className="absolute -top-12 z-30 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none bg-black/95 text-white text-[10px] px-2.5 py-1.5 rounded-lg border border-white/20 whitespace-nowrap shadow-xl">
                              <p className="font-bold">{bar.fullDateLabel}</p>
                              <p className="text-emerald-400 font-mono">
                                {formatPrice(bar.revenue, 'pl')} {bar.count > 0 ? `(${bar.count} зам.)` : '(0 зам.)'}
                              </p>
                            </div>

                            {/* Стовпчик */}
                            <div className="w-full max-w-[42px] bg-white/5 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                              <div
                                style={{ height: `${heightPercent}%` }}
                                className={cn(
                                  'w-full transition-all duration-500 rounded-t-lg',
                                  isLatest
                                    ? 'bg-gradient-to-t from-[#e50914] to-[#ff4d58] shadow-md shadow-[#e50914]/40'
                                    : bar.revenue > 0
                                    ? 'bg-gradient-to-t from-[#8b1419] to-[#e50914] group-hover/bar:brightness-125'
                                    : 'bg-white/10'
                                )}
                              />
                            </div>

                            {/* Дата та день тижня під стовпчиком */}
                            <div className={cn(
                              'text-[10px] mt-2 font-mono text-center flex flex-col items-center leading-tight',
                              isLatest ? 'text-white font-bold' : 'text-zinc-500'
                            )}>
                              <span className={cn(
                                'text-[9px] uppercase tracking-wider font-sans font-semibold',
                                isLatest ? 'text-red-400' : 'text-zinc-400'
                              )}>
                                {bar.dayName}
                              </span>
                              <span className="text-[10px]">{bar.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 2. Піковий час замовлень */}
                <div className="bg-[#0f0f17] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Пікові години активності
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Коли клієнти замовляють суші найчастіше
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(Object.keys(statsData.hoursStats) as Array<keyof typeof statsData.hoursStats>).map((key) => {
                      const h = statsData.hoursStats[key];
                      const percent = statsData.ordersCount > 0 ? Math.round((h.count / statsData.ordersCount) * 100) : 0;

                      return (
                        <div key={key} className="p-3.5 rounded-xl bg-[#14141f] border border-white/5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-white">{h.label}</span>
                            <span className="text-[10px] font-bold text-zinc-400">{percent}%</span>
                          </div>
                          <p className="text-[11px] text-zinc-500">{h.sub}</p>
                          <div className="text-sm font-black text-zinc-200">
                            {h.count} зам.
                          </div>
                          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1">
                            <div
                              style={{ width: `${percent}%` }}
                              className="h-full bg-[#e50914] rounded-full transition-all"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Права частина (1/3): ТОП страв (вирівняна по висоті в рівень з нижнім краєм пікових годин) */}
              <div className="lg:col-span-1 flex flex-col">
                <div className="bg-[#0f0f17] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          ТОП страв за продажами
                        </h3>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Фаворити клієнтів за обраний період
                        </p>
                      </div>
                      <Award className="w-4 h-4 text-amber-400 shrink-0" />
                    </div>

                    {statsData.topDishes.length === 0 ? (
                      <div className="py-20 text-center text-zinc-500 text-xs">
                        Ще немає даних про продані страви
                      </div>
                    ) : (
                      <div className="flex flex-col justify-between gap-2.5 sm:gap-3">
                        {statsData.topDishes.map((dish, rank) => {
                          const percent = Math.round((dish.count / statsData.maxDishCount) * 100);

                          return (
                            <div key={dish.id} className="p-2.5 sm:p-3 rounded-xl bg-[#14141f] border border-white/5 space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className={cn(
                                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0',
                                    rank === 0 ? 'bg-amber-400 text-black' :
                                    rank === 1 ? 'bg-zinc-300 text-black' :
                                    rank === 2 ? 'bg-amber-700 text-white' :
                                    'bg-white/10 text-zinc-400'
                                  )}>
                                    {rank + 1}
                                  </span>
                                  {dish.image ? (
                                    <img
                                      src={dish.image}
                                      alt={dish.name}
                                      className="w-8 h-8 rounded-lg object-cover shrink-0 border border-white/10"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-xs shrink-0">
                                      🍣
                                    </div>
                                  )}
                                  <span className="text-xs font-bold text-white truncate">
                                    {dish.name}
                                  </span>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="text-xs font-black text-white">{dish.count} шт.</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                                <span>Виручка: {formatPrice(dish.revenue, 'pl')}</span>
                                <span>{percent}%</span>
                              </div>

                              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${percent}%` }}
                                  className={cn(
                                    'h-full rounded-full transition-all',
                                    rank === 0 ? 'bg-gradient-to-r from-amber-400 to-[#e50914]' : 'bg-[#e50914]'
                                  )}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Нижній блок: Способи оплати та Спосіб отримання (розміщені під піковими годинами) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Способи оплати (без зірочки для BLIK) */}
              <div className="bg-[#0f0f17] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Способи оплати
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Структура платежів за обраний період
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      key: 'blik',
                      label: 'BLIK онлайн',
                      customBadge: (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-black text-white border border-white/80 tracking-wider inline-flex items-center justify-center shadow-sm">
                          BLIK
                        </span>
                      ),
                      bar: 'bg-white',
                      data: statsData.paymentStats.blik,
                    },
                    {
                      key: 'cash',
                      label: 'Готівка',
                      customBadge: <Banknote className="w-4 h-4 text-emerald-400" />,
                      bar: 'bg-emerald-500',
                      data: statsData.paymentStats.cash,
                    },
                    {
                      key: 'card',
                      label: 'Картка / термінал курʼєру',
                      customBadge: <CreditCard className="w-4 h-4 text-blue-400" />,
                      bar: 'bg-blue-500',
                      data: statsData.paymentStats.card,
                    },
                  ].map((m) => {
                    const percent = statsData.totalRevenue > 0 ? Math.round((m.data.sum / statsData.totalRevenue) * 100) : 0;

                    return (
                      <div key={m.key} className="p-3 rounded-xl bg-[#14141f] border border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 font-bold text-zinc-300">
                            {m.customBadge}
                            <span>{m.label}</span>
                          </span>
                          <span className="font-mono font-bold text-white">
                            {formatPrice(m.data.sum, 'pl')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-zinc-500">
                          <span>{m.data.count} замовлень</span>
                          <span>{percent}% від виручки</span>
                        </div>

                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div style={{ width: `${percent}%` }} className={cn('h-full rounded-full', m.bar)} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Спосіб отримання (Доставка курʼєром vs Самовивіз) */}
              <div className="bg-[#0f0f17] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Спосіб отримання
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Розподіл між доставкою курʼєром та самовивозом
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3.5 my-auto">
                  <div className="p-4 rounded-xl bg-[#14141f] border border-white/5 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                      <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[#e50914]">
                        <Truck className="w-4 h-4" />
                      </div>
                      <span>Курʼєрська доставка</span>
                    </div>
                    <p className="text-2xl font-black text-white mt-1">{statsData.deliveryCount}</p>
                    <p className="text-[11px] text-zinc-400">{statsData.deliveryPercent}% всіх замовлень</p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#14141f] border border-white/5 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <Store className="w-4 h-4" />
                      </div>
                      <span>Самовивіз із закладу</span>
                    </div>
                    <p className="text-2xl font-black text-white mt-1">{statsData.pickupCount}</p>
                    <p className="text-[11px] text-zinc-400">{statsData.pickupPercent}% всіх замовлень</p>
                  </div>
                </div>

                {/* Загальна шкала співвідношення */}
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <span className="w-2 h-2 rounded-full bg-[#e50914]" />
                      Доставка ({statsData.deliveryPercent}%)
                    </span>
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Самовивіз ({statsData.pickupPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                    <div style={{ width: `${statsData.deliveryPercent}%` }} className="h-full bg-[#e50914] transition-all" />
                    <div style={{ width: `${statsData.pickupPercent}%` }} className="h-full bg-blue-500 transition-all" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. РОЗДІЛ: НАЛАШТУВАННЯ */}
        {activeTab === 'settings' && (
          <div className="bg-[#0f0f17] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wide">
                Налаштування системи
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Параметри підключення бази даних та закладу
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div className="p-4 bg-[#14141f] border border-white/10 rounded-xl">
                <span className="text-xs font-bold text-zinc-400 uppercase">Підключення Supabase</span>
                <p className="text-xs font-mono text-emerald-400 mt-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  czjqvocewhucknsrnese.supabase.co
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">Статус: База даних активна, авторизація успішна.</p>
              </div>

              <div className="p-4 bg-[#14141f] border border-white/10 rounded-xl">
                <span className="text-xs font-bold text-zinc-400 uppercase">Обліковий запис</span>
                <p className="text-xs text-white font-semibold mt-1.5">
                  {session?.user?.email || email}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">Права доступу: Головний адміністратор</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* МОДАЛЬНЕ ВІКНО: СТВОРЕННЯ / РЕДАГУВАННЯ СТРАВИ */}
      {isModalOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden overscroll-contain"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
            }}
            className="relative w-full max-w-2xl max-h-[92dvh] bg-[#0e0e16] border border-white/20 shadow-2xl flex flex-col my-auto overscroll-contain"
          >
            {/* Фіксований заголовок */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0 bg-[#0e0e16]">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                  {editingProduct ? 'Редагувати страву' : 'Додати нову страву'}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  ID: <span className="font-mono text-zinc-300">{formId}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Скролабельний вміст форми */}
            <form id="product-form" onSubmit={handleSaveProduct} className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1 space-y-4">
              {/* Блок категорії та фотографії страви (адаптивно: на комп'ютері в одному блоці праворуч від фото, на телефоні категорія зверху) */}
              <div className="bg-[#141420] border border-white/10 rounded-xl p-3 sm:p-4">
                <input
                  ref={modalFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleModalImageSelect}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  {/* Колонка фото (з кнопками масштабу під ним): на комп'ютері ліворуч (sm:order-1), на мобілці під категорією (order-2) */}
                  <div className="order-2 sm:order-1 flex flex-col items-center shrink-0">
                    <div
                      onClick={() => modalFileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsModalDragOver(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                        setIsModalDragOver(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsModalDragOver(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          if (!file.type.startsWith('image/')) {
                            setErrorMessage('Будь ласка, завантажуйте лише файли зображень (JPG, PNG, WEBP).');
                            return;
                          }
                          setFormImageFile(file);
                          const previewUrl = URL.createObjectURL(file);
                          setFormImagePreview(previewUrl);
                        }
                      }}
                      className={cn(
                        'relative group w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 flex items-center justify-center cursor-pointer transition-all border-2 border-dashed',
                        isModalDragOver
                          ? 'border-[#e50914] bg-[#e50914]/20 shadow-xl shadow-[#e50914]/25 scale-105'
                          : formImagePreview
                          ? 'border-white/20 hover:border-[#e50914] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08)_0%,_#07070b_70%)]'
                          : 'border-white/20 hover:border-[#e50914] bg-[#1a1a28] hover:bg-[#202032]'
                      )}
                      title="Натисніть для вибору або перетягніть нове фото"
                    >
                      {formImagePreview ? (
                        <>
                          <div
                            className="w-full h-full flex items-center justify-center transition-transform duration-200"
                            style={{ transform: `scale(${effectiveModalZoom})` }}
                          >
                            <img
                              src={formImagePreview}
                              alt="Прев'ю страви"
                              className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] p-1.5"
                            />
                          </div>
                          {/* Оверлей при наведенні */}
                          <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1 text-center">
                            <Upload className="w-4 h-4 text-white" />
                            <span className="text-[9px] font-bold text-white leading-tight">Змінити</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 p-2 text-center">
                          <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#e50914]/20 group-hover:text-[#e50914] transition-colors text-zinc-400">
                            <ImageIcon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[10px] font-bold text-zinc-300 group-hover:text-white">
                            Додати фото
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Кнопки масштабу прямо під фото (+ - без показу значення) */}
                    <div className="flex items-center gap-1 mt-1.5 w-24 sm:w-28">
                      <button
                        type="button"
                        onClick={() => {
                          const cur = effectiveModalZoom;
                          const next = Math.max(0.6, Math.round((cur - 0.20) * 100) / 100);
                          setFormZoom(next);
                        }}
                        className="flex-1 h-7 rounded-md bg-[#1b1b2a] hover:bg-[#252538] text-white text-base font-bold font-mono border border-white/10 cursor-pointer active:scale-95 transition-all flex items-center justify-center select-none"
                        title="Зменшити масштаб"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const cur = effectiveModalZoom;
                          const next = Math.min(2.6, Math.round((cur + 0.20) * 100) / 100);
                          setFormZoom(next);
                        }}
                        className="flex-1 h-7 rounded-md bg-[#1b1b2a] hover:bg-[#252538] text-white text-base font-bold font-mono border border-white/10 cursor-pointer active:scale-95 transition-all flex items-center justify-center select-none"
                        title="Збільшити масштаб"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Блок вибору категорії: на мобілці над фото (order-1), на комп'ютері праворуч від фото (sm:order-2) */}
                  <div className="order-1 sm:order-2 flex-1 w-full flex flex-col justify-center sm:self-center">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                        <FolderPlus className="w-3.5 h-3.5 text-[#e50914]" />
                        <span>Категорія меню *</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAddCategoryModalOpen(true)}
                        className="text-[11px] text-[#e50914] hover:text-[#ff3344] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Нова категорія</span>
                      </button>
                    </div>
                    <div className="relative z-30">
                      {/* Фірмова кнопка вибору категорії у стилі кнопки меню сайту */}
                      <button
                        type="button"
                        onClick={() => setIsFormCategoryDropdownOpen((prev) => !prev)}
                        style={{
                          clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                        }}
                        className={cn(
                          'w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer select-none active:scale-98 border shadow-sm',
                          isFormCategoryDropdownOpen
                            ? 'bg-[#181822] text-white border-[#e50914] shadow-md shadow-[#e50914]/25'
                            : 'bg-[#1b1b2a] hover:bg-[#222234] text-white border-white/15'
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <LayoutGrid className={cn('w-4 h-4 shrink-0 transition-transform duration-200', isFormCategoryDropdownOpen ? 'rotate-90 text-[#e50914]' : 'text-white')} />
                          <span className="truncate">
                            {categories.find((c) => c.id === formCategoryId)?.name.uk || categories.find((c) => c.id === formCategoryId)?.name.pl || 'Оберіть категорію'}
                          </span>
                          {categories.find((c) => c.id === formCategoryId) && (
                            <span className="text-[10px] text-zinc-400 font-mono">
                              ({products.filter((p) => p.categoryId === formCategoryId).length} поз.)
                            </span>
                          )}
                        </div>
                        <ChevronDown className={cn('w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200', isFormCategoryDropdownOpen ? 'rotate-180 text-white' : '')} />
                      </button>

                      {/* Прозорий бекдроп для закриття списку */}
                      {isFormCategoryDropdownOpen && (
                        <div
                          className="fixed inset-0 z-40 bg-transparent cursor-default"
                          onClick={() => setIsFormCategoryDropdownOpen(false)}
                        />
                      )}

                      {/* Фірмовий випадаючий самурайський список категорій: компактний, вміщується без скролу */}
                      {isFormCategoryDropdownOpen && (
                        <div
                          style={{
                            clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
                          }}
                          className="absolute left-0 right-0 top-full mt-1.5 p-[1px] bg-white/20 shadow-2xl shadow-black/95 z-50 animate-in fade-in zoom-in-95 duration-150"
                        >
                          <div
                            style={{
                              clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)',
                            }}
                            className="w-full bg-[#0d0d12] backdrop-blur-2xl p-2.5 flex flex-col"
                          >
                            <div className="px-2.5 py-1 border-b border-white/10 mb-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-zinc-400">
                              <span>Оберіть категорію меню</span>
                              <span className="bg-white/5 px-2 py-0.5 rounded-full font-bold">{categories.length} розділів</span>
                            </div>

                            {/* Сітка в 2 колонки на десктопі та компактний список на мобілці, щоб все вміщувалось без скролу */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-1.5">
                              {categories.map((c) => {
                                const isActive = formCategoryId === c.id;
                                const count = products.filter((p) => p.categoryId === c.id).length;
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      setFormCategoryId(c.id);
                                      setIsFormCategoryDropdownOpen(false);
                                    }}
                                    style={{
                                      clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                                    }}
                                    className={cn(
                                      'w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 text-left transition-all cursor-pointer group select-none',
                                      isActive
                                        ? 'bg-gradient-to-r from-[#e50914]/25 to-[#e50914]/10 border-l-2 border-[#e50914] text-white font-black shadow-sm'
                                        : 'text-zinc-300 hover:text-white hover:bg-white/10'
                                    )}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <span className={cn('truncate text-xs font-bold', isActive ? 'text-white font-black' : 'text-zinc-300')}>
                                        {c.name.uk || c.name.pl}
                                      </span>
                                      {c.name.pl && c.name.uk && c.name.pl !== c.name.uk && (
                                        <span className="text-[10px] text-zinc-500 truncate hidden xs:inline">({c.name.pl})</span>
                                      )}
                                    </div>
                                    <span className="flex-1 border-b border-dotted border-white/15 min-w-2" />
                                    <span className={cn('text-[10px] sm:text-[11px] font-bold tracking-tight shrink-0', isActive ? 'text-red-300 font-black' : 'text-zinc-400')}>
                                      {count} поз.
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Блок двох мов (Перемикач вкладок Польська / Українська) */}
              <div className="bg-[#141420] border border-white/10 rounded-xl p-3 sm:p-4 space-y-3.5">
                <div className="flex items-center gap-1.5 p-1 bg-[#0e0e16] rounded-lg border border-white/10 w-fit">
                  <button
                    type="button"
                    onClick={() => setActiveLangTab('pl')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer',
                      activeLangTab === 'pl'
                        ? 'bg-[#252538] text-white shadow-sm border border-white/20'
                        : 'text-zinc-400 hover:text-white'
                    )}
                  >
                    <span>Польська</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLangTab('uk')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer',
                      activeLangTab === 'uk'
                        ? 'bg-[#252538] text-white shadow-sm border border-white/20'
                        : 'text-zinc-400 hover:text-white'
                    )}
                  >
                    <span>Українська</span>
                  </button>
                </div>

                {/* Вміст вкладки PL */}
                {activeLangTab === 'pl' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                        Назва *
                      </label>
                      <input
                        type="text"
                        value={formNamePl}
                        onChange={(e) => setFormNamePl(e.target.value)}
                        placeholder="np. Philadelphia z Łososiem"
                        className="w-full bg-[#1b1b2a] border border-white/10 focus:border-[#e50914] rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                        Опис
                      </label>
                      <textarea
                        rows={2}
                        value={formDescPl}
                        onChange={(e) => setFormDescPl(e.target.value)}
                        placeholder="np. Wyśmienity łosoś z serkiem, ogórkiem i awokado..."
                        className="w-full bg-[#1b1b2a] border border-white/10 focus:border-[#e50914] rounded-lg p-2.5 text-xs text-white focus:outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                        Інгредієнти (через кому)
                      </label>
                      <input
                        type="text"
                        value={formIngredientsPl}
                        onChange={(e) => setFormIngredientsPl(e.target.value)}
                        placeholder="NORI, RYŻ, ŁOSOŚ, SER ŚMIETANKOWY, OGÓREK"
                        className="w-full bg-[#1b1b2a] border border-white/10 focus:border-[#e50914] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Вміст вкладки UK */}
                {activeLangTab === 'uk' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                        Назва *
                      </label>
                      <input
                        type="text"
                        value={formNameUk}
                        onChange={(e) => setFormNameUk(e.target.value)}
                        placeholder="напр. Філадельфія з Лососем (якщо порожньо — перекладеться автоматично)"
                        className="w-full bg-[#1b1b2a] border border-white/10 focus:border-[#e50914] rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                        Опис
                      </label>
                      <textarea
                        rows={2}
                        value={formDescUk}
                        onChange={(e) => setFormDescUk(e.target.value)}
                        placeholder="напр. Вишуканий лосось з крем-сиром, огірком та авокадо..."
                        className="w-full bg-[#1b1b2a] border border-white/10 focus:border-[#e50914] rounded-lg p-2.5 text-xs text-white focus:outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                        Інгредієнти (через кому)
                      </label>
                      <input
                        type="text"
                        value={formIngredientsUk}
                        onChange={(e) => setFormIngredientsUk(e.target.value)}
                        placeholder="НОРІ, РИС, ЛОСОСЬ, КРЕМ-СИР, ОГІРОК"
                        className="w-full bg-[#1b1b2a] border border-white/10 focus:border-[#e50914] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Блок параметрів страви (Ціна, вага, шматочки, бейдж) */}
              <div className="bg-[#141420] border border-white/10 rounded-xl p-3 sm:p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Ціна (PLN) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      className="w-full bg-[#1b1b2a] border border-white/10 focus:border-[#e50914] rounded-lg px-3 py-2 text-sm text-white focus:outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Вага (грами)
                    </label>
                    <input
                      type="number"
                      value={formWeight}
                      onChange={(e) => setFormWeight(Number(e.target.value))}
                      className="w-full bg-[#1b1b2a] border border-white/10 focus:border-[#e50914] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Шматочки (шт)
                    </label>
                    <input
                      type="number"
                      value={formPieces}
                      onChange={(e) => setFormPieces(e.target.value)}
                      placeholder="8"
                      className="w-full bg-[#1b1b2a] border border-white/10 focus:border-[#e50914] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Бейдж
                    </label>
                    <select
                      value={formBadge}
                      onChange={(e) => setFormBadge(e.target.value)}
                      className="w-full bg-[#1b1b2a] border border-white/10 focus:border-[#e50914] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="">Без бейджа</option>
                      <option value="new">NEW — Новинка</option>
                      <option value="veg">VEGAN — Веган</option>
                      <option value="hit">HIT — Хіт продажів</option>
                      <option value="spicy">SPICY — Гостре</option>
                      <option value="sale">SALE — Акція</option>
                    </select>
                  </div>
                </div>
              </div>
            </form>

            {/* Фіксований футер з кнопками */}
            <div className="px-5 py-3.5 border-t border-white/10 shrink-0 bg-[#0e0e16] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Скасувати
              </button>
              <button
                type="submit"
                form="product-form"
                disabled={isSavingProduct}
                style={{
                  clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                }}
                className="px-6 py-2.5 bg-[#e50914] hover:bg-[#f4222d] text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#e50914]/30 active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingProduct ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Збереження...</span>
                  </>
                ) : (
                  <span>Зберегти страву</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛЬНЕ ВІКНО: СТВОРЕННЯ НОВОЇ КАТЕГОРІЇ */}
      {isAddCategoryModalOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddCategoryModalOpen(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden overscroll-contain"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
            }}
            className="relative w-full max-w-md bg-[#0e0e16] border border-white/20 p-5 sm:p-6 shadow-2xl overscroll-contain"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-[#e50914]" />
                <span>Нова категорія меню</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddCategoryModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Назва польською *
                </label>
                <input
                  type="text"
                  required
                  value={newCatNamePl}
                  onChange={(e) => setNewCatNamePl(e.target.value)}
                  placeholder="np. Zupy, Desery, Wok"
                  className="w-full bg-[#141420] border border-white/15 focus:border-[#e50914] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Назва українською
                </label>
                <input
                  type="text"
                  value={newCatNameUk}
                  onChange={(e) => setNewCatNameUk(e.target.value)}
                  placeholder="напр. Супи, Десерти, Вок"
                  className="w-full bg-[#141420] border border-white/15 focus:border-[#e50914] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCategory}
                  style={{
                    clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                  }}
                  className="px-5 py-2 bg-[#e50914] hover:bg-[#f4222d] text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-[#e50914]/25 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isCreatingCategory ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Створення...</span>
                    </>
                  ) : (
                    <span>Створити</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

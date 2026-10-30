'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  Flame,
  Check,
  ToggleLeft,
  ToggleRight,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { brandTheme } from '@/config/theme';
import { Category, Product, ProductBadge as ProductBadgeType } from '@/types';
import { ProductBadge } from '@/components/menu/ProductBadge';
import { getProductZoom, ZOOM_PRESETS } from '@/lib/imageZoom';
import { 
  fetchMenuData, 
  updateProduct, 
  createProduct, 
  deleteProduct, 
  uploadProductImage 
} from '@/lib/menuService';

type AdminTab = 'orders' | 'menu' | 'stats' | 'settings';

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('makssushiswidnica@gmail.com');
  const [password, setPassword] = useState('MaksSushi@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('menu');

  // Дані меню
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchMenuQuery, setSearchMenuQuery] = useState('');

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

  const quickFileInputRef = useRef<HTMLInputElement>(null);
  const [quickUploadProductId, setQuickUploadProductId] = useState<string | null>(null);

  // Перевірка сесії при завантаженні
  useEffect(() => {
    async function checkSession() {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
      } catch (err) {
        console.warn('Session check error:', err);
      } finally {
        setLoading(false);
      }
    }

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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

  useEffect(() => {
    if (session) {
      loadMenu();
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
    } catch (err) {
      console.warn('Logout error:', err);
    }
  };

  // Відкриття модалки для додавання нової страви
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormId(`dish-${Date.now()}`);
    setFormCategoryId(categories[0]?.id || 'mini-maki');
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
    setIsSavingProduct(true);
    setErrorMessage('');

    try {
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
      const ingUkArray = formIngredientsUk
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
        name: { pl: formNamePl.trim(), uk: formNameUk.trim() },
        description: { pl: formDescPl.trim(), uk: formDescUk.trim() },
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
        showToast('Дані страви оновлено!');
      } else {
        // Створення нової
        const res = await createProduct(productPayload);
        if (!res.success) throw new Error(res.error);

        setProducts((prev) => [productPayload, ...prev]);
        showToast('Нову страву успішно додано в меню!');
      }

      setIsModalOpen(false);
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
    const matchesCategory =
      selectedCategoryFilter === 'all' || p.categoryId === selectedCategoryFilter;
    const query = searchMenuQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.name.pl.toLowerCase().includes(query) ||
      p.name.uk.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

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
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#e50914] bg-black shrink-0">
              <img
                src={brandTheme.logo}
                alt={brandTheme.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white tracking-wide uppercase">
                  Maks Sushi
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#e50914]/20 text-[#e50914] border border-[#e50914]/40">
                  Admin
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500" />
                <span className="font-mono text-zinc-400 truncate max-w-[150px] sm:max-w-none">
                  czjqvocewhucknsrnese.supabase.co
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden md:inline-block text-xs font-semibold text-zinc-400 bg-white/5 border border-white/10 px-3 py-1 rounded-lg">
              {session?.user?.email || email}
            </span>
            <Link
              href="/pl"
              target="_blank"
              title="Відкрити клієнтський сайт"
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
        </div>
      </header>

      {/* Спливаюче сповіщення про успіх */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 font-bold text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
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
        {/* Таби навігації */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10 no-scrollbar mb-6 sm:mb-8">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'menu'
                ? 'bg-[#e50914] text-white shadow-lg shadow-[#e50914]/30'
                : 'bg-[#12121a] text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1a26]'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Меню та страви ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#e50914] text-white shadow-lg shadow-[#e50914]/30'
                : 'bg-[#12121a] text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1a26]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Замовлення</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-[#e50914] text-white shadow-lg shadow-[#e50914]/30'
                : 'bg-[#12121a] text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1a26]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Статистика</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#e50914] text-white shadow-lg shadow-[#e50914]/30'
                : 'bg-[#12121a] text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1a26]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Налаштування</span>
          </button>
        </div>

        {/* 1. РОЗДІЛ: МЕНЮ ТА СТРАВИ */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            {/* Панель керування: пошук та кнопка додати */}
            <div className="bg-[#0f0f17] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex-1 max-w-md">
                {/* Пошук страви */}
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={searchMenuQuery}
                    onChange={(e) => setSearchMenuQuery(e.target.value)}
                    placeholder="Пошук за назвою або id страви..."
                    className="w-full bg-[#151522] border border-white/10 focus:border-[#e50914] rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                  />
                  {searchMenuQuery && (
                    <button
                      onClick={() => setSearchMenuQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Кнопки дій */}
              <div className="flex items-center gap-2.5 shrink-0 justify-end">
                <button
                  onClick={loadMenu}
                  disabled={isLoadingMenu}
                  title="Оновити список з бази Supabase"
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#161622] hover:bg-[#202030] text-xs font-bold text-zinc-200 border border-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#e50914] ${isLoadingMenu ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Оновити</span>
                </button>

                <button
                  onClick={handleOpenAddModal}
                  style={{
                    clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#e50914] hover:bg-[#f4222d] text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg shadow-[#e50914]/30 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Додати страву</span>
                </button>
              </div>
            </div>

            {/* СТІКІ-ПАНЕЛЬ КАТЕГОРІЙ: фіксується при скролі */}
            <div className="sticky top-16 z-30 bg-[#0d0d14]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 sm:p-3 shadow-xl shadow-black/60">
              {/* Мобільний вигляд: ТІЛЬКИ випадаючий список згідно вимог */}
              <div className="block sm:hidden">
                <div className="relative">
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="w-full bg-[#151522] border border-white/15 focus:border-[#e50914] rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none appearance-none cursor-pointer pr-10 shadow-inner"
                  >
                    <option value="all">Усі розділи меню ({products.length} страв)</option>
                    {categories.map((cat) => {
                      const count = products.filter((p) => p.categoryId === cat.id).length;
                      return (
                        <option key={cat.id} value={cat.id}>
                          {cat.name.uk || cat.name.pl} ({count} поз.)
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              {/* Десктопний вигляд: Панель категорій із переносом на новий рядок, якщо не влазить */}
              <div className="hidden sm:flex flex-wrap items-center gap-2 py-0.5">
                <button
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer',
                    selectedCategoryFilter === 'all'
                      ? 'bg-[#e50914] text-white shadow-md shadow-[#e50914]/40 scale-105'
                      : 'bg-[#151522] hover:bg-[#202030] text-zinc-400 hover:text-white border border-white/10'
                  )}
                >
                  <span>Всі страви</span>
                  <span className={cn('text-[10px] px-1.5 py-0.2 rounded-full font-bold', selectedCategoryFilter === 'all' ? 'bg-black/30 text-white' : 'bg-white/10 text-zinc-400')}>
                    {products.length}
                  </span>
                </button>

                {categories.map((cat) => {
                  const count = products.filter((p) => p.categoryId === cat.id).length;
                  const isActive = selectedCategoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryFilter(cat.id)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer',
                        isActive
                          ? 'bg-[#e50914] text-white shadow-md shadow-[#e50914]/40 scale-105 font-black'
                          : 'bg-[#151522] hover:bg-[#202030] text-zinc-400 hover:text-white border border-white/10'
                      )}
                    >
                      <span>{cat.name.uk || cat.name.pl}</span>
                      <span className={cn('text-[10px] px-1.5 py-0.2 rounded-full font-bold', isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-zinc-400')}>
                        {count}
                      </span>
                    </button>
                  );
                })}
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

            {/* Список страв у вигляді карток-рядків з підтримкою Drag & Drop файлів фотографій */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    className={cn(
                      'relative bg-[#0f0f17] border rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 group',
                      isDragOverThis
                        ? 'border-[#e50914] bg-[#e50914]/15 ring-2 ring-[#e50914] shadow-2xl shadow-[#e50914]/30 scale-[1.02]'
                        : product.isAvailable
                          ? 'border-white/10 hover:border-white/20'
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
                            onClick={() => triggerQuickUpload(product.id)}
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

                          {/* Швидке регулювання масштабу прямо на картці списку */}
                          {product.image && (
                            <div className="flex items-center justify-between w-full mt-1.5 px-1 py-0.5 bg-black/70 border border-white/10 rounded-md">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickZoomChange(product, -0.05);
                                }}
                                title="Зменшити масштаб фото (-5%)"
                                className="w-4 h-4 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/15 rounded text-xs font-bold leading-none cursor-pointer"
                              >
                                -
                              </button>
                              <span className="text-[9px] font-mono font-bold text-zinc-300 select-none">
                                {Math.round(getProductZoom(product) * 100)}%
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickZoomChange(product, 0.05);
                                }}
                                title="Збільшити масштаб фото (+5%)"
                                className="w-4 h-4 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/15 rounded text-xs font-bold leading-none cursor-pointer"
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

                          <h3 className="text-sm font-black text-white truncate leading-tight">
                            {product.name.pl}
                          </h3>
                          <p className="text-xs text-zinc-400 truncate leading-tight mt-0.5">
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

                      {/* Опис страви */}
                      <p className="text-[11px] text-zinc-400 line-clamp-2 mb-3">
                        {product.description.pl || product.description.uk}
                      </p>
                    </div>

                    {/* Нижня панель дій */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      {/* Тумблер наявності */}
                      <button
                        onClick={() => handleToggleAvailability(product)}
                        className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer select-none ${
                          product.isAvailable
                            ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                            : 'text-zinc-500 bg-zinc-800 hover:bg-zinc-700'
                        }`}
                        title={product.isAvailable ? 'В наявності на сайті' : 'Приховано / Стоп-лист'}
                      >
                        {product.isAvailable ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-emerald-400" />
                            <span>В меню</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-zinc-500" />
                            <span>Стоп-лист</span>
                          </>
                        )}
                      </button>

                      {/* Кнопки редагування та видалення */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          title="Редагувати страву"
                          className="p-1.5 rounded-lg bg-[#181824] hover:bg-[#252538] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product)}
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
          </div>
        )}

        {/* 2. РОЗДІЛ: ЗАМОВЛЕННЯ */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
              <div className="bg-[#0f0f17] border border-white/10 rounded-xl p-4">
                <span className="text-xs text-zinc-400 font-semibold uppercase">Нові замовлення</span>
                <p className="text-2xl font-black text-white mt-1">0</p>
              </div>
              <div className="bg-[#0f0f17] border border-white/10 rounded-xl p-4">
                <span className="text-xs text-zinc-400 font-semibold uppercase">В процесі (кухня)</span>
                <p className="text-2xl font-black text-amber-400 mt-1">0</p>
              </div>
              <div className="bg-[#0f0f17] border border-white/10 rounded-xl p-4">
                <span className="text-xs text-zinc-400 font-semibold uppercase">Доставлено сьогодні</span>
                <p className="text-2xl font-black text-emerald-400 mt-1">0</p>
              </div>
              <div className="bg-[#0f0f17] border border-white/10 rounded-xl p-4">
                <span className="text-xs text-zinc-400 font-semibold uppercase">Каса сьогодні</span>
                <p className="text-2xl font-black text-[#e50914] mt-1">0 zł</p>
              </div>
            </div>

            <div className="bg-[#0f0f17] border border-white/10 rounded-2xl p-6 sm:p-8">
              <h2 className="text-lg font-black text-white uppercase tracking-wide mb-1">
                Потік замовлень
              </h2>
              <p className="text-xs text-zinc-400 mb-8">
                Замовлення клієнтів з кошика будуть надходити сюди в реальному часі через таблицю orders.
              </p>
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-full bg-[#181824] flex items-center justify-center mb-3">
                  <ShoppingBag className="w-7 h-7 text-[#e50914]" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Замовлень поки що немає</h3>
                <p className="text-xs text-zinc-400 max-w-sm">
                  Оформіть тестове замовлення через сайт, і воно миттєво з'явиться тут.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. РОЗДІЛ: СТАТИСТИКА */}
        {activeTab === 'stats' && (
          <div className="bg-[#0f0f17] border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-black text-white uppercase tracking-wide mb-1">
              Аналітика продажів
            </h2>
            <p className="text-xs text-zinc-400 mb-8">
              Звіти по виручці, середньому чеку та найпопулярніших ролах
            </p>
            <div className="py-16 text-center text-zinc-400">
              <BarChart3 className="w-10 h-10 text-[#e50914] mx-auto mb-3" />
              <p className="text-sm font-bold text-white mb-1">Модуль аналітики</p>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Графіки та аналітика замовлень будуть активовані після перших замовлень.
              </p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div 
            style={{
              clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
            }}
            className="relative w-full max-w-2xl bg-[#0e0e16] border border-white/20 p-6 sm:p-8 shadow-2xl my-8"
          >
            {/* Заголовок модалки */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  {editingProduct ? 'Редагувати страву' : 'Додати нову страву'}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  ID: <span className="font-mono text-zinc-300">{formId}</span>
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Форма */}
            <form onSubmit={handleSaveProduct} className="space-y-5">
              {/* Блок завантаження фотографії страви */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Фотографія страви (Supabase Storage: бакет "products")
                </label>
                <div
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
                        setErrorMessage('Будь ласка, перетягуйте лише файли зображень (JPG, PNG, WEBP).');
                        return;
                      }
                      setFormImageFile(file);
                      const previewUrl = URL.createObjectURL(file);
                      setFormImagePreview(previewUrl);
                    }
                  }}
                  className={cn(
                    'flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl transition-all border-2',
                    isModalDragOver
                      ? 'border-dashed border-[#e50914] bg-[#e50914]/15 shadow-xl shadow-[#e50914]/25 scale-[1.01]'
                      : 'bg-[#141420] border-white/10 hover:border-white/20'
                  )}
                >
                  {/* Прев'ю */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08)_0%,_#07070b_70%)] border border-white/15 shrink-0 flex items-center justify-center shadow-md">
                    {formImagePreview ? (
                      <div
                        className="w-full h-full flex items-center justify-center transition-transform duration-200"
                        style={{ transform: `scale(${effectiveModalZoom})` }}
                      >
                        <img
                          src={formImagePreview}
                          alt="Прев'ю"
                          className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] p-1"
                        />
                      </div>
                    ) : (
                      <ImageIcon className="w-8 h-8 text-zinc-600" />
                    )}
                  </div>

                  {/* Кнопка вибору файлу та зона Drag & Drop */}
                  <div className="flex-1 w-full text-center sm:text-left">
                    <input
                      type="file"
                      id="modal-dish-file"
                      accept="image/*"
                      onChange={handleModalImageSelect}
                      className="hidden"
                    />
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <label
                        htmlFor="modal-dish-file"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#202030] hover:bg-[#2a2a40] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors border border-white/10"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#e50914]" />
                        <span>{formImagePreview ? 'Замінити файл' : 'Обрати файл'}</span>
                      </label>
                      <span className="text-xs text-zinc-400 font-medium">
                        або перетягніть файл фотографії сюди
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-2">
                      Підтримуються формати JPG, PNG, WEBP.
                    </p>

                    {/* Тонке налаштування масштабу страви на сайті */}
                    <div className="mt-3 pt-3 border-t border-white/10 w-full text-left">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-zinc-300">
                          Масштаб фото на сайті: <span className="text-[#e50914] font-mono font-black">{Math.round(effectiveModalZoom * 100)}%</span>
                          <span className="text-zinc-500 font-normal ml-1">
                            {formZoom !== '' ? '(налаштовано вручну)' : '(авто за категорією)'}
                          </span>
                        </span>
                        {formZoom !== '' && (
                          <button
                            type="button"
                            onClick={() => setFormZoom('')}
                            className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
                          >
                            Скинути на авто
                          </button>
                        )}
                      </div>

                      {/* Швидкі пресети масштабу */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2.5">
                        {ZOOM_PRESETS.map((p) => {
                          const isSelected = formZoom === p.value;
                          return (
                            <button
                              key={p.value}
                              type="button"
                              onClick={() => setFormZoom(p.value)}
                              title={p.desc}
                              className={cn(
                                'px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer',
                                isSelected
                                  ? 'bg-[#e50914] text-white border-[#e50914] shadow-md shadow-[#e50914]/30'
                                  : 'bg-[#181826] text-zinc-300 border-white/10 hover:border-white/20'
                              )}
                            >
                              {p.label} <span className="text-[10px] opacity-75">({Math.round(p.value * 100)}%)</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Повзунок масштабу */}
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-zinc-500 font-mono">80%</span>
                        <input
                          type="range"
                          min="0.80"
                          max="1.60"
                          step="0.02"
                          value={effectiveModalZoom}
                          onChange={(e) => setFormZoom(Number(parseFloat(e.target.value).toFixed(2)))}
                          className="flex-1 accent-[#e50914] cursor-pointer"
                        />
                        <span className="text-[10px] text-zinc-500 font-mono">160%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Назва (PL / UK) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Назва польською (PL) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNamePl}
                    onChange={(e) => setFormNamePl(e.target.value)}
                    placeholder="np. Philadelphia z Łososiem"
                    className="w-full bg-[#141420] border border-white/10 focus:border-[#e50914] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Назва українською (UK) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNameUk}
                    onChange={(e) => setFormNameUk(e.target.value)}
                    placeholder="напр. Філадельфія з Лососем"
                    className="w-full bg-[#141420] border border-white/10 focus:border-[#e50914] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Категорія, ціна, вага, шматочки */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Розділ меню *
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full bg-[#141420] border border-white/10 focus:border-[#e50914] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name.pl}
                      </option>
                    ))}
                  </select>
                </div>

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
                    className="w-full bg-[#141420] border border-white/10 focus:border-[#e50914] rounded-lg px-3 py-2 text-sm text-white focus:outline-none font-bold"
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
                    className="w-full bg-[#141420] border border-white/10 focus:border-[#e50914] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
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
                    className="w-full bg-[#141420] border border-white/10 focus:border-[#e50914] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Бейдж та статус наявності */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Маркетинговий бейдж
                  </label>
                  <select
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    className="w-full bg-[#141420] border border-white/10 focus:border-[#e50914] rounded-lg px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="">Без бейджа</option>
                    <option value="new">NEW — Новинка</option>
                    <option value="veg">VEGAN — Веган</option>
                    <option value="hit">HIT — Хіт продажів</option>
                    <option value="spicy">SPICY — Гостре</option>
                    <option value="sale">SALE — Акція</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Статус страви
                  </label>
                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-200">
                      <input
                        type="checkbox"
                        checked={formIsAvailable}
                        onChange={(e) => setFormIsAvailable(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#e50914] cursor-pointer"
                      />
                      <span>Показувати в меню для замовлення</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Опис (PL / UK) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Опис польською (PL)
                  </label>
                  <textarea
                    rows={2}
                    value={formDescPl}
                    onChange={(e) => setFormDescPl(e.target.value)}
                    placeholder="Opis składników..."
                    className="w-full bg-[#141420] border border-white/10 focus:border-[#e50914] rounded-lg p-2.5 text-xs text-white focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Опис українською (UK)
                  </label>
                  <textarea
                    rows={2}
                    value={formDescUk}
                    onChange={(e) => setFormDescUk(e.target.value)}
                    placeholder="Опис інгредієнтів..."
                    className="w-full bg-[#141420] border border-white/10 focus:border-[#e50914] rounded-lg p-2.5 text-xs text-white focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Інгредієнти (через кому) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Інгредієнти PL (через кому)
                  </label>
                  <input
                    type="text"
                    value={formIngredientsPl}
                    onChange={(e) => setFormIngredientsPl(e.target.value)}
                    placeholder="NORI, RYŻ, ŁOSOŚ, AWOKADO"
                    className="w-full bg-[#141420] border border-white/10 focus:border-[#e50914] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Інгредієнти UK (через кому)
                  </label>
                  <input
                    type="text"
                    value={formIngredientsUk}
                    onChange={(e) => setFormIngredientsUk(e.target.value)}
                    placeholder="НОРІ, РИС, ЛОСОСЬ, АВОКАДО"
                    className="w-full bg-[#141420] border border-white/10 focus:border-[#e50914] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Кнопки збереження */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

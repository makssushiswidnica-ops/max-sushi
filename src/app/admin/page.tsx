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
  ChevronDown,
  FolderPlus,
  Wand2,
  Globe,
  LayoutGrid
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
  uploadProductImage,
  createCategory
} from '@/lib/menuService';
import { autoTranslateDish } from '@/lib/translateService';

type AdminTab = 'dashboard' | 'orders' | 'menu' | 'stats' | 'settings';

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

          <div className="flex items-center gap-2 sm:gap-3">
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

      {/* Стікі-навігація під хедером (3 вкладки, на мобілці ідеально влазять без скролу) */}
      {activeTab !== 'dashboard' && (
        <div className="sticky top-16 z-30 w-full bg-[#0d0d14]/95 backdrop-blur-xl border-b border-white/10 shadow-md">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className={cn(
              "grid w-full py-0.5",
              activeTab === 'settings' ? "grid-cols-4" : "grid-cols-3 sm:flex sm:w-auto sm:items-center sm:gap-4"
            )}>
              {/* Розділ МЕНЮ */}
              <button
                type="button"
                onClick={() => setActiveTab('menu')}
                className={cn(
                  'relative py-3 px-1 sm:px-4 text-[11px] xs:text-xs sm:text-sm font-bold tracking-wider uppercase whitespace-nowrap transition-all duration-200 cursor-pointer select-none flex items-center justify-center gap-1.5 sm:gap-2',
                  activeTab === 'menu' ? 'text-white font-black' : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                <UtensilsCrossed className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0', activeTab === 'menu' ? 'text-[#e50914]' : 'text-zinc-400')} />
                <span className="truncate">МЕНЮ <span className="hidden sm:inline">({products.length})</span></span>
                {activeTab === 'menu' && (
                  <span className="absolute bottom-0 left-1 right-1 sm:left-2 sm:right-2 h-[2.5px] rounded-full bg-gradient-to-r from-[#e50914] via-[#ff4d58] to-[#e50914] shadow-[0_0_12px_#e50914]" />
                )}
              </button>

              {/* Розділ ЗАМОВЛЕННЯ */}
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={cn(
                  'relative py-3 px-1 sm:px-4 text-[11px] xs:text-xs sm:text-sm font-bold tracking-wider uppercase whitespace-nowrap transition-all duration-200 cursor-pointer select-none flex items-center justify-center gap-1.5 sm:gap-2',
                  activeTab === 'orders' ? 'text-white font-black' : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                <ShoppingBag className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0', activeTab === 'orders' ? 'text-[#e50914]' : 'text-zinc-400')} />
                <span className="truncate">ЗАМОВЛЕННЯ</span>
                {activeTab === 'orders' && (
                  <span className="absolute bottom-0 left-1 right-1 sm:left-2 sm:right-2 h-[2.5px] rounded-full bg-gradient-to-r from-[#e50914] via-[#ff4d58] to-[#e50914] shadow-[0_0_12px_#e50914]" />
                )}
              </button>

              {/* Розділ СТАТИСТИКА */}
              <button
                type="button"
                onClick={() => setActiveTab('stats')}
                className={cn(
                  'relative py-3 px-1 sm:px-4 text-[11px] xs:text-xs sm:text-sm font-bold tracking-wider uppercase whitespace-nowrap transition-all duration-200 cursor-pointer select-none flex items-center justify-center gap-1.5 sm:gap-2',
                  activeTab === 'stats' ? 'text-white font-black' : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                <BarChart3 className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0', activeTab === 'stats' ? 'text-[#e50914]' : 'text-zinc-400')} />
                <span className="truncate">СТАТИСТИКА</span>
                {activeTab === 'stats' && (
                  <span className="absolute bottom-0 left-1 right-1 sm:left-2 sm:right-2 h-[2.5px] rounded-full bg-gradient-to-r from-[#e50914] via-[#ff4d58] to-[#e50914] shadow-[0_0_12px_#e50914]" />
                )}
              </button>

              {/* Розділ НАЛАШТУВАННЯ (при активному переході через шестерню) */}
              {activeTab === 'settings' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="relative py-3 px-1 sm:px-4 text-[11px] xs:text-xs sm:text-sm font-black tracking-wider uppercase whitespace-nowrap text-white select-none flex items-center justify-center gap-1.5 sm:gap-2"
                >
                  <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#e50914] shrink-0" />
                  <span className="truncate">ОПЦІЇ</span>
                  <span className="absolute bottom-0 left-1 right-1 sm:left-2 sm:right-2 h-[2.5px] rounded-full bg-gradient-to-r from-[#e50914] via-[#ff4d58] to-[#e50914] shadow-[0_0_12px_#e50914]" />
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

              {/* 2. КАРТКА: ЗАМОВЛЕННЯ */}
              <div
                onClick={() => setActiveTab('orders')}
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
                        <ShoppingBag className="w-5 h-5 sm:w-7 sm:h-7" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-2xl font-black uppercase tracking-wider text-white group-hover:text-[#ff4d58] transition-colors">
                          ЗАМОВЛЕННЯ
                        </h2>
                        <p className="hidden sm:block text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                          Потік онлайн-замовлень у реальному часі, кухня, кур'єрська доставка та статуси.
                        </p>
                      </div>
                    </div>
                    <div className="sm:hidden flex items-center gap-1 text-xs font-bold text-zinc-400 group-hover:text-white transition-colors shrink-0">
                      <span className="text-[#e50914] text-base group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                  <div className="hidden sm:flex pt-6 mt-6 border-t border-white/10 items-center justify-between text-xs font-black uppercase tracking-wider text-zinc-400 group-hover:text-white transition-colors">
                    <span>Перейти до замовлень</span>
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

import { useEffect, useState, type FormEvent } from 'react';
import { Archive, ArrowLeft, Check, CirclePlus, Package, RefreshCw, RotateCcw, Search, Tag, Trash2, X } from 'lucide-react';
import { solicitarApi } from '../services/apiClient';
import { cargarCatalogoPos, guardarCatalogoPos, obtenerCatalogoBasePos, type StoredCatalog } from '../services/posLocalStore';
import { usePosDialogs } from './PosDialogs';

type Section = 'products' | 'categories' | 'modifiers';
interface Category { id: number; slug: string; name: string; sort_order: number; is_active: boolean; updated_at: string; }
interface Product { id: number; slug: string; category_id: number; category_name: string; name: string; description: string; ingredients: string[]; price: number; original_price: number | null; image_url: string; badge: string; is_available: boolean; is_active: boolean; updated_at: string; }
interface Modifier { id: number; name: string; price: number; modifier_type: 'EXTRA_PAGO' | 'EXCLUSION_COCINA'; is_available: boolean; is_active: boolean; updated_at: string; }
type ProductForm = Omit<Product, 'id' | 'slug' | 'category_name' | 'updated_at' | 'ingredients'> & { id?: number; ingredients_text: string };
type CategoryForm = { id?: number; name: string; sort_order: number; is_active: boolean };
type ModifierForm = { id?: number; name: string; price: number; modifier_type: Modifier['modifier_type']; is_available: boolean; is_active: boolean };

const blankProduct = (categoryId = 0): ProductForm => ({ category_id: categoryId, name: '', description: '', ingredients_text: '', price: 0, original_price: null, image_url: '', badge: '', is_available: true, is_active: true });
const blankCategory = (): CategoryForm => ({ name: '', sort_order: 0, is_active: true });
const blankModifier = (): ModifierForm => ({ name: '', price: 0, modifier_type: 'EXTRA_PAGO', is_available: true, is_active: true });
const money = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);

export function PosCatalogManager({ offlineMode, onClose }: { offlineMode: boolean; onClose: () => void }) {
  const { confirm } = usePosDialogs();
  const [section, setSection] = useState<Section>('products');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [productForm, setProductForm] = useState<ProductForm>(blankProduct());
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(blankCategory());
  const [modifierForm, setModifierForm] = useState<ModifierForm>(blankModifier());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const applyStoredCatalog = (stored: StoredCatalog) => {
    const loadedCategories: Category[] = stored.catalog.categories.map(item => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      sort_order: item.sort_order,
      is_active: item.is_active ?? true,
      updated_at: item.updated_at ?? stored.catalog.generated_at,
    }));
    const loadedProducts: Product[] = stored.catalog.products.map(item => ({
      id: item.id,
      slug: item.slug,
      category_id: item.category_id,
      category_name: item.category_name,
      name: item.name,
      description: item.description ?? '',
      ingredients: item.ingredients ?? [],
      price: item.price,
      original_price: item.original_price ?? null,
      image_url: item.image_url ?? '',
      badge: item.badge ?? '',
      is_available: item.is_available ?? true,
      is_active: item.is_active ?? true,
      updated_at: item.updated_at ?? stored.catalog.generated_at,
    }));
    const loadedModifiers: Modifier[] = stored.catalog.modifiers.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      modifier_type: item.modifier_type,
      is_available: item.is_available ?? true,
      is_active: item.is_active ?? true,
      updated_at: item.updated_at ?? stored.catalog.generated_at,
    }));

    setCategories(loadedCategories);
    setProducts(loadedProducts);
    setModifiers(loadedModifiers);

    setProductForm(prev => {
      const existing = loadedProducts.find(p => p.id === prev.id);
      const toSelect = existing ?? loadedProducts[0];
      return toSelect ? { ...toSelect, ingredients_text: (toSelect.ingredients || []).join('\n') } : blankProduct(loadedCategories[0]?.id ?? 0);
    });
    setCategoryForm(prev => {
      const existing = loadedCategories.find(c => c.id === prev.id);
      const toSelect = existing ?? loadedCategories[0];
      return toSelect ? { id: toSelect.id, name: toSelect.name, sort_order: toSelect.sort_order, is_active: toSelect.is_active } : blankCategory();
    });
    setModifierForm(prev => {
      const existing = loadedModifiers.find(m => m.id === prev.id);
      const toSelect = existing ?? loadedModifiers[0];
      return toSelect ? { id: toSelect.id, name: toSelect.name, price: toSelect.price, modifier_type: toSelect.modifier_type, is_available: toSelect.is_available, is_active: toSelect.is_active } : blankModifier();
    });
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    if (offlineMode) {
      try {
        const stored = await cargarCatalogoPos();
        applyStoredCatalog(stored);
      } catch (cause) {
        console.warn('Error al leer copia local del catálogo:', cause);
        const base = obtenerCatalogoBasePos();
        applyStoredCatalog({ key: 'current', catalog: base, saved_at: new Date().toISOString() });
        setError(cause instanceof Error ? cause.message : 'No se pudo leer la copia local del catálogo. Se cargó el catálogo base.');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const [nextCategories, nextProducts, fetchedModifiers] = await Promise.all([
        solicitarApi<Category[]>('/api/pos/catalog/manage/categories/'),
        solicitarApi<Product[]>('/api/pos/catalog/manage/products/'),
        solicitarApi<Modifier[]>('/api/pos/catalog/manage/modifiers/'),
      ]);
      const nextModifiers: Modifier[] = (fetchedModifiers && fetchedModifiers.length > 0)
        ? fetchedModifiers
        : obtenerCatalogoBasePos().modifiers.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            modifier_type: item.modifier_type,
            is_available: item.is_available ?? true,
            is_active: item.is_active ?? true,
            updated_at: item.updated_at ?? new Date().toISOString(),
          }));
      setCategories(nextCategories);
      setProducts(nextProducts);
      setModifiers(nextModifiers);

      setProductForm(prev => {
        const existing = nextProducts.find(p => p.id === prev.id);
        const toSelect = existing ?? nextProducts[0];
        return toSelect ? { ...toSelect, ingredients_text: (toSelect.ingredients || []).join('\n') } : blankProduct(nextCategories[0]?.id ?? 0);
      });
      setCategoryForm(prev => {
        const existing = nextCategories.find(c => c.id === prev.id);
        const toSelect = existing ?? nextCategories[0];
        return toSelect ? { id: toSelect.id, name: toSelect.name, sort_order: toSelect.sort_order, is_active: toSelect.is_active } : blankCategory();
      });
      setModifierForm(prev => {
        const existing = nextModifiers.find(m => m.id === prev.id);
        const toSelect = existing ?? nextModifiers[0];
        return toSelect ? { id: toSelect.id, name: toSelect.name, price: toSelect.price, modifier_type: toSelect.modifier_type, is_available: toSelect.is_available, is_active: toSelect.is_active } : blankModifier();
      });

      // Guardar respaldo inmediato en almacenamiento local para sesiones offline
      try {
        await guardarCatalogoPos({
          generated_at: new Date().toISOString(),
          categories: nextCategories,
          products: nextProducts,
          modifiers: nextModifiers,
        });
      } catch (storageError) {
        console.warn('No se pudo respaldar el catálogo localmente:', storageError);
      }
    } catch (cause) {
      console.warn('No se pudo cargar el catálogo desde el servidor, usando respaldo local:', cause);
      try {
        const stored = await cargarCatalogoPos();
        applyStoredCatalog(stored);
        setMessage('Sin conexión con el servidor. Se cargó la copia local del catálogo.');
      } catch {
        setError(cause instanceof Error ? cause.message : 'No se pudo cargar el catálogo para editar.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, [offlineMode]);

  const startNew = () => {
    if (offlineMode) return;
    setError('');
    setMessage('');
    if (section === 'products') setProductForm(blankProduct(categories.find(item => item.is_active)?.id ?? categories[0]?.id ?? 0));
    if (section === 'categories') setCategoryForm(blankCategory());
    if (section === 'modifiers') setModifierForm(blankModifier());
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (offlineMode) {
      setError('Modo solo lectura sin conexión. Para modificar precios o agregar productos, debes reconectar con el servidor.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      let path = '';
      let id: number | undefined;
      let body: Record<string, unknown> = {};
      if (section === 'products') {
        id = productForm.id;
        path = '/api/pos/catalog/manage/products/';
        body = { ...productForm, ingredients: productForm.ingredients_text.split('\n').map(value => value.trim()).filter(Boolean) };
        delete body.id;
        delete body.ingredients_text;
      } else if (section === 'categories') {
        id = categoryForm.id;
        path = '/api/pos/catalog/manage/categories/';
        body = categoryForm;
        delete body.id;
      } else {
        id = modifierForm.id;
        path = '/api/pos/catalog/manage/modifiers/';
        body = {
          ...modifierForm,
          price: modifierForm.modifier_type === 'EXCLUSION_COCINA' ? 0 : modifierForm.price,
        };
        delete body.id;
      }
      await solicitarApi(`${path}${id ? `${id}/` : ''}`, { method: id ? 'PATCH' : 'POST', body });
      await loadData();
      setMessage('Cambios guardados. El POS actualizará la carta y el menú automáticamente.');
      window.dispatchEvent(new Event('pos:catalog-updated'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el cambio. Revisa los datos e inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const selectSection = (next: Section) => {
    setSection(next);
    setError('');
    setMessage('');
    if (next === 'products') {
      const target = products.find(p => p.id === productForm.id) ?? products[0];
      if (target) {
        setProductForm({ ...target, ingredients_text: (target.ingredients || []).join('\n') });
      } else {
        setProductForm(blankProduct(categories.find(item => item.is_active)?.id ?? categories[0]?.id ?? 0));
      }
    } else if (next === 'categories') {
      const target = categories.find(c => c.id === categoryForm.id) ?? categories[0];
      if (target) {
        setCategoryForm({ id: target.id, name: target.name, sort_order: target.sort_order, is_active: target.is_active });
      } else {
        setCategoryForm(blankCategory());
      }
    } else {
      const target = modifiers.find(m => m.id === modifierForm.id) ?? modifiers[0];
      if (target) {
        setModifierForm({ id: target.id, name: target.name, price: target.price, modifier_type: target.modifier_type, is_available: target.is_available, is_active: target.is_active });
      } else {
        setModifierForm(blankModifier());
      }
    }
  };

  const selectProduct = (item: Product) => setProductForm({ ...item, ingredients_text: (item.ingredients || []).join('\n') });
  const selectCategory = (item: Category) => setCategoryForm({ id: item.id, name: item.name, sort_order: item.sort_order, is_active: item.is_active });
  const selectModifier = (item: Modifier) => setModifierForm({ id: item.id, name: item.name, price: item.price, modifier_type: item.modifier_type, is_available: item.is_available, is_active: item.is_active });
  const close = onClose;

  const toggleActive = async (item: Product | Category | Modifier) => {
    if (offlineMode || saving) return;
    const isActive = item.is_active;
    const label = section === 'products' ? 'producto' : section === 'categories' ? 'categoría' : 'modificador';
    const confirmed = await confirm({
      title: isActive ? `Retirar ${label} de la carta` : `Restaurar ${label}`,
      message: isActive
        ? section === 'categories'
          ? `“${item.name}” y sus productos dejarán de aparecer en la carta QR y en nuevas ventas. Se conservará el historial y podrás restaurar la categoría después.`
          : `“${item.name}” dejará de aparecer en la carta QR y en nuevas ventas. Se conservará el historial y podrás restaurarlo después.`
        : `“${item.name}” volverá a estar activo. Revisa su disponibilidad y los datos antes de ofrecerlo a los clientes.`,
      confirmLabel: isActive ? 'Retirar de la carta' : 'Restaurar',
      tone: isActive ? 'danger' : 'primary',
    });
    if (!confirmed) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const endpoint = section === 'products' ? 'products' : section === 'categories' ? 'categories' : 'modifiers';
      await solicitarApi(`/api/pos/catalog/manage/${endpoint}/${item.id}/`, { method: 'PATCH', body: { is_active: !isActive } });
      await loadData();
      setMessage(isActive ? `${label[0].toLocaleUpperCase('es-CL') + label.slice(1)} retirado de la carta. El historial se conserva.` : `${label[0].toLocaleUpperCase('es-CL') + label.slice(1)} restaurado.`);
      window.dispatchEvent(new Event('pos:catalog-updated'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el estado. Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const sectionTitle = section === 'products' ? 'Productos' : section === 'categories' ? 'Categorías' : 'Modificadores';
  const sectionSingular = section === 'products' ? 'producto' : section === 'categories' ? 'categoría' : 'modificador';
  const itemsCount = section === 'products' ? products.length : section === 'categories' ? categories.length : modifiers.length;
  const normalizedProductSearch = productSearch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CL').trim();
  const filteredProducts = normalizedProductSearch
    ? products.filter(item => [item.name, item.category_name, item.slug, ...(item.ingredients || [])].some(value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CL').includes(normalizedProductSearch)))
    : products;
  const displayedCount = section === 'products' ? filteredProducts.length : itemsCount;

  return (
    <section className="pos-catalog-workspace" aria-labelledby="pos-catalog-title">
      <div className="pos-catalog-surface">
        <header className="pos-catalog-header">
          <div>
            <p className="pos-catalog-eyebrow">Administración del POS</p>
            <h2 id="pos-catalog-title">Catálogo y menú</h2>
            <p>
              {offlineMode
                ? 'Modo consulta (sin conexión). Los cambios requieren conexión con el servidor.'
                : 'Los cambios se guardan en el servidor y se reflejan en el POS y la carta pública.'}
            </p>
          </div>
          <button type="button" className="pos-back-to-caja" onClick={close} title="Volver a la vista de caja">
            <ArrowLeft aria-hidden="true" />
            <span>VOLVER A CAJA</span>
          </button>
        </header>

        {offlineMode && (
          <div className="pos-catalog-offline" role="status">
            <strong>Modo consulta (sin conexión).</strong> Puedes revisar el catálogo completo, precios e ingredientes. Para modificar precios o agregar productos, debes reconectar con el servidor.
          </div>
        )}

        <div className="pos-catalog-tabs" role="tablist" aria-label="Secciones del catálogo">
          <button type="button" role="tab" aria-selected={section === 'products'} className={section === 'products' ? 'is-active' : ''} onClick={() => selectSection('products')}>
            <Package aria-hidden="true" />
            Productos ({products.length})
          </button>
          <button type="button" role="tab" aria-selected={section === 'categories'} className={section === 'categories' ? 'is-active' : ''} onClick={() => selectSection('categories')}>
            <Archive aria-hidden="true" />
            Categorías ({categories.length})
          </button>
          <button type="button" role="tab" aria-selected={section === 'modifiers'} className={section === 'modifiers' ? 'is-active' : ''} onClick={() => selectSection('modifiers')}>
            <Tag aria-hidden="true" />
            Modificadores ({modifiers.length})
          </button>
        </div>

        <div className="pos-catalog-content">
          <aside className="pos-catalog-list" aria-label={`Lista de ${sectionTitle.toLocaleLowerCase('es-CL')}`}>
            <div className="pos-catalog-list-heading">
              <span>{productSearch && section === 'products' ? `${displayedCount} de ${itemsCount} productos` : `${itemsCount} ${sectionTitle.toLocaleLowerCase('es-CL')}`}</span>
              <button type="button" onClick={startNew} disabled={offlineMode}>
                <CirclePlus aria-hidden="true" />
                Nuevo
              </button>
            </div>

            {section === 'products' && (
              <div className="pos-catalog-search-wrap">
                <label className="sr-only" htmlFor="pos-catalog-product-search">Buscar producto por nombre, categoría o ingredientes</label>
                <Search aria-hidden="true" className="pos-catalog-search-icon" />
                <input
                  id="pos-catalog-product-search"
                  type="search"
                  autoComplete="off"
                  className="pos-product-search-field w-full rounded-xl py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15]/15"
                  value={productSearch}
                  onChange={event => setProductSearch(event.target.value)}
                  onKeyDown={event => { if (event.key === 'Escape') setProductSearch(''); }}
                  placeholder="Buscar producto, categoría o ingrediente…"
                  aria-label="Buscar producto por nombre, categoría o ingredientes"
                />
                {productSearch && (
                  <button type="button" className="pos-catalog-search-clear" aria-label="Limpiar búsqueda" onClick={() => setProductSearch('')}>
                    <X aria-hidden="true" />
                  </button>
                )}
              </div>
            )}

            {loading ? (
              <p className="pos-catalog-muted">Cargando catálogo…</p>
            ) : section === 'products' ? (
              filteredProducts.map(item => (
                <button
                  type="button"
                  key={item.id}
                  className={`pos-catalog-list-item ${productForm.id === item.id ? 'is-selected' : ''}`}
                  onClick={() => selectProduct(item)}
                >
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.category_name} · {money(item.price)}</small>
                  </span>
                  <i className={item.is_active && item.is_available ? 'is-on' : ''}>
                    {item.is_active ? item.is_available ? 'Disponible' : 'Agotado' : 'Inactivo'}
                  </i>
                </button>
              ))
            ) : section === 'categories' ? (
              categories.map(item => (
                <button
                  type="button"
                  key={item.id}
                  className={`pos-catalog-list-item ${categoryForm.id === item.id ? 'is-selected' : ''}`}
                  onClick={() => selectCategory(item)}
                >
                  <span>
                    <strong>{item.name}</strong>
                    <small>Orden {item.sort_order}</small>
                  </span>
                  <i className={item.is_active ? 'is-on' : ''}>
                    {item.is_active ? 'Activa' : 'Inactiva'}
                  </i>
                </button>
              ))
            ) : (
              modifiers.map(item => (
                <button
                  type="button"
                  key={item.id}
                  className={`pos-catalog-list-item ${modifierForm.id === item.id ? 'is-selected' : ''}`}
                  onClick={() => selectModifier(item)}
                >
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.modifier_type === 'EXTRA_PAGO' ? 'Extra pagado' : 'Indicación de cocina'} · {money(item.price)}</small>
                  </span>
                  <i className={item.is_active && item.is_available ? 'is-on' : ''}>
                    {item.is_active ? item.is_available ? 'Disponible' : 'Agotado' : 'Inactivo'}
                  </i>
                </button>
              ))
            )}

            {!loading && displayedCount === 0 && (
              <p className="pos-catalog-muted">
                {section === 'products' && productSearch ? 'No encontramos productos. Prueba con otro nombre o ingrediente.' : `Todavía no hay ${sectionTitle.toLocaleLowerCase('es-CL')}.`}
              </p>
            )}
          </aside>

          <div className="pos-catalog-editor">
            <div className="pos-catalog-editor-heading">
              <div>
                <p>{sectionTitle}</p>
                <h3>
                  {offlineMode
                    ? (section === 'products' ? productForm.id : section === 'categories' ? categoryForm.id : modifierForm.id)
                      ? 'Detalle del registro (solo lectura)'
                      : `Consulta de ${sectionSingular}`
                    : (section === 'products' ? productForm.id : section === 'categories' ? categoryForm.id : modifierForm.id)
                      ? 'Editar registro'
                      : `Agregar ${sectionSingular}`}
                </h3>
              </div>
              <div className="pos-catalog-editor-actions">
                {!offlineMode && (section === 'products' ? productForm.id : section === 'categories' ? categoryForm.id : modifierForm.id) && (
                  <button
                    type="button"
                    className={`pos-catalog-archive ${((section === 'products' ? productForm.is_active : section === 'categories' ? categoryForm.is_active : modifierForm.is_active)) ? '' : 'is-restore'}`}
                    onClick={() => void toggleActive(section === 'products' ? products.find(item => item.id === productForm.id)! : section === 'categories' ? categories.find(item => item.id === categoryForm.id)! : modifiers.find(item => item.id === modifierForm.id)!)}
                    disabled={saving || loading}
                  >
                    {((section === 'products' ? productForm.is_active : section === 'categories' ? categoryForm.is_active : modifierForm.is_active)) ? <><Trash2 aria-hidden="true" />Retirar de la carta</> : <><RotateCcw aria-hidden="true" />Restaurar</>}
                  </button>
                )}
                <button type="button" className="pos-catalog-refresh" onClick={() => void loadData()} disabled={loading || saving}>
                  <RefreshCw aria-hidden="true" />
                  Actualizar lista
                </button>
              </div>
            </div>

            {offlineMode && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200 mb-4" role="status">
                <div className="font-semibold flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
                  Modo solo lectura sin conexión
                </div>
                <p className="text-xs text-amber-300/80 mt-1">
                  Para modificar precios o agregar productos, debes reconectar con el servidor.
                </p>
              </div>
            )}

            {error && <div className="pos-catalog-error" role="alert">{error}</div>}
            {message && <div className="pos-catalog-success" role="status"><Check aria-hidden="true" />{message}</div>}

            {section === 'products' && (
              <form className="pos-catalog-form" onSubmit={save}>
                <label>
                  Nombre del producto
                  <input
                    required
                    maxLength={100}
                    disabled={offlineMode}
                    value={productForm.name}
                    onChange={event => setProductForm({ ...productForm, name: event.target.value })}
                  />
                </label>
                <div className="pos-catalog-form-row">
                  <label>
                    Categoría
                    <select
                      required
                      disabled={offlineMode}
                      value={productForm.category_id || ''}
                      onChange={event => setProductForm({ ...productForm, category_id: Number(event.target.value) })}
                    >
                      <option value="" disabled>Selecciona categoría</option>
                      {categories.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name}{item.is_active ? '' : ' · inactiva'}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Precio (CLP)
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      disabled={offlineMode}
                      value={productForm.price}
                      onChange={event => setProductForm({ ...productForm, price: Number(event.target.value) })}
                    />
                  </label>
                </div>
                <label>
                  Descripción
                  <textarea
                    rows={2}
                    disabled={offlineMode}
                    value={productForm.description}
                    onChange={event => setProductForm({ ...productForm, description: event.target.value })}
                  />
                </label>
                <label>
                  Ingredientes <small>Uno por línea</small>
                  <textarea
                    rows={4}
                    disabled={offlineMode}
                    value={productForm.ingredients_text}
                    onChange={event => setProductForm({ ...productForm, ingredients_text: event.target.value })}
                  />
                </label>
                <div className="pos-catalog-form-row">
                  <label>
                    Precio de referencia (opcional)
                    <input
                      type="number"
                      min="0"
                      step="1"
                      disabled={offlineMode}
                      value={productForm.original_price ?? ''}
                      onChange={event => setProductForm({ ...productForm, original_price: event.target.value === '' ? null : Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    Etiqueta promocional
                    <input
                      maxLength={50}
                      disabled={offlineMode}
                      value={productForm.badge}
                      onChange={event => setProductForm({ ...productForm, badge: event.target.value })}
                    />
                  </label>
                </div>
                <label>
                  Ruta o URL de imagen
                  <input
                    maxLength={500}
                    disabled={offlineMode}
                    value={productForm.image_url}
                    onChange={event => setProductForm({ ...productForm, image_url: event.target.value })}
                    placeholder="/productos/mi-producto.jpg"
                  />
                </label>
                <div className="pos-catalog-switches">
                  <label>
                    <input
                      type="checkbox"
                      disabled={offlineMode}
                      checked={productForm.is_available}
                      onChange={event => setProductForm({ ...productForm, is_available: event.target.checked })}
                    />
                    Disponible para la venta
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      disabled={offlineMode}
                      checked={productForm.is_active}
                      onChange={event => setProductForm({ ...productForm, is_active: event.target.checked })}
                    />
                    Activo en el catálogo
                  </label>
                </div>
                <button
                  className="pos-catalog-save"
                  type="submit"
                  disabled={saving || loading || offlineMode || categories.length === 0}
                >
                  {offlineMode ? 'Modo solo lectura sin conexión' : saving ? 'Guardando…' : 'Guardar producto'}
                </button>
              </form>
            )}

            {section === 'categories' && (
              <form className="pos-catalog-form" onSubmit={save}>
                <label>
                  Nombre de la categoría
                  <input
                    required
                    maxLength={50}
                    disabled={offlineMode}
                    value={categoryForm.name}
                    onChange={event => setCategoryForm({ ...categoryForm, name: event.target.value })}
                  />
                </label>
                <label>
                  Orden de aparición
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    disabled={offlineMode}
                    value={categoryForm.sort_order}
                    onChange={event => setCategoryForm({ ...categoryForm, sort_order: Number(event.target.value) })}
                  />
                </label>
                <div className="pos-catalog-switches">
                  <label>
                    <input
                      type="checkbox"
                      disabled={offlineMode}
                      checked={categoryForm.is_active}
                      onChange={event => setCategoryForm({ ...categoryForm, is_active: event.target.checked })}
                    />
                    Categoría activa
                  </label>
                </div>
                <button
                  className="pos-catalog-save"
                  type="submit"
                  disabled={saving || loading || offlineMode}
                >
                  {offlineMode ? 'Modo solo lectura sin conexión' : saving ? 'Guardando…' : 'Guardar categoría'}
                </button>
              </form>
            )}

            {section === 'modifiers' && (
              <>
                <p className="pos-catalog-note">Los modificadores se ofrecen para todos los productos, según el catálogo actual del POS.</p>
                <form className="pos-catalog-form" onSubmit={save}>
                  <label>
                    Nombre
                    <input
                      required
                      maxLength={50}
                      disabled={offlineMode}
                      value={modifierForm.name}
                      onChange={event => setModifierForm({ ...modifierForm, name: event.target.value })}
                    />
                  </label>
                  <div className="pos-catalog-form-row">
                    <label>
                      Tipo
                      <select
                        disabled={offlineMode}
                        value={modifierForm.modifier_type}
                        onChange={event => {
                          const nextType = event.target.value as Modifier['modifier_type'];
                          setModifierForm({
                            ...modifierForm,
                            modifier_type: nextType,
                            price: nextType === 'EXCLUSION_COCINA' ? 0 : modifierForm.price,
                          });
                        }}
                      >
                        <option value="EXTRA_PAGO">Extra con costo</option>
                        <option value="EXCLUSION_COCINA">Indicación para cocina</option>
                      </select>
                    </label>
                    <label>
                      Precio (CLP)
                      <input
                        required
                        type="number"
                        min="0"
                        step="1"
                        disabled={offlineMode || modifierForm.modifier_type === 'EXCLUSION_COCINA'}
                        value={modifierForm.modifier_type === 'EXCLUSION_COCINA' ? 0 : modifierForm.price}
                        onChange={event => setModifierForm({
                          ...modifierForm,
                          price: modifierForm.modifier_type === 'EXCLUSION_COCINA' ? 0 : Number(event.target.value)
                        })}
                      />
                    </label>
                  </div>
                  <div className="pos-catalog-switches">
                    <label>
                      <input
                        type="checkbox"
                        disabled={offlineMode}
                        checked={modifierForm.is_available}
                        onChange={event => setModifierForm({ ...modifierForm, is_available: event.target.checked })}
                      />
                      Disponible
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        disabled={offlineMode}
                        checked={modifierForm.is_active}
                        onChange={event => setModifierForm({ ...modifierForm, is_active: event.target.checked })}
                      />
                      Activo
                    </label>
                  </div>
                  <button
                    className="pos-catalog-save"
                    type="submit"
                    disabled={saving || loading || offlineMode}
                  >
                    {offlineMode ? 'Modo solo lectura sin conexión' : saving ? 'Guardando…' : 'Guardar modificador'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
        <footer className="pos-catalog-footer">
          <span>Los registros se desactivan para conservar el historial de ventas.</span>
          <button type="button" className="pos-back-to-caja" onClick={close} title="Volver a la vista de caja">
            <ArrowLeft aria-hidden="true" />
            <span>VOLVER A CAJA</span>
          </button>
        </footer>
      </div>
    </section>
  );
}

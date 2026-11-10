import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Archive, Check, CirclePlus, Package, RefreshCw, Tag, X } from 'lucide-react';
import { solicitarApi } from '../services/apiClient';

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
  const dialogRef = useRef<HTMLDialogElement>(null);
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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      const [nextCategories, nextProducts, nextModifiers] = await Promise.all([
        solicitarApi<Category[]>('/api/pos/catalog/manage/categories/'),
        solicitarApi<Product[]>('/api/pos/catalog/manage/products/'),
        solicitarApi<Modifier[]>('/api/pos/catalog/manage/modifiers/'),
      ]);
      setCategories(nextCategories); setProducts(nextProducts); setModifiers(nextModifiers);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar el catálogo para editar.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void loadData(); }, []);

  const startNew = () => {
    setError(''); setMessage('');
    if (section === 'products') setProductForm(blankProduct(categories.find(item => item.is_active)?.id ?? categories[0]?.id ?? 0));
    if (section === 'categories') setCategoryForm(blankCategory());
    if (section === 'modifiers') setModifierForm(blankModifier());
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (offlineMode) { setError('Conecta el POS al servidor para guardar cambios del catálogo.'); return; }
    setSaving(true); setError(''); setMessage('');
    try {
      let path = '';
      let id: number | undefined;
      let body: Record<string, unknown> = {};
      if (section === 'products') {
        id = productForm.id;
        path = '/api/pos/catalog/manage/products/';
        body = { ...productForm, ingredients: productForm.ingredients_text.split('\n').map(value => value.trim()).filter(Boolean) };
        delete body.id; delete body.ingredients_text;
      } else if (section === 'categories') {
        id = categoryForm.id; path = '/api/pos/catalog/manage/categories/'; body = categoryForm; delete body.id;
      } else {
        id = modifierForm.id; path = '/api/pos/catalog/manage/modifiers/'; body = modifierForm; delete body.id;
      }
      await solicitarApi(`${path}${id ? `${id}/` : ''}`, { method: id ? 'PATCH' : 'POST', body });
      await loadData();
      setMessage('Cambios guardados. El POS actualizará la carta y el menú automáticamente.');
      startNew();
      window.dispatchEvent(new Event('pos:catalog-updated'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el cambio. Revisa los datos e inténtalo nuevamente.');
    } finally { setSaving(false); }
  };

  const selectSection = (next: Section) => {
    setSection(next); setError(''); setMessage('');
    if (next === 'products') setProductForm(blankProduct(categories.find(item => item.is_active)?.id ?? categories[0]?.id ?? 0));
    if (next === 'categories') setCategoryForm(blankCategory());
    if (next === 'modifiers') setModifierForm(blankModifier());
  };
  const selectProduct = (item: Product) => setProductForm({ ...item, ingredients_text: item.ingredients.join('\n') });
  const selectCategory = (item: Category) => setCategoryForm({ id: item.id, name: item.name, sort_order: item.sort_order, is_active: item.is_active });
  const selectModifier = (item: Modifier) => setModifierForm({ id: item.id, name: item.name, price: item.price, modifier_type: item.modifier_type, is_available: item.is_available, is_active: item.is_active });
  const close = () => dialogRef.current?.close();

  const sectionTitle = section === 'products' ? 'Productos' : section === 'categories' ? 'Categorías' : 'Modificadores';
  const sectionSingular = section === 'products' ? 'producto' : section === 'categories' ? 'categoría' : 'modificador';
  const itemsCount = section === 'products' ? products.length : section === 'categories' ? categories.length : modifiers.length;

  return <dialog ref={dialogRef} className="pos-catalog-dialog" onClose={onClose} onClick={event => { if (event.target === dialogRef.current) close(); }}>
    <section className="pos-catalog-surface" aria-labelledby="pos-catalog-title">
      <header className="pos-catalog-header">
        <div><p className="pos-catalog-eyebrow">Administración del POS</p><h2 id="pos-catalog-title">Catálogo y menú</h2><p>Los cambios se guardan en el servidor y se reflejan en el POS y la carta pública.</p></div>
        <button type="button" className="pos-catalog-close" aria-label="Cerrar administración del catálogo" onClick={close}><X aria-hidden="true" /></button>
      </header>
      {offlineMode && <div className="pos-catalog-offline" role="status">Estás sin conexión. Puedes revisar el catálogo, pero debes reconectar para modificarlo.</div>}
      <div className="pos-catalog-tabs" role="tablist" aria-label="Secciones del catálogo">
        <button type="button" role="tab" aria-selected={section === 'products'} className={section === 'products' ? 'is-active' : ''} onClick={() => selectSection('products')}><Package aria-hidden="true" />Productos</button>
        <button type="button" role="tab" aria-selected={section === 'categories'} className={section === 'categories' ? 'is-active' : ''} onClick={() => selectSection('categories')}><Archive aria-hidden="true" />Categorías</button>
        <button type="button" role="tab" aria-selected={section === 'modifiers'} className={section === 'modifiers' ? 'is-active' : ''} onClick={() => selectSection('modifiers')}><Tag aria-hidden="true" />Modificadores</button>
      </div>
      <div className="pos-catalog-content">
        <aside className="pos-catalog-list" aria-label={`Lista de ${sectionTitle.toLocaleLowerCase('es-CL')}`}>
          <div className="pos-catalog-list-heading"><span>{itemsCount} {sectionTitle.toLocaleLowerCase('es-CL')}</span><button type="button" onClick={startNew}><CirclePlus aria-hidden="true" />Nuevo</button></div>
          {loading ? <p className="pos-catalog-muted">Cargando catálogo…</p> : section === 'products' ? products.map(item => <button type="button" key={item.id} className={`pos-catalog-list-item ${productForm.id === item.id ? 'is-selected' : ''}`} onClick={() => selectProduct(item)}><span><strong>{item.name}</strong><small>{item.category_name} · {money(item.price)}</small></span><i className={item.is_active && item.is_available ? 'is-on' : ''}>{item.is_active ? item.is_available ? 'Disponible' : 'Agotado' : 'Inactivo'}</i></button>) : section === 'categories' ? categories.map(item => <button type="button" key={item.id} className={`pos-catalog-list-item ${categoryForm.id === item.id ? 'is-selected' : ''}`} onClick={() => selectCategory(item)}><span><strong>{item.name}</strong><small>Orden {item.sort_order}</small></span><i className={item.is_active ? 'is-on' : ''}>{item.is_active ? 'Activa' : 'Inactiva'}</i></button>) : modifiers.map(item => <button type="button" key={item.id} className={`pos-catalog-list-item ${modifierForm.id === item.id ? 'is-selected' : ''}`} onClick={() => selectModifier(item)}><span><strong>{item.name}</strong><small>{item.modifier_type === 'EXTRA_PAGO' ? 'Extra pagado' : 'Indicación de cocina'} · {money(item.price)}</small></span><i className={item.is_active && item.is_available ? 'is-on' : ''}>{item.is_active ? item.is_available ? 'Disponible' : 'Agotado' : 'Inactivo'}</i></button>)}
          {!loading && itemsCount === 0 && <p className="pos-catalog-muted">Todavía no hay {sectionTitle.toLocaleLowerCase('es-CL')}.</p>}
        </aside>
        <div className="pos-catalog-editor">
          <div className="pos-catalog-editor-heading"><div><p>{sectionTitle}</p><h3>{(section === 'products' ? productForm.id : section === 'categories' ? categoryForm.id : modifierForm.id) ? 'Editar registro' : `Agregar ${sectionSingular}`}</h3></div><button type="button" className="pos-catalog-refresh" onClick={() => void loadData()} disabled={loading || saving}><RefreshCw aria-hidden="true" />Actualizar lista</button></div>
          {error && <div className="pos-catalog-error" role="alert">{error}</div>}
          {message && <div className="pos-catalog-success" role="status"><Check aria-hidden="true" />{message}</div>}
          {section === 'products' && <form className="pos-catalog-form" onSubmit={save}>
            <label>Nombre del producto<input required maxLength={100} value={productForm.name} onChange={event => setProductForm({ ...productForm, name: event.target.value })} /></label>
            <div className="pos-catalog-form-row"><label>Categoría<select required value={productForm.category_id || ''} onChange={event => setProductForm({ ...productForm, category_id: Number(event.target.value) })}><option value="" disabled>Selecciona categoría</option>{categories.map(item => <option key={item.id} value={item.id}>{item.name}{item.is_active ? '' : ' · inactiva'}</option>)}</select></label><label>Precio (CLP)<input required type="number" min="0" step="1" value={productForm.price} onChange={event => setProductForm({ ...productForm, price: Number(event.target.value) })} /></label></div>
            <label>Descripción<textarea rows={2} value={productForm.description} onChange={event => setProductForm({ ...productForm, description: event.target.value })} /></label>
            <label>Ingredientes <small>Uno por línea</small><textarea rows={3} value={productForm.ingredients_text} onChange={event => setProductForm({ ...productForm, ingredients_text: event.target.value })} /></label>
            <div className="pos-catalog-form-row"><label>Precio de referencia (opcional)<input type="number" min="0" step="1" value={productForm.original_price ?? ''} onChange={event => setProductForm({ ...productForm, original_price: event.target.value === '' ? null : Number(event.target.value) })} /></label><label>Etiqueta promocional<input maxLength={50} value={productForm.badge} onChange={event => setProductForm({ ...productForm, badge: event.target.value })} /></label></div>
            <label>Ruta o URL de imagen<input maxLength={500} value={productForm.image_url} onChange={event => setProductForm({ ...productForm, image_url: event.target.value })} placeholder="/productos/mi-producto.jpg" /></label>
            <div className="pos-catalog-switches"><label><input type="checkbox" checked={productForm.is_available} onChange={event => setProductForm({ ...productForm, is_available: event.target.checked })} />Disponible para la venta</label><label><input type="checkbox" checked={productForm.is_active} onChange={event => setProductForm({ ...productForm, is_active: event.target.checked })} />Activo en el catálogo</label></div>
            <button className="pos-catalog-save" type="submit" disabled={saving || loading || offlineMode || categories.length === 0}>{saving ? 'Guardando…' : 'Guardar producto'}</button>
          </form>}
          {section === 'categories' && <form className="pos-catalog-form" onSubmit={save}>
            <label>Nombre de la categoría<input required maxLength={50} value={categoryForm.name} onChange={event => setCategoryForm({ ...categoryForm, name: event.target.value })} /></label>
            <label>Orden de aparición<input required type="number" min="0" step="1" value={categoryForm.sort_order} onChange={event => setCategoryForm({ ...categoryForm, sort_order: Number(event.target.value) })} /></label>
            <div className="pos-catalog-switches"><label><input type="checkbox" checked={categoryForm.is_active} onChange={event => setCategoryForm({ ...categoryForm, is_active: event.target.checked })} />Categoría activa</label></div>
            <button className="pos-catalog-save" type="submit" disabled={saving || loading || offlineMode}>{saving ? 'Guardando…' : 'Guardar categoría'}</button>
          </form>}
          {section === 'modifiers' && <><p className="pos-catalog-note">Los modificadores se ofrecen para todos los productos, según el catálogo actual del POS.</p><form className="pos-catalog-form" onSubmit={save}>
            <label>Nombre<input required maxLength={50} value={modifierForm.name} onChange={event => setModifierForm({ ...modifierForm, name: event.target.value })} /></label>
            <div className="pos-catalog-form-row"><label>Tipo<select value={modifierForm.modifier_type} onChange={event => setModifierForm({ ...modifierForm, modifier_type: event.target.value as Modifier['modifier_type'] })}><option value="EXTRA_PAGO">Extra con costo</option><option value="EXCLUSION_COCINA">Indicación para cocina</option></select></label><label>Precio (CLP)<input required type="number" min="0" step="1" value={modifierForm.price} onChange={event => setModifierForm({ ...modifierForm, price: Number(event.target.value) })} /></label></div>
            <div className="pos-catalog-switches"><label><input type="checkbox" checked={modifierForm.is_available} onChange={event => setModifierForm({ ...modifierForm, is_available: event.target.checked })} />Disponible</label><label><input type="checkbox" checked={modifierForm.is_active} onChange={event => setModifierForm({ ...modifierForm, is_active: event.target.checked })} />Activo</label></div>
            <button className="pos-catalog-save" type="submit" disabled={saving || loading || offlineMode}>{saving ? 'Guardando…' : 'Guardar modificador'}</button>
          </form></>}
        </div>
      </div>
      <footer className="pos-catalog-footer"><span>Los registros se desactivan para conservar el historial de ventas.</span><button type="button" onClick={close}>Cerrar</button></footer>
    </section>
  </dialog>;
}

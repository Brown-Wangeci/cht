import ProductGrid from '@/components/products/product-grid/ProductGrid'
import ProductsHeader from '@/components/products/products-header/ProductsHeader';
import { getAllProducts } from '@/lib/products';

async function ProductsPage() {

    const products = await getAllProducts();

  return (
    <div>
      <ProductsHeader />
      <ProductGrid products={products} />
    </div>
  )
}

export default ProductsPage

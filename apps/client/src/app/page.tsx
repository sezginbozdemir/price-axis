import { getServerSupabase } from "@/lib/supabase/server";
import Image from "next/image";

export default async function Home() {
  const supabase = await getServerSupabase();
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .limit(50);

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Error loading products</h2>
          <p className="text-red-600">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <h2 className="text-gray-600 text-xl font-medium">
            No products found
          </h2>
          <p className="text-gray-500 mt-2">Add some products to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Products</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Product Image */}
            <div className="aspect-w-16 aspect-h-9 bg-gray-200">
              <Image
                src={product.image_url}
                alt={product.name}
                className="w-full h-48 object-cover"
                width={100}
                height={100}
              />
            </div>

            {/* Product Info */}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
                  {product.name}
                </h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    product.availability === "in_stock"
                      ? "bg-green-100 text-green-800"
                      : product.availability === "out_of_stock"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {product.availability}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {product.description || "No description available"}
              </p>

              <div className="mb-3">
                <span className="text-xs text-gray-500">
                  Code: {product.product_code}
                </span>
              </div>

              <div className="flex justify-between items-center mb-3">
                <div>
                  {product.discount_price ? (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-red-600">
                        {product.discount_price} {product.currency}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        {product.price} {product.currency}
                      </span>
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-gray-800">
                      {product.price} {product.currency}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                <span>Brand: {product.brand}</span>
                <span>By: {product.advertiser}</span>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {product.category && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {product.category}
                  </span>
                )}
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                  {product.subcategory}
                </span>
              </div>

              <a
                href={product.affiliate_link}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md transition-colors"
              >
                View Product
              </a>

              {product.created_at && (
                <div className="mt-2 text-xs text-gray-400">
                  Added: {new Date(product.created_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Products:</span>
            <span className="ml-2 font-medium">{products.length}</span>
          </div>
          <div>
            <span className="text-gray-600">With Discounts:</span>
            <span className="ml-2 font-medium">
              {products.filter((p) => p.discount_price).length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Brands:</span>
            <span className="ml-2 font-medium">
              {new Set(products.map((p) => p.brand)).size}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Categories:</span>
            <span className="ml-2 font-medium">
              {
                new Set(
                  products.filter((p) => p.category).map((p) => p.category),
                ).size
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

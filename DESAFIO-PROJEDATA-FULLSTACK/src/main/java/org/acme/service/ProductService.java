//ProductService.java
package org.acme.service;

import org.acme.model.Product;
import org.acme.model.RawMaterial;
import org.acme.model.ProductIngredient;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException; 
import jakarta.ws.rs.core.Response;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class ProductService {

    @Transactional
    public void createProduct(Product product) {
        // Verifica duplicidade de nome
        Product existing = Product.find("LOWER(name) = LOWER(?1)", product.name).firstResult();
        if (existing != null) {
            Response response = Response.status(Response.Status.CONFLICT)
                    .entity("The product '" + product.name + "' is already saved.")
                    .type("text/plain") // <--- Força texto puro
                    .build();
            throw new WebApplicationException(response);
        }

        product.id = null;
        prepareIngredients(product);
        product.persist();
    }

    @Transactional
    public Product updateProduct(Long id, Product incomingProduct) {
        Product entity = Product.findById(id);
        if (entity == null) {
            throw new WebApplicationException("Product not found", Response.Status.NOT_FOUND);
        }

        // Verifica duplicidade na edição
        Product existing = Product.find("LOWER(name) = LOWER(?1) AND id != ?2", incomingProduct.name, id).firstResult();
        if (existing != null) {
            Response response = Response.status(Response.Status.CONFLICT)
                    .entity("Already exists a product with this name: " + incomingProduct.name)
                    .type("text/plain") // <--- Força texto puro
                    .build();
            throw new WebApplicationException(response);
        }

        entity.name = incomingProduct.name;
        entity.price = incomingProduct.price;

        entity.ingredients.clear();
        
        if (incomingProduct.ingredients != null) {
            for (ProductIngredient ing : incomingProduct.ingredients) {
                ing.id = null;
                ing.product = entity;
                if (ing.rawMaterial != null && ing.rawMaterial.id != null) {
                    RawMaterial materialReal = RawMaterial.findById(ing.rawMaterial.id);
                    if (materialReal != null) {
                        ing.rawMaterial = materialReal;
                    }
                }
                entity.ingredients.add(ing);
            }
        }
        
        return entity;
    }

    private void prepareIngredients(Product product) {
        if (product.ingredients != null) {
            for (ProductIngredient ing : product.ingredients) {
                ing.id = null;
                ing.product = product;
                if (ing.rawMaterial != null && ing.rawMaterial.id != null) {
                    RawMaterial materialReal = RawMaterial.findById(ing.rawMaterial.id);
                    if (materialReal != null) {
                        ing.rawMaterial = materialReal;
                    }
                }
            }
        }
    }

    public List<Product> listAll() {
        return Product.listAll();
    }

    public Map<String, Object> calculateProductionSuggestion() {
        List<Product> allProducts = Product.listAll();
        List<RawMaterial> materials = RawMaterial.listAll();
        
        Map<Long, Double> virtualStock = materials.stream()
            .collect(Collectors.toMap(
                m -> m.id, 
                m -> m.stockQuantity != null ? m.stockQuantity : 0.0
            ));

        allProducts.sort((a, b) -> {
            int priceCompare = Double.compare(b.price, a.price);
            if (priceCompare != 0) return priceCompare;

            long canProduceA = calculateMaxPossible(a, virtualStock);
            long canProduceB = calculateMaxPossible(b, virtualStock);
            return Long.compare(canProduceB, canProduceA);
        });

        List<Map<String, Object>> suggestions = new ArrayList<>();
        double totalValue = 0.0;

        for (Product product : allProducts) {
            if (product.ingredients == null || product.ingredients.isEmpty()) continue;

            int unitsProduced = 0;
            boolean canProduceMore = true;

            while (canProduceMore) {
                for (ProductIngredient ing : product.ingredients) {
                    if (ing.rawMaterial == null || ing.rawMaterial.id == null) {
                        canProduceMore = false;
                        break;
                    }
                    double currentStock = virtualStock.getOrDefault(ing.rawMaterial.id, 0.0);
                    if (currentStock < ing.quantityNeeded) {
                        canProduceMore = false;
                        break;
                    }
                }

                if (canProduceMore) {
                    for (ProductIngredient ing : product.ingredients) {
                        double current = virtualStock.get(ing.rawMaterial.id);
                        virtualStock.put(ing.rawMaterial.id, current - ing.quantityNeeded);
                    }
                    unitsProduced++;
                }
            }

            if (unitsProduced > 0) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", product.id);
                item.put("productId", product.id);
                item.put("name", product.name);
                item.put("suggestedQty", unitsProduced);
                item.put("quantity", unitsProduced);
                item.put("price", product.price);
                item.put("unitPrice", product.price);
                item.put("totalValue", unitsProduced * product.price);
                item.put("subtotal", unitsProduced * product.price);
                
                suggestions.add(item);
                totalValue += (unitsProduced * product.price);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("products", suggestions); 
        response.put("suggestion", suggestions); 
        response.put("totalValue", totalValue);
        response.put("totalEstimatedValue", totalValue);
        
        return response;
    }

    private long calculateMaxPossible(Product p, Map<Long, Double> stock) {
        if (p.ingredients == null || p.ingredients.isEmpty()) return 0;
        long min = Long.MAX_VALUE;
        for (ProductIngredient ing : p.ingredients) {
            if (ing.rawMaterial == null || ing.rawMaterial.id == null) return 0;
            double available = stock.getOrDefault(ing.rawMaterial.id, 0.0);
            long possibleWithThisIng = (long) (available / ing.quantityNeeded);
            if (possibleWithThisIng < min) min = possibleWithThisIng;
        }
        return min == Long.MAX_VALUE ? 0 : min;
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product.deleteById(id);
    }
}
package org.acme.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.util.List;
import java.util.ArrayList;

@Entity
public class Product extends PanacheEntity {
    public String name;
    public Double price;

    // CascadeType.ALL é essencial para que ao salvar o Produto, 
    // os ingredientes vinculados também sejam salvos automaticamente.
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id")
    public List<ProductIngredient> ingredients = new ArrayList<>();

    // Construtor padrão necessário para o Hibernate e desserialização JSON
    public Product() {}
}
package org.acme.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

@Entity
public class ProductIngredient extends PanacheEntity {

    @ManyToOne
    @JoinColumn(name = "product_id")
    @JsonBackReference // Evita o loop infinito no JSON
    public Product product;

    // Se o seu sistema armazena a referência completa do Material:
    @ManyToOne
    @JoinColumn(name = "rawmaterial_id")
    public RawMaterial rawMaterial;

    // Se o seu frontend envia apenas o ID e o Nome como strings/números simples:
    // public Long materialId;
    // public String materialName;

    public Double quantityNeeded;

    // CONSTRUTOR PADRÃO: Essencial para evitar o Erro 500 na desserialização
    public ProductIngredient() {
    }
}